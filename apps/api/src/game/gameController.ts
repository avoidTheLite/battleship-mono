import type { Request, Response } from 'express';
import type { GameState } from '../common/types/types.ts';
import { NewGameError } from '../common/types/errors.ts';
import db from '../db/db.ts';
import GameStateController from './gameState.ts';

function gameController() {
    async function newGame(
        req: Request,
        res: Response
    ) {
        console.log('New game - initializing');
        const gameState: GameState = await GameStateController().createGame(req.body.players,req.body.gameName);
        res.send(gameState);
    }
    async function getGame(
        req: Request,
        res: Response
    ) {
        const gameID = req.params.id;
        const gameState: GameState = await GameStateController().getGame(gameID);
        console.log('Loading game: ' + gameID);
        res.send(gameState);
    }
    async function deploy(
        req: Request,
        res: Response
    ) {
        const gameID = req.params.id;
        const deployBoard = req.body.deployBoard;
        const gameState: GameState = await GameStateController().deploy(gameID, deployBoard);
        console.log('Deployment initiated: ' + gameID + ' - ' + JSON.stringify(deployBoard));
        res.send('DEPLOY GAME - ' + gameID + ' - ' + JSON.stringify(deployBoard));
    }
    async function attack(
        req: Request,
        res: Response
    ) {
        const gameID = req.params.id;
        const attack = req.body;
        const result = {
            position: attack.position,
            result: 'miss'
        }
        console.log('Attack initiated: ' + gameID + ' - ' + JSON.stringify(attack));
        res.send('ATTACK GAME - ' + gameID + ' - ' + JSON.stringify(result));
    }
    return {
        newGame,
        getGame,
        deploy,
        attack
    };
}

export default gameController;

