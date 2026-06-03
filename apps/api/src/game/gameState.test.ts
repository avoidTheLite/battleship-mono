import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import type { PlayerRecord } from "../common/types/types.ts";
import createTestGame from "../common/util/test/createTestGame.ts";

function createPlayerRecord(playerIndex: number, lastAttack: string | null): PlayerRecord {
    return {
        id: `player-${playerIndex}`,
        username: `Player ${playerIndex}`,
        player_index: playerIndex,
        game_id: 'game-1',
        board_data: JSON.stringify(Array.from({ length: 10 }, () => Array(10).fill('O'))),
        attack_data: JSON.stringify(Array.from({ length: 10 }, () => Array(10).fill('O'))),
        ship_data: JSON.stringify([]),
        last_attack: lastAttack
    };
}

describe('Game State Controller', () => {
    let GameStateController: typeof import('./gameState.ts').GameStateController;
    let dbMock: any;
    let playersQuery: any;
    let updateCalls: Array<{ tableName: string; column: string; value: string; record: unknown }>;

    beforeEach(async () => {
        jest.resetModules();
        updateCalls = [];

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

        const trxMock: any = jest.fn((tableName: string) => ({
            where: jest.fn((column: string, value: string) => ({
                update: jest.fn(async (record: unknown) => {
                    updateCalls.push({ tableName, column, value, record });
                    return 1;
                })
            })),
            insert: jest.fn(async () => 1)
        }));

        dbMock = jest.fn(() => gameQuery);
        dbMock.select = jest.fn(() => playersQuery);
        dbMock.transaction = jest.fn(async (callback: (trx: typeof trxMock) => Promise<void>) => callback(trxMock));

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

    it('saves player and game records inside a single transaction', async () => {
        const controller = new GameStateController();
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.turn = 3;
        gameState.active_player_index = 1;

        await controller.saveGame(gameState.id, gameState);

        expect(dbMock.transaction).toHaveBeenCalledTimes(1);
        expect(updateCalls.map((call) => call.tableName)).toEqual(['players', 'players', 'games']);
        expect(updateCalls[2].record).toEqual({
            id: gameState.id,
            name: gameState.name,
            phase: 'play',
            turn: 3,
            active_player_index: 1
        });
    });
});
