import { logger } from '../logger';
import { MailService } from '../models/MailService';
import { RequestInit, Response } from 'node-fetch';

/**
 * This is the format which sendgrid API expects its request body to be in
 */
export interface SendgridMessage {
    personalizations: [{
        to: [{
            email: string;
        }];
    }];
    from: {
        email: string;
    }
    subject: string;
    content: [{
        type: string;
        value: string;
    }]
}

/**
 * returns a simple MailService that uses the *sendgrid*
 * service to deliver a message using the send() function
 *
 * @param fetch HTTP client
 */
export const createService = (fetch: any): MailService => {

    return {
        name: 'sendgrid',
        async send(message) {
            logger.info('attempting to send a message with sendgrid');

            const url = `https://api.sendgrid.com/v3/mail/send`;

            const data: SendgridMessage = {
                personalizations: [{
                    to: [{
                        email: message.to,
                    }]
                }],
                from: {
                    email: message.from,
                },
                subject: message.subject,
                content: [{
                    type: "text/plain",
                    value: message.text,
                }]
            };

            const body: BodyInit = JSON.stringify(data);

            const options: RequestInit = {
                method: 'POST',
                body,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
                }
            };

            const response: Response = await fetch(url, options);

            if (response && response.status === 202) {
                return true;
            }

            throw new Error('Invalid response');
        }
    }

}
