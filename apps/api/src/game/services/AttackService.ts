import type { GameStateController } from "../gameState.ts";
import type { Attack, AttackResult, Board, GameState, TargetKey, Ship } from "../../common/types/types.ts";
import { AttackError } from "../../common/types/errors.ts";
import TurnManager from "./TurnManager.ts";

const turnManager: TurnManager = new TurnManager();
const SHIP_KEYS = ['A', 'B', 'C', 'S', 'D'] as const;
type ShipKey = typeof SHIP_KEYS[number];

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
            if (!this.isValidAttack(attack)) {
                throw new AttackError({
                    message: `Invalid attack submitted ${JSON.stringify(attack)}. Must be between [0-9][0-9]`
                });
            }
            const coordinates: [number, number] = attack.position;
            if (this.alreadyAttacked(gameState.players[gameState.active_player_index].attack_data, coordinates)) {
                throw new AttackError({
                    message: `Already attacked this location ${attack.position}`
                });
            }
            
            const targetPlayerIndex: number = (gameState.active_player_index + 1) % 2;
            const lastAttack = this.ensureLastAttack(gameState);
            lastAttack.position = coordinates;
            if (this.isHit(gameState.players[targetPlayerIndex].board_data, coordinates)) {
                this.applyHit(gameState, targetPlayerIndex, coordinates);
            } else {
                gameState.players[gameState.active_player_index].attack_data[coordinates[0]][coordinates[1]] = "M";
                lastAttack.result = 'miss';
                lastAttack.target = 'O';
            }

            return turnManager.endTurnPlayPhase(gameState);
        });
    }
    private isValidAttack(attack: Attack): attack is Attack {
        if (!attack || !Array.isArray(attack.position) || attack.position.length !== 2) {
            return false;
        }
        const coordinates = attack.position;
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
        } else if (this.isShipKey(target)) {
            return true;
        }
        throw new AttackError({
            message: `Invalid target marker ${target} at ${coordinates}`
        });
    }

    private getTargetHit(defenderBoard: Board, coordinates: [number, number]): ShipKey {
        const target = defenderBoard[coordinates[0]][coordinates[1]];
        if (!this.isShipKey(target)) {
            throw new AttackError({
                message: `Invalid target marker ${target} at ${coordinates}`
            });
        }
        return target;
    }

    private getTargetIndex(shipData: Ship[], shipKey: ShipKey): number {
        const index = shipData.findIndex((ship) => ship.key === (shipKey));
        if (index === -1) {
            throw new AttackError({
                message: `Ship data missing target ${shipKey}`
            });
        }
        return index
    }

    private applyHit(gameState: GameState, targetPlayerIndex: number, coordinates: [number, number]): void {
        const lastAttack = this.ensureLastAttack(gameState);
        gameState.players[gameState.active_player_index].attack_data[coordinates[0]][coordinates[1]] = "H";
        const targetHit: TargetKey = this.getTargetHit(gameState.players[targetPlayerIndex].board_data, coordinates);
        const targetIndex: number = this.getTargetIndex(gameState.players[targetPlayerIndex].ship_data, targetHit);
        lastAttack.target = targetHit;
        gameState.players[targetPlayerIndex].ship_data[targetIndex].hits += 1;
        if (this.targetSunk(targetIndex, gameState.players[targetPlayerIndex].ship_data)) {
            gameState.players[targetPlayerIndex].ship_data[targetIndex].sunk = true;
            lastAttack.result = 'sunk';
            
        } else {
            lastAttack.result = 'hit';
        }
    }

    private targetSunk(targetIndex: number, shipData: Ship[]): boolean {
        if (shipData[targetIndex].hits === shipData[targetIndex].size) {
            return true;
        } else {
            return false;
        }
    }

    private ensureLastAttack(gameState: GameState): AttackResult {
        const activePlayer = gameState.players[gameState.active_player_index];
        if (!activePlayer.last_attack) {
            activePlayer.last_attack = {
                position: null,
                result: null,
                target: null
            };
        }
        return activePlayer.last_attack;
    }

    private isShipKey(target: string): target is ShipKey {
        return (SHIP_KEYS as readonly string[]).includes(target);
    }
}

export default AttackService;