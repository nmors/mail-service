import * as dotenv from 'dotenv';
dotenv.config();

import { logger } from './logger';
import { Server } from './api/Server';

const server = new Server();
server.start();

logger.info('Server started!')
