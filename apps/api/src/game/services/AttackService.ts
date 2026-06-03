import { GameStateController } from "../gameState.ts";
import type { Attack, AttackPosition, Board, GameState, TargetKey, Ship } from "../../common/types/types.ts";
import { AttackError } from "../../common/types/errors.ts";
import { turnManager } from "../gameState.ts";

class AttackService {
    private gameStateController: GameStateController;
    private readonly shipKeys = new Set<string>(['A', 'B', 'C', 'S', 'D']);

    constructor(gameStateController: GameStateController) {
        this.gameStateController = gameStateController;
    }

    public async attackCommand(gameID: string, attack: Attack): Promise<GameState> {
        let gameState = await this.gameStateController.getGame(gameID);
        if (gameState.phase !== 'play') {
            throw new AttackError({
                message: 'Game is not in play phase'
            });
        }
        const coordinates = attack?.position;
        if (!this.isValidCoordinates(coordinates)) {
            throw new AttackError({
                message: `Invalid attack submitted ${JSON.stringify(attack?.position)}. Must be between [0-9][0-9]`
            });
        }
        if (this.alreadyAttacked(gameState.players[gameState.active_player_index].attack_data, coordinates)) {
            throw new AttackError({
                message: `Already attacked this location ${attack.position}`
            });
        }
        
        const targetPlayerIndex: number = (gameState.active_player_index + 1) % 2;
        gameState.players[gameState.active_player_index].last_attack = {
            position: coordinates,
            result: null,
            target: null
        };
        if (this.isHit(gameState.players[targetPlayerIndex].board_data, coordinates)) {
            this.applyHit(gameState, targetPlayerIndex, coordinates);
        } else {
            this.applyMiss(gameState, coordinates);
        }

        gameState = turnManager.endTurnPlayPhase(gameState);
        gameState = await this.gameStateController.saveGame(gameID, gameState);

        const retrievedGameState: GameState = await this.gameStateController.getGame(gameID);

        return retrievedGameState;
    }
    private isValidCoordinates(coordinates: unknown): coordinates is AttackPosition {
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
    
    private isHit(defenderBoard: Board, coordinates: AttackPosition): boolean {
        if (defenderBoard[coordinates[0]][coordinates[1]] === 'O') {
            return false;
        } else {
            return true;
        }   
    }

    private getTargetHit(defenderBoard: Board, coordinates: AttackPosition): TargetKey {
        const target = defenderBoard[coordinates[0]][coordinates[1]];
        if (!this.shipKeys.has(target)) {
            throw new AttackError({
                message: `Invalid target marker ${target} at ${coordinates}`
            });
        }
        return target as TargetKey;
    }

    private getTargetIndex(shipData: Ship[], shipKey: TargetKey): number {
        const index = shipData.findIndex((ship) => ship.key === (shipKey));
        if (index === -1) {
            throw new AttackError({
                message: `Target ship ${shipKey} was not found`
            });
        }
        return index
    }

    private applyMiss(gameState: GameState, coordinates: AttackPosition): void {
        gameState.players[gameState.active_player_index].attack_data[coordinates[0]][coordinates[1]] = "M";
        gameState.players[gameState.active_player_index].last_attack.result = 'miss';
        gameState.players[gameState.active_player_index].last_attack.target = 'O';
    }

    private applyHit(gameState: GameState, targetPlayerIndex: number, coordinates: AttackPosition): void {
        gameState.players[gameState.active_player_index].attack_data[coordinates[0]][coordinates[1]] = "H";
        const targetHit: TargetKey = this.getTargetHit(gameState.players[targetPlayerIndex].board_data, coordinates);
        const targetIndex: number = this.getTargetIndex(gameState.players[targetPlayerIndex].ship_data, targetHit);
        gameState.players[gameState.active_player_index].last_attack.target = targetHit;
        gameState.players[targetPlayerIndex].ship_data[targetIndex].hits += 1;
        if (this.targetSunk(targetIndex, gameState.players[targetPlayerIndex].ship_data)) {
            gameState.players[targetPlayerIndex].ship_data[targetIndex].sunk = true;
            gameState.players[gameState.active_player_index].last_attack.result = 'sunk';
            
        } else {
            gameState.players[gameState.active_player_index].last_attack.result = 'hit';
        }
    }

    private targetSunk(targetIndex, shipData): boolean {
        if (shipData[targetIndex].hits === shipData[targetIndex].size) {
            return true;
        } else {
            return false;
        }
    }
}

export default AttackService;