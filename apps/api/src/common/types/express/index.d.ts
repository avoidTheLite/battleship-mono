import Logger from "@battleship/util/Logger";

export {}

declare global {
    namespace Express {
        export interface Request {
            log: Logger
        }
    }
}