import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as fs from 'fs';
import * as jsyaml from 'js-yaml';
import * as path from 'path';
import * as swaggerTools from 'swagger-tools';
import { logger } from './logger';
import { SendMailController } from './controllers/SendMailController';

export class Server {

    private application: express.Application;
    private port: number;
    private sendMailController: SendMailController;
    private apiSpecification: string = path.join(__dirname, 'api.yaml');
    private swaggerDoc: any;

    constructor(
        application: express.Application = express(),
        port: number = parseInt(process.env.PORT || '3050'),
        sendMailController: SendMailController = SendMailController.bootstrap(),
    ) {
        this.application = application;
        this.port = port;
        this.sendMailController = sendMailController;

        this.swaggerDoc = jsyaml.safeLoad(fs.readFileSync(this.apiSpecification, 'utf8'));
    }

    /**
     * Starts the server
     */
    public async start() {
        const {
            swaggerValidator,
            swaggerUi,
        }: any = await this.getSwaggerMiddleware(this.swaggerDoc);
        this.application.use(bodyParser.json());
        this.application.use(swaggerValidator());
        this.application.use(this.router);
        this.application.use(swaggerUi());

        this.application.listen(this.port, () => logger.info(`Example app listening on port ${this.port}`));
    }

    /**
     * returns an express router for the server
     */
    private get router() {
        const router: express.Router = express.Router();

        router.post('/message', this.sendMailController.getMiddleware());

        return router;
    }

    /**
     * returns swagger middleware so we can get nice API documentation UI
     */
    private getSwaggerMiddleware(swaggerDoc: any) {
        return new Promise(resolve => {
            swaggerTools.initializeMiddleware(swaggerDoc, (middleware) => {
                resolve(middleware);
            });
        });
    }
}
