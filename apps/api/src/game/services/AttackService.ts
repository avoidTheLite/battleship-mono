import type { GameStateController } from "../gameState.ts";
import type { Attack, Board, GameState, TargetKey, Ship } from "../../common/types/types.ts";
import { AttackError } from "../../common/types/errors.ts";
import TurnManager from "./TurnManager.ts";

class AttackService {
    private gameStateController: GameStateController;
    private turnManager: TurnManager;

    constructor(gameStateController: GameStateController) {
        this.gameStateController = gameStateController;
        this.turnManager = new TurnManager();
    }

    public async attackCommand(gameID: string, attack: Attack): Promise<GameState> {
        const coordinates = attack?.position;
        if (!this.isValidAttack(coordinates)) {
            throw new AttackError({
                message: `Invalid attack submitted ${coordinates}. Must be between [0-9][0-9]`
            });
        }
        const attackCoordinates = coordinates as [number, number];

        return this.gameStateController.updateGame(gameID, (gameState: GameState): GameState => {
            if (gameState.phase !== 'play') {
                throw new AttackError({
                    message: 'Game is not in play phase'
                });
            }
            const activePlayer = gameState.players[gameState.active_player_index];
            if (this.alreadyAttacked(activePlayer.attack_data, attackCoordinates)) {
                throw new AttackError({
                    message: `Already attacked this location ${attackCoordinates}`
                });
            }

            const targetPlayerIndex: number = (gameState.active_player_index + 1) % 2;
            activePlayer.last_attack = {
                position: attackCoordinates,
                result: null,
                target: null
            };
            if (this.isHit(gameState.players[targetPlayerIndex].board_data, attackCoordinates)) {
                this.applyHit(gameState, targetPlayerIndex, attackCoordinates);
            } else {
                activePlayer.attack_data[attackCoordinates[0]][attackCoordinates[1]] = "M";
                activePlayer.last_attack.result = 'miss';
                activePlayer.last_attack.target = 'O';
            }

            return this.turnManager.endTurnPlayPhase(gameState);
        });
    }
    private isValidAttack(coordinates: unknown): boolean {
        if (!Array.isArray(coordinates) || coordinates.length !== 2) {
            return false;
        }
        if (
            !Number.isInteger(coordinates[0]) ||
            !Number.isInteger(coordinates[1]) ||
            (coordinates[0] > 9) ||
            (coordinates[1] > 9) ||
            (coordinates[0] < 0) ||
            (coordinates[1] < 0)) {
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

    private getTargetHit(defenderBoard: Board, coordinates: [number, number]): TargetKey {
        console.log(`Target hit = ${defenderBoard[coordinates[0]][coordinates[1]]}`);
        return defenderBoard[coordinates[0]][coordinates[1]] as TargetKey;
    }

    private getTargetIndex(shipData: Ship[], shipKey: TargetKey): number {
        const index = shipData.findIndex((ship) => ship.key === (shipKey));
        console.log(`target index = ${index}`);
        return index
    }

    private applyHit(gameState: GameState, targetPlayerIndex: number, coordinates: [number, number]): void {
        const targetHit: TargetKey = this.getTargetHit(gameState.players[targetPlayerIndex].board_data, coordinates);
        const targetIndex: number = this.getTargetIndex(gameState.players[targetPlayerIndex].ship_data, targetHit);
        if (targetIndex === -1) {
            throw new AttackError({
                message: `Invalid target marker ${targetHit} at ${coordinates}`
            });
        }
        gameState.players[gameState.active_player_index].attack_data[coordinates[0]][coordinates[1]] = "H";
        gameState.players[gameState.active_player_index].last_attack.target = targetHit;
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