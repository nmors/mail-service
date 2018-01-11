
import * as bluebird from 'bluebird';
import * as express from 'express';
import * as mailgun from '../services/mailgun';
import * as sendgrid from '../services/sendgrid';
import fetch, { RequestInit, Response } from 'node-fetch';
import { logger } from '../logger';
import { MailService, Message } from '../models/MailService';
import firebaseDatabase from '../database/firebase';
import { DataSnapshot } from '@firebase/database/dist/esm/src/api/DataSnapshot';
import { Reference } from '@firebase/database/dist/esm/src/api/Reference';
import { FirebaseDatabase } from '@firebase/database-types';
import * as fs from 'fs';
import * as path from 'path';


export class MailStatusController {
    private database: FirebaseDatabase;

    constructor(
        database: FirebaseDatabase,
    ) {
        this.database = database;
    }

    public static bootstrap(
        database: FirebaseDatabase = firebaseDatabase,
    ) {
        return new MailStatusController(database);
    }

    /**
     * Returns an express Request handler (middleware) that can be applied to an API route.
     */
    public getMiddleware(): express.RequestHandler {
        return async (req: express.Request, res: express.Response) => {
            const emailState: DataSnapshot = await this.database
                .ref('/emails/' + req.params.id)
                .once('value')

            if (!emailState) {
                return res.status(500).json({
                    message: 'not found',
                    id: req.params.id
                });
            }

            return res.json(emailState.exportVal());
        };
    }
}
