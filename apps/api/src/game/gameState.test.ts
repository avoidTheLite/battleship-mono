import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import db from "../db/db.ts";
import { GameStateController } from "./gameState.ts";
import createBoard from "../common/util/createBoard.ts";
import createShips from "../common/util/createShips.ts";

const gameID = 'ordering-regression-game';
const playerZeroID = 'ordering-regression-player-0';
const playerOneID = 'ordering-regression-player-1';

describe('GameStateController', () => {
    const gameStateController = new GameStateController();

    beforeEach(async () => {
        await db('players').where('game_id', gameID).del();
        await db('games').where('id', gameID).del();
        await db('games').insert({
            id: gameID,
            name: 'ordering regression',
            phase: 'play',
            turn: 1,
            active_player_index: 0
        });
        await db('players').insert([
            {
                id: playerOneID,
                username: 'Player 1',
                player_index: 1,
                game_id: gameID,
                board_data: JSON.stringify(createBoard()),
                attack_data: JSON.stringify(createBoard()),
                ship_data: JSON.stringify(createShips()),
                last_attack: null
            },
            {
                id: playerZeroID,
                username: 'Player 0',
                player_index: 0,
                game_id: gameID,
                board_data: JSON.stringify(createBoard()),
                attack_data: JSON.stringify(createBoard()),
                ship_data: JSON.stringify(createShips()),
                last_attack: null
            }
        ]);
    });

    afterEach(async () => {
        await db('players').where('game_id', gameID).del();
        await db('games').where('id', gameID).del();
    });

    it('should load players ordered by player_index and normalize null last_attack', async () => {
        const gameState = await gameStateController.getGame(gameID);

        expect(gameState.players.map((player) => player.player_index)).toEqual([0, 1]);
        expect(gameState.players.map((player) => player.id)).toEqual([playerZeroID, playerOneID]);
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
})
