import { describe, expect, it } from "@jest/globals";
import createBoard from "../common/util/createBoard.ts";
import createShips from "../common/util/createShips.ts";
import db from "../db/db.ts";
import { GameStateController } from "./gameState.ts";

describe('GameStateController', () => {
    it('should return players ordered by player_index', async () => {
        const gameID = 'ordered-player-test';
        const controller = new GameStateController();
        const lastAttack = JSON.stringify({
            position: null,
            result: null,
            target: null
        });

        await db('players').where('game_id', gameID).del();
        await db('games').where('id', gameID).del();
        await db('games').insert({
            id: gameID,
            name: 'Ordered Player Test',
            phase: 'play',
            turn: 1,
            active_player_index: 0
        });
        await db('players').insert([
            {
                id: `${gameID}-player-1`,
                username: 'Player 1',
                player_index: 1,
                game_id: gameID,
                board_data: JSON.stringify(createBoard()),
                attack_data: JSON.stringify(createBoard()),
                ship_data: JSON.stringify(createShips()),
                last_attack: lastAttack
            },
            {
                id: `${gameID}-player-0`,
                username: 'Player 0',
                player_index: 0,
                game_id: gameID,
                board_data: JSON.stringify(createBoard()),
                attack_data: JSON.stringify(createBoard()),
                ship_data: JSON.stringify(createShips()),
                last_attack: lastAttack
            }
        ]);

        const gameState = await controller.getGame(gameID);

        expect(gameState.players.map((player) => player.player_index)).toEqual([0, 1]);
    });
});
