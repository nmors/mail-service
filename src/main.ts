import * as dotenv from 'dotenv';
import { logger } from './logger';
import { SendMailController } from './controllers/sendMailController';
import { Server } from './Server';

dotenv.config();

const server = new Server();
server.start();

logger.info('Server started!')
