import type { GameStateController } from "../gameState.ts";
import type { Attack, Board, GameState, TargetKey, Ship } from "../../common/types/types.ts";
import { AttackError } from "../../common/types/errors.ts";
import TurnManager from "./TurnManager.ts";

const shipMarkers = new Set<string>(["A", "B", "C", "S", "D"]);

class AttackService {
    private gameStateController: GameStateController;
    private turnManager: TurnManager;
    constructor(gameStateController: GameStateController) {
        this.gameStateController = gameStateController;
        this.turnManager = new TurnManager();
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
                message: `Invalid attack submitted ${JSON.stringify(coordinates)}. Must be two integer coordinates between [0-9][0-9]`
            });
        }
        const activePlayer = gameState.players[gameState.active_player_index];
        if (this.alreadyAttacked(activePlayer.attack_data, coordinates)) {
            throw new AttackError({
                message: `Already attacked this location ${attack.position}`
            });
        }
        
        const targetPlayerIndex: number = (gameState.active_player_index + 1) % 2;
        activePlayer.last_attack = {
            position: coordinates,
            result: null,
            target: null
        };
        const target = this.getTarget(gameState.players[targetPlayerIndex].board_data, coordinates);
        if (target === "O") {
            this.applyMiss(gameState, coordinates);
        } else {
            this.applyHit(gameState, targetPlayerIndex, coordinates, target);
        }

        gameState = this.turnManager.endTurnPlayPhase(gameState);
        gameState = await this.gameStateController.saveGame(gameID, gameState);

        const retrievedGameState: GameState = await this.gameStateController.getGame(gameID);

        return retrievedGameState;
    }
    private isValidAttack(coordinates: unknown): coordinates is [number, number] {
        if (!Array.isArray(coordinates) || coordinates.length !== 2) {
            return false;
        }
        const [row, column] = coordinates;
        if (
            !Number.isInteger(row) ||
            !Number.isInteger(column) ||
            (row > 9) ||
            (column > 9) ||
            (row < 0) ||
            (column < 0)) {
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
    
    private getTarget(defenderBoard: Board, coordinates: [number, number]): TargetKey {
        const target = defenderBoard[coordinates[0]][coordinates[1]];
        if (target === "O" || shipMarkers.has(target)) {
            return target as TargetKey;
        }
        throw new AttackError({
            message: `Invalid defender board marker ${target} at ${coordinates}`
        });
    }

    private getTargetIndex(shipData: Ship[], shipKey: TargetKey): number {
        const index = shipData.findIndex((ship) => ship.key === (shipKey));
        return index
    }

    private applyMiss(gameState: GameState, coordinates: [number, number]): void {
        gameState.players[gameState.active_player_index].attack_data[coordinates[0]][coordinates[1]] = "M";
        gameState.players[gameState.active_player_index].last_attack.result = "miss";
        gameState.players[gameState.active_player_index].last_attack.target = "O";
    }

    private applyHit(gameState: GameState, targetPlayerIndex: number, coordinates: [number, number], targetHit: TargetKey): void {
        gameState.players[gameState.active_player_index].attack_data[coordinates[0]][coordinates[1]] = "H";
        const targetIndex: number = this.getTargetIndex(gameState.players[targetPlayerIndex].ship_data, targetHit);
        if (targetIndex === -1) {
            throw new AttackError({
                message: `Defender ship data missing target ${targetHit}`
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