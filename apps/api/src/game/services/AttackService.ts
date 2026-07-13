import type { GameStateController } from "../gameState.ts";
import type { Attack, Board, GameState, TargetKey, Ship, Player } from "../../common/types/types.ts";
import { AttackError } from "../../common/types/errors.ts";
import TurnManager from "./TurnManager.ts";

const turnManager = new TurnManager();
const VALID_SHIP_KEYS: ReadonlySet<TargetKey> = new Set(["A", "B", "C", "S", "D"]);

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
                message: `Invalid attack submitted ${JSON.stringify(attack?.position)}. Must be integer coordinates between [0-9][0-9]`
            });
        }
        if (this.alreadyAttacked(gameState.players[gameState.active_player_index].attack_data, coordinates)) {
            throw new AttackError({
                message: `Already attacked this location ${attack.position}`
            });
        }
        
        const targetPlayerIndex: number = (gameState.active_player_index + 1) % 2;
        const activePlayer = gameState.players[gameState.active_player_index];
        activePlayer.last_attack = {
            position: coordinates,
            result: 'miss',
            target: 'O'
        };
        if (this.isHit(gameState.players[targetPlayerIndex].board_data, coordinates)) {
            this.applyHit(gameState, targetPlayerIndex, coordinates);
        } else {
            activePlayer.attack_data[coordinates[0]][coordinates[1]] = "M";
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
        const target = defenderBoard[coordinates[0]][coordinates[1]];
        if (target === 'O') {
            return false;
        } else if (VALID_SHIP_KEYS.has(target as TargetKey)) {
            return true;
        }
        throw new AttackError({
            message: `Invalid target marker ${target} at ${coordinates}`
        });
    }

    private getTargetHit(defenderBoard: Board, coordinates: [number, number]): TargetKey {
        return defenderBoard[coordinates[0]][coordinates[1]] as TargetKey;
    }

    private getTargetIndex(shipData: Ship[], shipKey: TargetKey): number {
        const index = shipData.findIndex((ship) => ship.key === (shipKey));
        if (index === -1) {
            throw new AttackError({
                message: `Unable to find ship for target marker ${shipKey}`
            });
        }
        return index
    }

    private applyHit(gameState: GameState, targetPlayerIndex: number, coordinates: [number, number]): void {
        const activePlayer: Player = gameState.players[gameState.active_player_index];
        const targetPlayer: Player = gameState.players[targetPlayerIndex];
        activePlayer.attack_data[coordinates[0]][coordinates[1]] = "H";
        const targetHit: TargetKey = this.getTargetHit(targetPlayer.board_data, coordinates);
        const targetIndex: number = this.getTargetIndex(targetPlayer.ship_data, targetHit);
        activePlayer.last_attack.target = targetHit;
        targetPlayer.ship_data[targetIndex].hits += 1;
        if (this.targetSunk(targetIndex, targetPlayer.ship_data)) {
            targetPlayer.ship_data[targetIndex].sunk = true;
            activePlayer.last_attack.result = 'sunk';
            
        } else {
            activePlayer.last_attack.result = 'hit';
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