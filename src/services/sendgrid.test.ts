import * as dotenv from 'dotenv';
dotenv.config();

import * as sendgrid from './sendgrid';
import fetch from 'node-fetch';
import { MailService } from '../models/MailService';

const validMessage = {
    "to": ["nathan@mors.me"],
    "from": "nathan@mors.me",
    "subject": "Valid Subject",
    "text": "This should work"
};

const fakeFetch = async () => {
    return  {
        status: 202
    }
}

const brokenFetch = async () => {
    return  {
        status: 500
    }
}

describe('createService function tests', () => {

    test('generates a MailService named sendgrid', () => {
        const sendgridService = sendgrid.createService(fetch);
        expect(sendgridService.name).toBe('sendgrid');
    });

    test('generates a MailService with a send function', () => {
        const sendgridService = sendgrid.createService(fetch);
        expect(typeof sendgridService.send).toBe('function');
    });

});


describe('sendgrid MailService tests', () => {

    test('send function calls mocked fetch', () => {
        const mockFetch = jest.fn();
        const sendgridService = sendgrid.createService(mockFetch);
        sendgridService.send(validMessage);
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('send function calls real fetch', () => {
        const realFetch = jest.fn(fetch);
        const sendgridService = sendgrid.createService(realFetch);
        sendgridService.send(validMessage);
        expect(realFetch).toHaveBeenCalledTimes(1);
    });

    test('send function calls mocked fetch and returns proper status', async () => {
        const mockFetch = jest.fn(fakeFetch);
        const sendgridService = sendgrid.createService(mockFetch);
        const result = await sendgridService.send(validMessage);
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(result).toBe(true);
    });

    test('send function throws when server returns 500 status', async () => {
        const mockFetch = jest.fn(brokenFetch);
        const sendgridService = sendgrid.createService(mockFetch);
        await expect(sendgridService.send(validMessage)).rejects.toEqual(new Error('Invalid response'));
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

});