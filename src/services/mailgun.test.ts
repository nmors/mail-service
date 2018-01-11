import * as dotenv from 'dotenv';
dotenv.config();

import * as mailgun from './mailgun';
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
        status: 200
    }
}

const brokenFetch = async () => {
    return  {
        status: 500
    }
}

describe('createService function tests', () => {

    test('generates a MailService named mailgun', () => {
        const mailgunService = mailgun.createService(fetch);
        expect(mailgunService.name).toBe('mailgun');
    });

    test('generates a MailService with a send function', () => {
        const mailgunService = mailgun.createService(fetch);
        expect(typeof mailgunService.send).toBe('function');
    });

});


describe('mailgun MailService tests', () => {

    test('send function calls mocked fetch', () => {
        const mockFetch = jest.fn();
        const mailgunService = mailgun.createService(mockFetch);
        mailgunService.send(validMessage);
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('send function calls real fetch', () => {
        const realFetch = jest.fn(fetch);
        const mailgunService = mailgun.createService(realFetch);
        mailgunService.send(validMessage);
        expect(realFetch).toHaveBeenCalledTimes(1);
    });

    test('send function calls mocked fetch and returns proper status', async () => {
        const mockFetch = jest.fn(fakeFetch);
        const mailgunService = mailgun.createService(mockFetch);
        const result = await mailgunService.send(validMessage);
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(result).toBe(true);
    });

    test('send function throws when server returns 500 status', async () => {
        const mockFetch = jest.fn(brokenFetch);
        const mailgunService = mailgun.createService(mockFetch);
        await expect(mailgunService.send(validMessage)).rejects.toEqual(new Error('Invalid response'));
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

});