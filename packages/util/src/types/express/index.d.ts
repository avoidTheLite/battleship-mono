import Logger from "../../Logger.ts";

export {}

declare global {
    namespace Express {
        export interface Request {
            log: Logger
        }
    }
}