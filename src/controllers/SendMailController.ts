import * as dotenv from 'dotenv';
dotenv.config();

import * as bluebird from 'bluebird';
import * as express from 'express'; 
import * as mailgun from '../services/mailgun';
import * as sendgrid from '../services/sendgrid';
import fetch, { RequestInit, Response } from 'node-fetch';
import { logger } from '../logger';
import { MailService, Message } from '../models/MailService';
import firebase from '../database/firebase';
import { DataSnapshot } from '@firebase/database/dist/esm/src/api/DataSnapshot';
import { Reference } from '@firebase/database/dist/esm/src/api/Reference';

export class SendMailController {
    private mailServices: MailService[];

    /**
     * @param mailServices you can inject as many MailServices as you want here for extra reliability
     */
    constructor(
        ...mailServices: MailService[],
    ) {
        this.mailServices = [ ...mailServices ];
        this.listenForPendingEmails();
    }

    /**
     * returns a new instance of the SendMailController with some MailServices injected.
     * bootstrap technique is used to provide an extra layer of dependency injection which makes writing unit tests easier
     *
     * @param fetchProvider http client library used to send mail - defaults to node-fetch if none specified
     */
    public static bootstrap(
        fetchProvider: any = fetch,
    ) {
        return new SendMailController(
            mailgun.createService(fetchProvider),
            sendgrid.createService(fetchProvider),
        );
    }

    /**
     * Given a message to send, Returns a reducer function which can be applied to an array of MailServices.
     * The reducer will immediately return true if the previous service succesfully sent the message already.
     *
     * @param message the message that we should try to send
     */
    private getMailServiceReducer = (message: Message) => (wasSuccessful: boolean, mailService: MailService) =>
        wasSuccessful || mailService.send(message)
            .then((sendResult: any) => {
                logger.info(`successfully sent your message with ${mailService.name}!`)
                return sendResult
            })
            .catch((err: Error) => logger.error(`There was an error sending with ${mailService.name}: ${err.message}` ))

    /**
     * Attempts to send the given message with all of the defined mailServices with reduce.
     * If all of the MailServices throws errors, the final return value will be undefined
     *
     * @param message the message that we should try to send (all services)
     */
    public async sendMail(message: Message): Promise<boolean> {
        const sentMessage = await bluebird.reduce(this.mailServices, this.getMailServiceReducer(message), false);

        if (!sentMessage) {
            logger.error(`we tried really hard, but all of our mail services (${this.mailServices.map(x => x.name)}) refused to send our message!`);
            return false;
        }

        return sentMessage;
    }

    /**
     * Returns an express Request handler (middleware) that can be applied to an API route.
     */
    public getMiddleware(): express.RequestHandler {
        return (req: express.Request, res: express.Response) => {
            logger.debug(req.body);
            const emailsRef = firebase.database().ref('/emails');

            emailsRef.push(Object.assign({}, req.body, {
                status: 'pending',
                timestamp: firebase.database.ServerValue.TIMESTAMP,
            }))
            .then((emailSnapshot: DataSnapshot) => {
                const id = emailSnapshot.key;
                res.json({
                    id,
                    status: 'pending',
                });
            });
            // .catch((err: Error) => {
            //     res.status(500).json({
            //         message: 'failed to queue!'
            //     })
            // });
        };
    }

    private listenForPendingEmails() {
        firebase.database()
            .ref('/emails')
            .orderByChild('status')
            .equalTo('pending')
            .orderByPriority()
            .on('child_added', (emailSnapshot: DataSnapshot | any) => {
                if (!emailSnapshot) {
                    return logger.debug('could not get pending emails!');
                }
                const emailReference: Reference = emailSnapshot.ref;
                const message: Message = {
                    to: emailSnapshot.val().to,
                    from: emailSnapshot.val().from,
                    subject: emailSnapshot.val().subject,
                    text: emailSnapshot.val().text,
                }

                logger.debug('listening for attempts...')
                this.listenForAttempt(emailReference, message);

                logger.debug('creating new attempt');
                this.createNewAttempt(emailReference);
                return;
            })
    }

    // Update the attempt count. This is probably not really needed! remove?
    private updateAttemptCount(emailRef: Reference) {
        emailRef.transaction(function(email: any) {
          if (email) {
            email.attemptCount = email.attempts ? Object.keys(email.attempts).length : 0;
          }
          return email;
        });
    }

    private setStatus(ref: Reference, status: string) {
        ref.transaction(function(obj: any) {
            if (obj) {
                obj.status = status;
            }
            return obj;
        });
    }

    private listenForAttempt(emailReference: Reference, message: Message) {
        emailReference
            .child('attempts')
            .orderByChild('status')
            .equalTo('pending')
            .on('child_added', (attemptSnapshot: DataSnapshot) => {
                this.sendMail(message)
                    .then(sendMailResult => {
                        if (sendMailResult) {
                            this.setStatus(attemptSnapshot.ref, 'success');
                            this.setStatus(emailReference, 'success');
                        } else {
                            this.setStatus(attemptSnapshot.ref, 'failed');
                        }
                    }).catch(err => {

                    })
                    logger.debug('detected new attempt');
                    logger.debug('set status to success!');
            },
            (error: Error) => logger.debug('failed to add attempt listener')
        );
    }

    private createNewAttempt(emailReference: Reference) {
        // Create a new attempt
        emailReference
            .child('attempts')
            .push({
                provider: 'mailgrid',
                status: 'pending',
                timestamp: firebase.database.ServerValue.TIMESTAMP,
            })
            .then(({key}: DataSnapshot) => {});

        // Update the attempt count. This is probably not really needed!
        emailReference
            .child('attempts').on('value',
            (dataSnapshot: DataSnapshot) => this.updateAttemptCount(emailReference),
            (error: Error) => logger.debug('failed to update attempt count'),
        );
    }
}
