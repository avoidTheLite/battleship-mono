import { GameStateController } from "../gameState.ts";
import type { Attack, Board, GameState, Game, TargetKey, Ship } from "../../common/types/types.ts";
import { AttackError } from "../../common/types/errors.ts";
import { turnManager } from "../gameState.ts";

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
        const coordinates: [number, number] = attack.position;
        if (!this.isValidAttack(coordinates)) {
            console.log(`${(coordinates[0] > 9)}, ${(coordinates[1] > 9)}, ${(coordinates[0] < 0)}, ${(coordinates[1] < 0)}`);
            throw new AttackError({
                message: `Invalid attack submitted ${attack.position}. Must be between [0-9][0-9]`
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
            gameState.players[gameState.active_player_index].last_attack.result = 'miss';
            gameState.players[gameState.active_player_index].last_attack.target = 'O';
        }

        gameState = turnManager.endTurnPlayPhase(gameState);
        gameState = await this.gameStateController.saveGame(gameID, gameState);

        const retrievedGameState: GameState = await this.gameStateController.getGame(gameID);

        return retrievedGameState;
    }
    private isValidAttack(coordinates: [number, number]): boolean {
        if (coordinates.length !== 2) {
            console.log(coordinates.length);
            return false;
        }
        if (
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

    private getTargetIndex(shipData: Ship[], shipKey): number {
        const index = shipData.findIndex((ship) => ship.key === (shipKey));
        console.log(`target index = ${index}`);
        return index
    }

    private applyHit(gameState: GameState, targetPlayerIndex: number, coordinates: [number, number]): void {
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