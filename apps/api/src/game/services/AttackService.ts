import type { GameStateController } from "../gameState.ts";
import type { Attack, Board, GameState, TargetKey, Ship } from "../../common/types/types.ts";
import { AttackError } from "../../common/types/errors.ts";
import TurnManager from "./TurnManager.ts";

const turnManager = new TurnManager();
const shipKeys = new Set<TargetKey>(["A", "B", "C", "S", "D"]);

class AttackService {
    private gameStateController: GameStateController;
    constructor(gameStateController: GameStateController) {
        this.gameStateController = gameStateController;
    }

    public async attackCommand(gameID: string, attack: Attack): Promise<GameState> {
        return this.gameStateController.updateGame(gameID, (gameState) => {
            if (gameState.phase !== 'play') {
                throw new AttackError({
                    message: 'Game is not in play phase'
                });
            }
            const coordinates = attack?.position;
            if (!this.isValidAttack(coordinates)) {
                throw new AttackError({
                    message: `Invalid attack submitted ${attack?.position}. Must be between [0-9][0-9]`
                });
            }
            if (this.alreadyAttacked(gameState.players[gameState.active_player_index].attack_data, coordinates)) {
                throw new AttackError({
                    message: `Already attacked this location ${attack.position}`
                });
            }

            const targetPlayerIndex: number = (gameState.active_player_index + 1) % 2;
            gameState.players[gameState.active_player_index].last_attack.position = coordinates;
            if (this.isHit(gameState.players[targetPlayerIndex].board_data, coordinates)) {
                this.applyHit(gameState, targetPlayerIndex, coordinates);
            } else {
                gameState.players[gameState.active_player_index].attack_data[coordinates[0]][coordinates[1]] = 'M';
                gameState.players[gameState.active_player_index].last_attack.result = 'miss';
                gameState.players[gameState.active_player_index].last_attack.target = 'O';
            }

            return turnManager.endTurnPlayPhase(gameState);
        });
    }
    private isValidAttack(coordinates: unknown): coordinates is [number, number] {
        if (!Array.isArray(coordinates) || coordinates.length !== 2) {
            return false;
        }
        if (
            !Number.isInteger(coordinates[0]) ||
            !Number.isInteger(coordinates[1]) ||
            coordinates[0] > 9 ||
            coordinates[1] > 9 ||
            coordinates[0] < 0 ||
            coordinates[1] < 0) {
            return false;
        }
        return true;
    }

    private alreadyAttacked(attackData: Board, coordinates: [number, number]): boolean {
        if (attackData[coordinates[0]][coordinates[1]] !== 'O') {
            return true;
        }
        return false;
    }
    
    private isHit(defenderBoard: Board, coordinates: [number, number]): boolean {
        if (defenderBoard[coordinates[0]][coordinates[1]] === 'O') {
            return false;
        } else {
            return true;
        }   
    }

    private getTargetHit(defenderBoard: Board, coordinates: [number, number]): string {
        return defenderBoard[coordinates[0]][coordinates[1]];
    }

    private getTargetIndex(shipData: Ship[], shipKey: string): number {
        const index = shipData.findIndex((ship) => ship.key === (shipKey));
        return index
    }

    private applyHit(gameState: GameState, targetPlayerIndex: number, coordinates: [number, number]): void {
        const targetHit = this.getTargetHit(gameState.players[targetPlayerIndex].board_data, coordinates);
        const targetIndex: number = this.getTargetIndex(gameState.players[targetPlayerIndex].ship_data, targetHit);
        const targetKey = targetHit as TargetKey;
        if (!shipKeys.has(targetKey) || targetIndex < 0) {
            throw new AttackError({
                message: `Invalid target at ${coordinates}`
            });
        }
        gameState.players[gameState.active_player_index].attack_data[coordinates[0]][coordinates[1]] = "H";
        gameState.players[gameState.active_player_index].last_attack.target = targetKey;
        gameState.players[targetPlayerIndex].ship_data[targetIndex].hits += 1;
        if (this.targetSunk(targetIndex, gameState.players[targetPlayerIndex].ship_data)) {
            gameState.players[targetPlayerIndex].ship_data[targetIndex].sunk = true;
            gameState.players[gameState.active_player_index].last_attack.result = 'sunk';
            
        } else {
            gameState.players[gameState.active_player_index].last_attack.result = 'hit';
        }
    }

    private targetSunk(targetIndex: number, shipData: Ship[]): boolean {
        if (shipData[targetIndex].hits === shipData[targetIndex].size) {
            return true;
        } else {
            return false;
        }
    }
}

export default AttackService;