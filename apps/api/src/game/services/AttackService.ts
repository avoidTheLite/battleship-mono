import type { GameStateController } from "../gameState.ts";
import type { Attack, AttackResult, Board, GameState, TargetKey, Ship, ShipData } from "../../common/types/types.ts";
import { AttackError } from "../../common/types/errors.ts";
import TurnManager from "./TurnManager.ts";

type ShipTargetKey = Exclude<TargetKey, "O">;
const SHIP_TARGET_KEYS = new Set<string>(["A", "B", "C", "S", "D"]);
const turnManager = new TurnManager();

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
        if (!attack || !this.isValidAttack(attack.position)) {
            throw new AttackError({
                message: `Invalid attack submitted ${attack?.position}. Must be between [0-9][0-9]`
            });
        }
        const coordinates: [number, number] = attack.position;
        const activePlayer = gameState.players[gameState.active_player_index];
        activePlayer.last_attack = this.getLastAttack(activePlayer.last_attack);
        if (this.alreadyAttacked(activePlayer.attack_data, coordinates)) {
            throw new AttackError({
                message: `Already attacked this location ${attack.position}`
            });
        }
        
        const targetPlayerIndex: number = (gameState.active_player_index + 1) % 2;
        activePlayer.last_attack.position = coordinates;
        if (this.isHit(gameState.players[targetPlayerIndex].board_data, coordinates)) {
            this.applyHit(gameState, targetPlayerIndex, coordinates);
        } else {
            activePlayer.attack_data[coordinates[0]][coordinates[1]] = "M";
            activePlayer.last_attack.result = 'miss';
            activePlayer.last_attack.target = 'O';
        }

        gameState = turnManager.endTurnPlayPhase(gameState);
        gameState = await this.gameStateController.saveGame(gameID, gameState);

        const retrievedGameState: GameState = await this.gameStateController.getGame(gameID);

        return retrievedGameState;
    }
    private isValidAttack(coordinates: unknown): coordinates is [number, number] {
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

    private getTargetHit(defenderBoard: Board, coordinates: [number, number]): ShipTargetKey {
        const target = defenderBoard[coordinates[0]][coordinates[1]];
        if (!this.isShipTargetKey(target)) {
            throw new AttackError({
                message: `Invalid target marker ${target} at ${coordinates}`
            });
        }
        return target;
    }

    private getTargetIndex(shipData: Ship[], shipKey: ShipTargetKey): number {
        const index = shipData.findIndex((ship) => ship.key === (shipKey));
        if (index === -1) {
            throw new AttackError({
                message: `Unable to find ship data for target ${shipKey}`
            });
        }
        return index
    }

    private applyHit(gameState: GameState, targetPlayerIndex: number, coordinates: [number, number]): void {
        gameState.players[gameState.active_player_index].attack_data[coordinates[0]][coordinates[1]] = "H";
        const targetHit = this.getTargetHit(gameState.players[targetPlayerIndex].board_data, coordinates);
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

    private targetSunk(targetIndex: number, shipData: ShipData): boolean {
        if (shipData[targetIndex].hits === shipData[targetIndex].size) {
            return true;
        } else {
            return false;
        }
    }

    private isShipTargetKey(value: string): value is ShipTargetKey {
        return SHIP_TARGET_KEYS.has(value);
    }

    private getLastAttack(lastAttack: AttackResult | null): AttackResult {
        return lastAttack ?? {
            position: null,
            result: null,
            target: null
        };
    }
}

export default AttackService;