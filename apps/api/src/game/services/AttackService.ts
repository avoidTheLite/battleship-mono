import type { GameStateController } from "../gameState.ts";
import type { Attack, Board, GameState, Ship, ShipKey } from "../../common/types/types.ts";
import { AttackError } from "../../common/types/errors.ts";
import TurnManager from "./TurnManager.ts";

const turnManager: TurnManager = new TurnManager();
const shipKeys = new Set<string>(['A', 'B', 'C', 'S', 'D']);

class AttackService {
    private gameStateController: GameStateController;
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
        if (!this.isValidAttack(coordinates)) {
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
        this.ensureLastAttack(gameState);
        gameState.players[gameState.active_player_index].last_attack.position = coordinates;
        if (this.isHit(gameState.players[targetPlayerIndex].board_data, coordinates)) {
            this.applyHit(gameState, targetPlayerIndex, coordinates);
        } else {
            gameState.players[gameState.active_player_index].attack_data[coordinates[0]][coordinates[1]] = "M";
            gameState.players[gameState.active_player_index].last_attack.result = 'miss';
            gameState.players[gameState.active_player_index].last_attack.target = 'O';
        }

        gameState = turnManager.endTurnPlayPhase(gameState);
        gameState = await this.gameStateController.saveGame(gameID, gameState);

        const retrievedGameState: GameState = await this.gameStateController.getGame(gameID);

        return retrievedGameState;
    }
    private isValidAttack(coordinates: unknown): coordinates is [number, number] {
        return Array.isArray(coordinates) &&
            coordinates.length === 2 &&
            Number.isInteger(coordinates[0]) &&
            Number.isInteger(coordinates[1]) &&
            coordinates[0] >= 0 &&
            coordinates[0] <= 9 &&
            coordinates[1] >= 0 &&
            coordinates[1] <= 9;
    }

    private alreadyAttacked(attackData: Board, coordinates: [number, number]): boolean {
        if (attackData[coordinates[0]][coordinates[1]] !== 'O') {
            return true;
        }
        return false;
    }
    
    private isHit(defenderBoard: Board, coordinates: [number, number]): boolean {
        const target = defenderBoard[coordinates[0]][coordinates[1]];
        if (target === 'O') {
            return false;
        }
        if (this.isShipKey(target)) {
            return true;
        }
        throw new AttackError({
            message: `Invalid defender board marker ${target} at ${coordinates}`
        });
    }

    private getTargetHit(defenderBoard: Board, coordinates: [number, number]): ShipKey {
        return defenderBoard[coordinates[0]][coordinates[1]] as ShipKey;
    }

    private getTargetIndex(shipData: Ship[], shipKey: ShipKey): number {
        const index = shipData.findIndex((ship) => ship.key === (shipKey));
        return index
    }

    private applyHit(gameState: GameState, targetPlayerIndex: number, coordinates: [number, number]): void {
        gameState.players[gameState.active_player_index].attack_data[coordinates[0]][coordinates[1]] = "H";
        const targetHit: ShipKey = this.getTargetHit(gameState.players[targetPlayerIndex].board_data, coordinates);
        const targetIndex: number = this.getTargetIndex(gameState.players[targetPlayerIndex].ship_data, targetHit);
        if (targetIndex === -1) {
            throw new AttackError({
                message: `Unable to find ship data for target ${targetHit}`
            });
        }
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

    private ensureLastAttack(gameState: GameState): void {
        const activePlayer = gameState.players[gameState.active_player_index];
        if (!activePlayer.last_attack) {
            activePlayer.last_attack = {
                position: null,
                result: null,
                target: null
            };
        }
    }

    private isShipKey(target: string): target is ShipKey {
        return shipKeys.has(target);
    }
}

export default AttackService;