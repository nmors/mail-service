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
    private readonly maximumRetries = 10;
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
                // timestamp: firebase.database.ServerValue.TIMESTAMP,
                timestamp: Date.now(),
            }))
            .then((emailSnapshot: DataSnapshot) => {
                const id = emailSnapshot.key;
                res.json({
                    id,
                    status: 'pending',
                });
            });
        };
    }

    /**
     * start listening for pending emails in firebase
     */
    private listenForPendingEmails() {
        firebase.database()
            .ref('/emails')
            .orderByChild('status')
            .equalTo('pending')
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
                this.listenForAttempt(emailSnapshot, message);

                logger.debug('creating Initial attempt for email with id=' + emailSnapshot.key);
                this.createNewAttempt(emailReference, Date.now() + 5000);
                return;
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

    /**
     * Listen for pending attempts with a timestamp less then now, which has not yet exceeded the failedAttemptCount.
     *
     * @param emailReference
     * @param message
     */
    private listenForAttempt(emailSnapshot: DataSnapshot, message: Message) {
        const emailReference: Reference = emailSnapshot.ref;
        emailReference
            .child('attempts')
            .orderByChild('status')
            .equalTo('pending')
            .on('child_added', (attemptSnapshot: DataSnapshot) => {
                const attemptNo = attemptSnapshot.val().attemptNo;
                const timestamp = attemptSnapshot.val().timestamp;
                const tryToSendInMillis = timestamp - Date.now() || 0;
                if (attemptNo > this.maximumRetries) {
                    logger.debug('exceeded max retries! email id=' + emailReference.key);
                    return;
                }
                logger.debug(`detected pending attempt no=${attemptNo} that will execute in ${tryToSendInMillis} milliseconds id=${attemptSnapshot.key}`);
                setTimeout(() => this.sendQueuedMessage(message, emailReference, attemptSnapshot), tryToSendInMillis);
            },
            (error: Error) => logger.debug('failed to add attempt listener')
        );
    }

    private sendQueuedMessage(message: Message, emailReference: Reference, attemptSnapshot: DataSnapshot) {
        this.sendMail(message)
            .then(sendMailResult => {
                if (sendMailResult) {
                    this.setStatus(attemptSnapshot.ref, 'success');
                    this.setStatus(emailReference, 'success');
                } else {
                    throw new Error('sendMail failed.')
                }
            }).catch(err => {
                logger.error(`email message failed to send with id=${emailReference.key} and attempt id=${attemptSnapshot.key}`);
                this.setStatus(attemptSnapshot.ref, 'failed');
                this.scheduleRetry(emailReference);
            });
    }

    private scheduleRetry(emailReference: Reference) {
        emailReference.transaction((email: any) => {
            if (email) {
                const failedAttemptCount: number = email.attempts ? Object.keys(email.attempts).length : 0;
                email.failedAttemptCount = failedAttemptCount;
            }
            return email;
        }, (err, b, email) => {
            if (email) {
                const millisToWaitBeforeNextAttempt: number = (Math.exp(email.val().failedAttemptCount) * 1000) + 10000;
                this.createNewAttempt(emailReference, Date.now() + millisToWaitBeforeNextAttempt, email.val().failedAttemptCount);
            }
        });
    }

    private createNewAttempt(emailReference: Reference, timestamp = Date.now(), attemptNo = 0) {
        emailReference
            .child('attempts')
            .push({
                status: 'pending',
                timestamp,
                attemptNo,
            })
            .then(({key}: DataSnapshot) => {
                logger.error(`created a new attempt id=${key} for email id=${emailReference.key} scheduled for=${timestamp} which is in ${(timestamp - Date.now()) / 1000} seconds`);
            });
    }
}
