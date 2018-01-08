import * as bluebird from 'bluebird';
import * as express from 'express';
import * as mailgun from '../services/mailgun';
import * as sendgrid from '../services/sendgrid';
import fetch, { RequestInit, Response } from 'node-fetch';
import { logger } from '../logger';
import { MailService, Message } from '../models/MailService';

export class SendMailController {
    private mailServices: MailService[];

    /**
     * @param mailServices you can inject as many MailServices as you want here for extra reliability
     */
    constructor(...mailServices: MailService[]) {
        this.mailServices = [ ...mailServices ];
    }

    /**
     * returns a new instance of the SendMailController with a some MailServices injected.
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
            this.sendMail(req.body)
                .then(sendMailResult => {

                    if (sendMailResult) {
                        return res.json({result: 'success'});
                    }

                    return res.status(500)
                              .json({result: 'error'});
                })
        };
    }
}
