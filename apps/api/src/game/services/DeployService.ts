import type { Board, GameState } from "../../common/types/types.ts";
import { DeployError } from "../../common/types/errors.ts";
import type { GameStateController } from "../gameState.ts";
import TurnManager from "./TurnManager.ts";

const turnManager: TurnManager = new TurnManager();

const expectedShipCells: Record<string, number> = {
    A: 5,
    B: 4,
    C: 3,
    S: 3,
    D: 2,
};

export default class DeployService {
    private gameStateController: GameStateController
    constructor(gameStateController: GameStateController) {
        this.gameStateController = gameStateController;
    }

    private isValidBoard(board: Board): boolean {
        if (!Array.isArray(board) || board.length !== 10) {
            return false;
        }

        const shipCellCounts: Record<string, number> = {
            A: 0,
            B: 0,
            C: 0,
            S: 0,
            D: 0,
        };

        for (const row of board) {
            if (!Array.isArray(row) || row.length !== 10) {
                return false;
            }

            for (const cell of row) {
                if (cell === 'O') {
                    continue;
                }

                if (!(cell in shipCellCounts)) {
                    return false;
                }

                shipCellCounts[cell] += 1;
            }
        }

        for (const [shipKey, expectedCount] of Object.entries(expectedShipCells)) {
            if (shipCellCounts[shipKey] !== expectedCount) {
                return false;
            }
        }

        return true;
    }
    public async deployCommand(gameID: string, deployBoard: Board): Promise<GameState> {
        let gameState = await this.gameStateController.getGame(gameID);
        if (!this.isValidBoard(deployBoard)) {
            throw new DeployError({
                message: 'Invalid board submitted'
            })
        }
        gameState.players[gameState.active_player_index].board_data = deployBoard;
        
        gameState = turnManager.endTurnDeployPhase(gameState);
        await this.gameStateController.saveGame(gameID, gameState);
        const retrievedGameState: GameState = await this.gameStateController.getGame(gameID);
        
        return retrievedGameState;
    }
}