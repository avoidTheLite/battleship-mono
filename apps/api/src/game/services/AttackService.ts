import { GameStateController } from "../gameState.ts";
import type { Attack, Board, GameState, TargetKey, Ship } from "../../common/types/types.ts";
import { AttackError } from "../../common/types/errors.ts";
import { turnManager } from "../gameState.ts";

const SHIP_TARGETS = new Set<TargetKey>(["A", "B", "C", "S", "D"]);

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
        if (!this.isValidAttack(attack)) {
            throw new AttackError({
                message: `Invalid attack submitted ${JSON.stringify(attack?.position)}. Must be two integer coordinates between 0 and 9`
            });
        }
        const coordinates: [number, number] = attack.position;
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
        const target = this.getTarget(gameState.players[targetPlayerIndex].board_data, coordinates);
        if (target === 'O') {
            gameState.players[gameState.active_player_index].attack_data[coordinates[0]][coordinates[1]] = "M";
            gameState.players[gameState.active_player_index].last_attack.result = 'miss';
            gameState.players[gameState.active_player_index].last_attack.target = 'O';
        } else if (this.isShipTarget(target)) {
            this.applyHit(gameState, targetPlayerIndex, coordinates, target);
        } else {
            throw new AttackError({
                message: `Invalid target marker ${target} at ${attack.position}`
            });
        }

        gameState = turnManager.endTurnPlayPhase(gameState);
        gameState = await this.gameStateController.saveGame(gameID, gameState);

        const retrievedGameState: GameState = await this.gameStateController.getGame(gameID);

        return retrievedGameState;
    }
    private isValidAttack(attack: Attack): attack is Attack {
        if (!attack || !Array.isArray(attack.position) || attack.position.length !== 2) {
            return false;
        }
        const [row, column] = attack.position;
        return [row, column].every((coordinate) =>
            Number.isInteger(coordinate) && coordinate >= 0 && coordinate <= 9
        );
    }

    private alreadyAttacked(attackData: Board, coordinates: [number, number]): boolean {
        const previousAttack = attackData[coordinates[0]]?.[coordinates[1]];
        if (previousAttack === undefined) {
            throw new AttackError({
                message: `Invalid attack history at ${coordinates}`
            });
        }
        return previousAttack !== 'O';
    }
    
    private getTarget(defenderBoard: Board, coordinates: [number, number]): string {
        const target = defenderBoard[coordinates[0]]?.[coordinates[1]];
        if (target === undefined) {
            throw new AttackError({
                message: `Invalid defender board at ${coordinates}`
            });
        }
        return target;
    }

    private isShipTarget(target: string): target is TargetKey {
        return SHIP_TARGETS.has(target as TargetKey);
    }

    private getTargetIndex(shipData: Ship[], shipKey: TargetKey): number {
        const index = shipData.findIndex((ship) => ship.key === (shipKey));
        return index
    }

    private applyHit(gameState: GameState, targetPlayerIndex: number, coordinates: [number, number], targetHit: TargetKey): void {
        gameState.players[gameState.active_player_index].attack_data[coordinates[0]][coordinates[1]] = "H";
        const targetIndex: number = this.getTargetIndex(gameState.players[targetPlayerIndex].ship_data, targetHit);
        if (targetIndex === -1) {
            throw new AttackError({
                message: `No ship data found for target ${targetHit}`
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