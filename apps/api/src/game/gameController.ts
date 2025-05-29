import type { Request, Response } from 'express';
import type { GameState } from '../common/types/types.ts';
import { GameStateController } from './gameState.ts';
import AttackService from './services/AttackService.ts';
import DeployService from './services/DeployService.ts';


const gameStateController: GameStateController = new GameStateController();
const attackService: AttackService = new AttackService(gameStateController);
const deployService: DeployService = new DeployService(gameStateController);
function gameController() {
    async function newGame(
        req: Request,
        res: Response
    ) {
        console.log('New game - initializing');
        const gameState: GameState = await gameStateController.createGame(req.body.players,req.body.gameName);
        res.send(gameState);
    }
    async function getGame(
        req: Request,
        res: Response
    ) {
        const gameID = req.params.id;
        const gameState: GameState = await gameStateController.getGame(gameID);
        console.log('Loading game: ' + gameID);
        res.send(gameState);
    }
    async function deploy(
        req: Request,
        res: Response
    ) {
        const gameID = req.params.id;
        const deployBoard = req.body.deployBoard;
        const gameState: GameState = await deployService.deployCommand(gameID, deployBoard);
        console.log('Deployment initiated: ' + gameID + ' - ' + JSON.stringify(deployBoard));
        res.send(gameState);
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
        const gameState: GameState = await attackService.attackCommand(gameID, attack);
        res.send(gameState);
    }
    return {
        newGame,
        getGame,
        deploy,
        attack
    };
}

export default gameController;

