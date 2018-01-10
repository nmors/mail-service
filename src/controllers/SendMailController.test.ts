import { MailService } from '../models/MailService';
import { SendMailController } from './SendMailController';

const validMessage = {
    "to": ["nathan@mors.me"],
    "from": "nathan@mors.me",
    "subject": "Valid Subject",
    "text": "This should work"
};

const createWorkingMockMailService = (name): MailService => {
    return {
        name,
        async send(message) { return true; }
    }
};

const createFailingMockMailService = (name): MailService => {
    return {
        name,
        async send(message) { throw new Error('Mail service down.'); }
    }
};

const generateLotsOfWorkingServices = function*(numberOfServices) {
    for (let i = 0; i < numberOfServices; i++) {
        yield createWorkingMockMailService('WorkingMailService' + i);
    }
}

const generateLotsOfFailingServices = function*(numberOfServices) {
    for (let i = 0; i < numberOfServices; i++) {
        yield createFailingMockMailService('FailingMailService' + i);
    }
}

beforeEach(() => {});
afterEach(() => {});

describe('sendMail method tests', () => {
    test('will send a message with 2 working MailServices', async () => {
        const sendMailController: SendMailController = new SendMailController(
            ...generateLotsOfWorkingServices(2),
        );
        await expect(sendMailController.sendMail(validMessage)).resolves.toBe(true);
    });

    test('will send a message with 100 working MailServices', async () => {
        const sendMailController: SendMailController = new SendMailController(
            ...generateLotsOfWorkingServices(100),
        );
        await expect(sendMailController.sendMail(validMessage)).resolves.toBe(true);
    });

    test('will send a message when 3/4 services are down', async () => {
        const sendMailController: SendMailController = new SendMailController(
            ...generateLotsOfFailingServices(3),
            ...generateLotsOfWorkingServices(1),
        );
        await expect(sendMailController.sendMail(validMessage)).resolves.toBe(true);
    });

    test('will not send a message when 4/4 services are down', async () => {
        const sendMailController: SendMailController = new SendMailController(
            ...generateLotsOfFailingServices(4),
        );
        await expect(sendMailController.sendMail(validMessage)).resolves.toBe(false);
    });

    test('will still send a message if 9/10 services are down', async () => {
        const sendMailController: SendMailController = new SendMailController(
            ...generateLotsOfFailingServices(9),
            ...generateLotsOfWorkingServices(1),
        );
        await expect(sendMailController.sendMail(validMessage)).resolves.toBe(true);
    });

    test('will still send a message if 49/50 services are down', async () => {
        const sendMailController: SendMailController = new SendMailController(
            ...generateLotsOfFailingServices(49),
            ...generateLotsOfWorkingServices(1),
        );
        await expect(sendMailController.sendMail(validMessage)).resolves.toBe(true);
    });

    test.skip('will not send a message if it has undefined to field', async () => {
        const sendMailController: SendMailController = new SendMailController(
            ...generateLotsOfWorkingServices(2),
        );
        await expect(sendMailController.sendMail(
            Object.assign({}, validMessage, {to: undefined})
        )).resolves.toBe(false);;
    });

    test.skip('will not send a message if it has undefined from field', async () => {
        const sendMailController: SendMailController = new SendMailController(
            ...generateLotsOfWorkingServices(2),
        );
        await expect(sendMailController.sendMail(
            Object.assign({}, validMessage, {from: undefined})
        )).resolves.toBe(false);;
    });
});

describe('getMiddleware method tests', () => {
    test('can get express middleware', () => {
        const sendMailController: SendMailController = SendMailController.bootstrap();
        const middleware = sendMailController.getMiddleware();
    });
});
