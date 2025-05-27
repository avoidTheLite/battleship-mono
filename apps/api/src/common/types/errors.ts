interface StandardErrorArgs {
    name?: string,
    message: string
}

export class GameNotFoundError extends Error {
    name: string
    constructor(args: StandardErrorArgs) {
        super(args.message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = args.name || 'GameNotFoundError';
    }
}

export class PlayerNotFoundError extends Error {
    name: string
    constructor(args: StandardErrorArgs) {
        super(args.message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = args.name || 'PlayerNotFoundError';
    }
}

export class NewGameError extends Error {
    name: string
    constructor(args: StandardErrorArgs) {
        super(args.message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = args.name || 'NewGameError';
    }
}

export class DeployError extends Error {
    name: string
    constructor(args: StandardErrorArgs) {
        super(args.message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = args.name || 'DeployError';
    }
}