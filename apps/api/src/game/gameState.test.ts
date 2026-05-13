import { describe, expect, beforeEach, afterEach, it } from "@jest/globals";
import db from "../db/db.ts";
import { GameStateController } from "./gameState.ts";
import createBoard from "../common/util/createBoard.ts";
import createShips from "../common/util/createShips.ts";

describe('GameStateController', () => {
    const gameID = 'ordered-player-test-game';
    const playerIDs = ['ordered-player-test-game-p0', 'ordered-player-test-game-p1'];
    const controller = new GameStateController();

    beforeEach(async () => {
        await db('players').whereIn('id', playerIDs).del();
        await db('games').where('id', gameID).del();
    });

    afterEach(async () => {
        await db('players').whereIn('id', playerIDs).del();
        await db('games').where('id', gameID).del();
    });

    it('should order players by player index and normalize null last attacks', async () => {
        const board = JSON.stringify(createBoard());
        const ships = JSON.stringify(createShips());

        await db('games').insert({
            id: gameID,
            name: 'ordered player test',
            phase: 'play',
            turn: 3,
            active_player_index: 0
        });
        await db('players').insert([
            {
                id: playerIDs[1],
                username: 'Player 1',
                player_index: 1,
                game_id: gameID,
                board_data: board,
                attack_data: board,
                ship_data: ships,
                last_attack: null
            },
            {
                id: playerIDs[0],
                username: 'Player 0',
                player_index: 0,
                game_id: gameID,
                board_data: board,
                attack_data: board,
                ship_data: ships,
                last_attack: null
            }
        ]);

        const gameState = await controller.getGame(gameID);

        expect(gameState.players[0].player_index).toBe(0);
        expect(gameState.players[1].player_index).toBe(1);
        expect(gameState.players[0].last_attack).toEqual({
            position: null,
            result: null,
            target: null
        });
        expect(gameState.players[1].last_attack).toEqual({
            position: null,
            result: null,
            target: null
        });
    });
});
