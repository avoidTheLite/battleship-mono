import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import config from './config';
import { logMiddleware, logError } from '@battleship/util/logMiddleware';
import Logger, { LogLevel } from '@battleship/util/Logger';

const logger = Logger.configure({
    logLevel: config.get('logLevel') as LogLevel,
    doc: 'app.ts'
});

const app: Express = express();
app.use(cors());
app.use(logMiddleware(logger));



app.use(logError());

export default app;