import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import config from './config.ts';
import { logMiddleware, logError } from '@battleship/util/logMiddleware';
import Logger, { type LogLevel } from '@battleship/util/Logger';
import gameRouter from './game/gameRouter.ts';

const logger = Logger.configure({
    logLevel: config.get('logLevel') as LogLevel,
    doc: 'app.ts'
});

const app: Express = express();
app.use(cors());
app.use(logMiddleware(logger));

app.use('/game', gameRouter);
app.use(logError());

export default app;