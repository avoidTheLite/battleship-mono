import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import type { PlayerRecord } from "../common/types/types.ts";

function createPlayerRecord(playerIndex: number, lastAttack: string | null): PlayerRecord {
    return {
        id: `player-${playerIndex}`,
        username: `Player ${playerIndex}`,
        player_index: playerIndex,
        game_id: 'game-1',
        board_data: JSON.stringify(Array.from({ length: 10 }, () => Array(10).fill('O'))),
        attack_data: JSON.stringify(Array.from({ length: 10 }, () => Array(10).fill('O'))),
        ship_data: JSON.stringify([]),
        last_attack: lastAttack as string
    };
}

describe('Game State Controller', () => {
    let GameStateController: typeof import('./gameState.ts').GameStateController;
    let playersQuery: any;

    beforeEach(async () => {
        jest.resetModules();

        const gameRecord = {
            id: 'game-1',
            name: 'Game 1',
            phase: 'play',
            turn: 1,
            active_player_index: 0
        };
        const playerRecords = [
            createPlayerRecord(1, JSON.stringify({ position: null, result: null, target: null })),
            createPlayerRecord(0, null)
        ];
        let ordered = false;

        const gameQuery: any = {
            select: jest.fn(() => gameQuery),
            from: jest.fn(() => gameQuery),
            where: jest.fn(() => gameQuery),
            first: jest.fn(() => ({
                then: (callback: (record: typeof gameRecord) => unknown) => Promise.resolve(callback(gameRecord))
            }))
        };

        playersQuery = {
            from: jest.fn(() => playersQuery),
            where: jest.fn(() => playersQuery),
            orderBy: jest.fn(() => {
                ordered = true;
                return playersQuery;
            }),
            then: (callback: (records: PlayerRecord[]) => unknown) => {
                const records = ordered
                    ? [...playerRecords].sort((left, right) => left.player_index - right.player_index)
                    : playerRecords;
                return Promise.resolve(callback(records));
            }
        };

        const dbMock: any = jest.fn(() => gameQuery);
        dbMock.select = jest.fn(() => playersQuery);

        jest.unstable_mockModule('../db/db.ts', () => ({
            default: dbMock,
            db: dbMock
        }));

        ({ GameStateController } = await import('./gameState.ts'));
    });

    it('loads players by player_index and normalizes nullable last_attack data', async () => {
        const controller = new GameStateController();

        const gameState = await controller.getGame('game-1');

        expect(playersQuery.orderBy).toHaveBeenCalledWith('player.player_index', 'asc');
        expect(gameState.players.map((player) => player.player_index)).toEqual([0, 1]);
        expect(gameState.players[0].last_attack).toEqual({
            position: null,
            result: null,
            target: null
        });
    });
});
