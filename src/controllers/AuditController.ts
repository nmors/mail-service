import * as express from 'express';
import { logger } from '../logger';
import * as fs from 'fs';
import * as path from 'path';

export class AuditController {
    private readonly logLocation = '../../logs/audit.log';

    constructor() {}

    public static bootstrap() {
        return new AuditController();
    }

    /**
     * Returns an express Request handler (middleware) that can be applied to an API route.
     */
    public getMiddleware(): express.RequestHandler {
        return (req: express.Request, res: express.Response) => {

            const logFile: string = path.join(__dirname, this.logLocation);
            const readOptions = {encoding: 'utf8'};

            fs.readFile(logFile, readOptions, (error: Error, auditLogData: string) => {
                if (error) {
                    logger.error('couldn\'t retrieve audit logs: ' + error.message);
                    return res.status(500).send(error.message);
                }

                logger.error('successfully retrieved audit logs!')
                return res.send(auditLogData);
            });

        };
    }
}
