import { Request, Response, NextFunction } from 'express';
import Logger from '../Logger.js';

export function logMiddleware(logger: Logger) {
    return (req: Request, res: Response, next: NextFunction): void => {
        req.log = Logger;
        next();
    };
}

export function logError() {
    return (
        err: Error,
        req: Request,
        res: Response,
        next: NextFunction
    ): void => {
        if (err) {
            // if (req.log) {
            //     req.log.error(`Error received: ${err.message}`, { error: err });
            //     next(err);
            // } else {
                const logger = Logger.configure()
                logger.error(`Error received: ${err.message}`, { error: err });
                next(err);
            // }
        }
        next();
    }
}