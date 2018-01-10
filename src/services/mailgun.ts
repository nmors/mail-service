import * as base64 from 'base-64';
import * as FormData from 'form-data';
import { logger } from '../logger';
import { MailService } from '../models/MailService';
import { RequestInit, Response } from 'node-fetch';

/**
 * This is the format which mailgun API expects its request body to be in
 */
export interface MailgunMessage {
    from: string;
    to: string[];
    subject: string;
    text: string;
}

/**
 * returns a simple MailService that uses the *mailgun*
 * service to deliver a message using the send() function
 *
 * @param fetch HTTP client
 */
export const createService = (fetch: any): MailService => {

    return {
        name: 'mailgun',
        async send(message) {
            logger.info('attempting to send a message with mailgun');

            const url = `https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}/messages`;

            // Mailgun happens to accept data in almost the same way the MailService model was designed
            const data: MailgunMessage | any = Object.assign({}, message, {
                to: message.to.join(',')
            });

            const body: BodyInit = new FormData();
            for (const key in message) {
                body.append(key, data[key]);
            }

            const options: RequestInit = {
                method: 'POST',
                body,
                headers: {
                    'Authorization': 'Basic ' + base64.encode(`api:key-${process.env.MAILGUN_API_KEY}`)
                }
            };

            const response: Response = await fetch(url, options);

            if (response && response.status === 200) {
                return true;
            }

            throw new Error('Invalid response');
        }
    }

}
