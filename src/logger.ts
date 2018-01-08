import * as winston from 'winston';

export const logger = new (winston.Logger)({
    level: process.env.LOG_LEVEL || 'debug',
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({ filename: 'logs/audit.log' })
    ]
});
