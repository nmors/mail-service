
export interface Message {
    from: string;
    to: string[];
    subject: string;
    text: string;
}

export interface MailService {
    name: string,
    send: (message: Message) => Promise<boolean|void>;
}
