import type { Board, GameState } from "../../common/types/types.ts";
import { DeployError } from "../../common/types/errors.ts";
import type { GameStateController } from "../gameState.ts";
import TurnManager from "./TurnManager.ts";

const turnManager: TurnManager = new TurnManager();
const EXPECTED_SHIP_COUNTS: Record<string, number> = {
    A: 5,
    B: 4,
    C: 3,
    S: 3,
    D: 2
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
        const counts: Record<string, number> = {
            A: 0,
            B: 0,
            C: 0,
            S: 0,
            D: 0
        };
        const positions: Record<string, [number, number][]> = {
            A: [],
            B: [],
            C: [],
            S: [],
            D: []
        };
        for (let i = 0; i < 10; i++) {
            if (!Array.isArray(board[i]) || board[i].length !== 10) {
                return false;
            }
            for (let j = 0; j < 10; j++) {
                const target = board[i][j];
                if (target === 'O') {
                    continue;
                }
                if (typeof target !== 'string' || !Object.prototype.hasOwnProperty.call(counts, target)) {
                    return false;
                }
                counts[target] += 1;
                positions[target].push([i, j]);
            }
        }
        return Object.entries(EXPECTED_SHIP_COUNTS).every(([target, expectedCount]) =>
            counts[target] === expectedCount && this.isStraightContiguous(positions[target])
        );
    }

    private isStraightContiguous(positions: [number, number][]): boolean {
        const sameRow = positions.every(([row]) => row === positions[0][0]);
        const sameColumn = positions.every(([, column]) => column === positions[0][1]);
        if (!sameRow && !sameColumn) {
            return false;
        }

        const axis = sameRow ? 1 : 0;
        const sortedPositions = positions.map((position) => position[axis]).sort((a, b) => a - b);
        return sortedPositions.every((position, index) =>
            index === 0 || position === sortedPositions[index - 1] + 1
        );
    }

    public async deployCommand(gameID: string, deployBoard: Board): Promise<GameState> {
        return this.gameStateController.updateGame(gameID, (gameState) => {
            if (!this.isValidBoard(deployBoard)) {
                throw new DeployError({
                    message: 'Invalid board submitted'
                })
            }
            gameState.players[gameState.active_player_index].board_data = deployBoard;

            return turnManager.endTurnDeployPhase(gameState);
        });
    }
}