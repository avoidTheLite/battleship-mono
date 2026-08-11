import type { Board, GameState, TargetKey } from "../../common/types/types.ts";
import { DeployError } from "../../common/types/errors.ts";
import type { GameStateController } from "../gameState.ts";
import TurnManager from "./TurnManager.ts";

const turnManager = new TurnManager();
const EXPECTED_MARKER_COUNTS: Record<TargetKey, number> = {
    A: 5,
    B: 4,
    C: 3,
    S: 3,
    D: 2,
    O: 83
};

export default class DeployService {
    private gameStateController: GameStateController
    constructor(gameStateController: GameStateController) {
        this.gameStateController = gameStateController;
    }

    private isValidBoard(board: unknown): board is Board {
        if (!Array.isArray(board) || board.length !== 10) {
            return false;
        }

        const counts: Record<TargetKey, number> = { A: 0, B: 0, C: 0, S: 0, D: 0, O: 0 };

        for (let i = 0; i < 10; i++) {
            const row = board[i];
            if (!Array.isArray(row) || row.length !== 10) {
                return false;
            }
            for (let j = 0; j < 10; j++) {
                const cell = row[j];
                if (typeof cell !== 'string' || !Object.hasOwn(counts, cell)) {
                    return false;
                }
                counts[cell as TargetKey] += 1;
            }
        }

        return (Object.keys(EXPECTED_MARKER_COUNTS) as TargetKey[]).every(
            (key) => counts[key] === EXPECTED_MARKER_COUNTS[key]
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
