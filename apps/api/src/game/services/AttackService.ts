import type { GameStateController } from "../gameState.ts";
import type { Attack, Board, GameState, TargetKey, Ship } from "../../common/types/types.ts";
import { AttackError } from "../../common/types/errors.ts";
import TurnManager from "./TurnManager.ts";

const SHIP_TARGETS = new Set<TargetKey>(["A", "B", "C", "S", "D"]);
const turnManager: TurnManager = new TurnManager();

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
                message: `Invalid attack submitted ${JSON.stringify(coordinates)}. Must be between [0-9][0-9]`
            });
        }
        const activePlayer = gameState.players[gameState.active_player_index];
        if (this.alreadyAttacked(activePlayer.attack_data, coordinates)) {
            throw new AttackError({
                message: `Already attacked this location ${attack.position}`
            });
        }
        
        const targetPlayerIndex: number = (gameState.active_player_index + 1) % 2;
        if (!activePlayer.last_attack) {
            activePlayer.last_attack = {
                position: null,
                result: null,
                target: null
            };
        }
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
        const target = defenderBoard[coordinates[0]][coordinates[1]];
        if (target === 'O') {
            return false;
        }   
        if (!SHIP_TARGETS.has(target as TargetKey)) {
            throw new AttackError({
                message: `Invalid target marker ${target} at ${coordinates}`
            });
        }
        return true;
    }

    private getTargetHit(defenderBoard: Board, coordinates: [number, number]): TargetKey {
        console.log(`Target hit = ${defenderBoard[coordinates[0]][coordinates[1]]}`);
        const target = defenderBoard[coordinates[0]][coordinates[1]] as TargetKey;
        if (!SHIP_TARGETS.has(target)) {
            throw new AttackError({
                message: `Invalid target marker ${target} at ${coordinates}`
            });
        }
        return target;
    }

    private getTargetIndex(shipData: Ship[], shipKey: TargetKey): number {
        const index = shipData.findIndex((ship) => ship.key === (shipKey));
        console.log(`target index = ${index}`);
        return index
    }

    private applyHit(gameState: GameState, targetPlayerIndex: number, coordinates: [number, number]): void {
        gameState.players[gameState.active_player_index].attack_data[coordinates[0]][coordinates[1]] = "H";
        const targetHit: TargetKey = this.getTargetHit(gameState.players[targetPlayerIndex].board_data, coordinates);
        const targetIndex: number = this.getTargetIndex(gameState.players[targetPlayerIndex].ship_data, targetHit);
        if (targetIndex === -1) {
            throw new AttackError({
                message: `Target ${targetHit} is missing from defender ship data`
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
}

export default AttackService;