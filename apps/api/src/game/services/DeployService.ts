import type { Board, GameState } from "../../common/types/types.ts";
import { DeployError } from "../../common/types/errors.ts";
import { turnManager } from "../gameState.ts";
import { GameStateController } from "../gameState.ts";

export default class DeployService {
    private gameStateController: GameStateController
    private readonly expectedShipCounts: Record<string, number> = {
        A: 5,
        B: 4,
        C: 3,
        S: 3,
        D: 2
    };

    constructor(gameStateController: GameStateController) {
        this.gameStateController = gameStateController;
    }

    private isBlankBoard(board: Board): boolean {
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                if (board[i][j] !== 'O') {
                    return false;
                }
            }
        }
        return true;
    }

    private isValidBoard(board: Board): boolean {
        if (!Array.isArray(board) || board.length !== 10) {
            return false;
        }
        const shipCounts: Record<string, number> = Object.fromEntries(
            Object.keys(this.expectedShipCounts).map((shipKey) => [shipKey, 0])
        );
        for (let i = 0; i < 10; i++) {
            if (!Array.isArray(board[i]) || board[i].length !== 10) {
                return false;
            }
            for (let j = 0; j < 10; j++) {
                const marker = board[i][j];
                if (marker === 'O') {
                    continue;
                }
                if (!(marker in shipCounts)) {
                    return false;
                }
                shipCounts[marker] += 1;
            }
        }
        return Object.entries(this.expectedShipCounts).every(
            ([shipKey, expectedCount]) => shipCounts[shipKey] === expectedCount
        );
    }

    public async deployCommand(gameID: string, deployBoard: Board): Promise<GameState> {
        let gameState = await this.gameStateController.getGame(gameID);
        if (gameState.phase !== 'deploy') {
            throw new DeployError({
                message: 'Game is not in deploy phase'
            })
        }
        if (!this.isValidBoard(deployBoard)) {
            throw new DeployError({
                message: 'Invalid board submitted'
            })
        }
        if (!this.isBlankBoard(gameState.players[gameState.active_player_index].board_data)) {
            throw new DeployError({
                message: 'Active player has already deployed'
            })
        }
        gameState.players[gameState.active_player_index].board_data = deployBoard;
        
        gameState = turnManager.endTurnDeployPhase(gameState);
        await this.gameStateController.saveGame(gameID, gameState);
        const retrievedGameState: GameState = await this.gameStateController.getGame(gameID);
        
        return retrievedGameState;
    }
}