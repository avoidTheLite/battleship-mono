import { Request, Response } from 'express';

function gameController() {
    async function newGame(
        req: Request,
        res: Response
    ) {
        console.log('New game - initializing');
        res.send('NEW GAME');
    }
    async function getGame(
        req: Request,
        res: Response
    ) {
        const gameId = req.params.id;
        console.log('Loading game: ' + gameId);
        res.send('LOAD GAME  ' + gameId);
    }
    async function deploy(
        req: Request,
        res: Response
    ) {
        const gameId = req.params.id;
        const deployBoard = req.body;
        console.log('Deployment initiated: ' + gameId + ' - ' + JSON.stringify(deployBoard));
        res.send('DEPLOY GAME - ' + gameId + ' - ' + JSON.stringify(deployBoard));
    }
    async function attack(
        req: Request,
        res: Response
    ) {
        const gameId = req.params.id;
        const attack = req.body;
        const result = {
            position: attack.position,
            result: 'miss'
        }
        console.log('Attack initiated: ' + gameId + ' - ' + JSON.stringify(attack));
        res.send('ATTACK GAME - ' + gameId + ' - ' + JSON.stringify(result));
    }
    return {
        newGame,
        getGame,
        deploy,
        attack
    };
}

export default gameController;

