import type { Knex } from 'knex';
import type { PlayerBase, Player, PlayerRecord, GameState, Game, AttackResult, Board, ShipData } from '../common/types/types.ts';
import { DeployError, NewGameError, PlayerNotFoundError, EndTurnError, AttackError, SaveGameError } from '../common/types/errors.ts';
import { GAMESTATE_TABLE, PLAYER_TABLE } from '../db/tables.ts';
import ShortUniqueId from 'short-unique-id';
import createBoard from '../common/util/createBoard.ts';
import createShips from '../common/util/createShips.ts';
import db from '../db/db.ts';
import TurnManager from './services/TurnManager.ts';

let uid: ShortUniqueId = new ShortUniqueId({ length: 10 });
const turnManager: TurnManager = new TurnManager();

type DatabaseClient = Knex | Knex.Transaction;

function createEmptyLastAttack(): AttackResult {
    return {
        position: null,
        result: null,
        target: null
    } as AttackResult;
}

function parseJsonField<T>(fieldValue: string | T | null, fallback?: () => T): T {
    if (fieldValue === null) {
        if (fallback) {
            return fallback();
        }
        throw new PlayerNotFoundError({
            message: 'Unexpected null player data'
        });
    }
    return typeof fieldValue === 'string' ? JSON.parse(fieldValue) : fieldValue;
}

function convertPlayerRecordToPlayer(playerRecord: PlayerRecord): Player {
    return {
        id: playerRecord.id,
        username: playerRecord.username,
        player_index: playerRecord.player_index,
        game_id: playerRecord.game_id,
        board_data: parseJsonField<Board>(playerRecord.board_data),
        attack_data: parseJsonField<Board>(playerRecord.attack_data),
        ship_data: parseJsonField<ShipData>(playerRecord.ship_data),
        last_attack: parseJsonField(playerRecord.last_attack, createEmptyLastAttack)
    };
}

function buildGameState(game: Game, players: Player[]): GameState {
    return {
        id: game.id,
        name: game.name,
        phase: game.phase,
        turn: game.turn,
        active_player_index: game.active_player_index,
        players
    };
}

function convertPlayersToPlayerRecords(players: Player[]): PlayerRecord[] {
    let playerRecords: PlayerRecord[] = [];
    for (let i = 0; i < players.length; i++) {
        const playerRecord: PlayerRecord = {
            id: players[i].id,
            username: players[i].username,
            player_index: players[i].player_index,
            game_id: players[i].game_id,
            board_data: JSON.stringify(players[i].board_data),
            attack_data: JSON.stringify(players[i].attack_data),
            ship_data: JSON.stringify(players[i].ship_data),
            last_attack: JSON.stringify(players[i].last_attack)
        }
        playerRecords.push(playerRecord);
    }
    return playerRecords;
}

class GameStateController {

    constructor() {

    }
    
    public async createGame(players: PlayerBase[], gameName: string): Promise<GameState> {
        if (players.length !== 2) {
            throw new NewGameError({
                message: `Invalid number of players. Number of players was set to ${players.length}`
            });
        }
        const game: Game = {
            id: uid.rnd(),
            name: gameName,
            phase: 'deploy',
            turn: 0,
            active_player_index: 0
        }
        const player1: PlayerRecord = {
            id: uid.rnd(),
            username: players[0].username,
            player_index: 0,
            game_id: game.id,
            board_data: JSON.stringify(createBoard()),
            attack_data: JSON.stringify(createBoard()),
            ship_data: JSON.stringify(createShips()),
            last_attack: JSON.stringify({
                position: null,
                result: null,
                target: null
            })
        }
        const player2: PlayerRecord = {
            id: uid.rnd(),
            username: players[1].username,
            player_index: 1,
            game_id: game.id,
            board_data: JSON.stringify(createBoard()),
            attack_data: JSON.stringify(createBoard()),
            ship_data: JSON.stringify(createShips()),
            last_attack: JSON.stringify({
                position: null,
                result: null,
                target: null
            })
        }
        await db.transaction(async (trx) => {
            await trx('games').insert(game);
            await trx('players').insert([player1, player2]);
        });
        const gameState = await this.getGame(game.id);
        return gameState;

    }
    public async getGame(gameID: string): Promise<GameState> {
        return this.loadGameState(gameID, db, false);
    }

    public async updateGame(
        gameID: string,
        update: (gameState: GameState) => GameState | Promise<GameState>
    ): Promise<GameState> {
        return db.transaction(async (trx) => {
            const gameState = await this.loadGameState(gameID, trx, true);
            const updatedGameState = await update(gameState);
            await this.persistGame(gameID, updatedGameState, trx);
            return updatedGameState;
        });
    }

    private async loadGameState(gameID: string, database: DatabaseClient, lockRows: boolean): Promise<GameState> {
        let gameQuery = database('games').select(
            "game.id",
            "game.name",
            "game.phase",
            "game.turn",
            "game.active_player_index"
        ).from(`${GAMESTATE_TABLE} as game`)
        .where('game.id', gameID)
        .first();
        if (lockRows) {
            gameQuery = gameQuery.forUpdate();
        }
        const game = await gameQuery.then((gameRecord: Game) => {
                if (!gameRecord) {
                    throw new PlayerNotFoundError({
                        message: `Game with id ${gameID} not found`
                    });
                }
                return gameRecord;
            });

        let playersQuery = database.select(
            "player.id",
            "player.username",
            "player.player_index",
            "player.game_id",
            "player.board_data",
            "player.attack_data",
            "player.ship_data",
            "player.last_attack"
        ).from(`${PLAYER_TABLE} as player`)
        .where('player.game_id', gameID)
        .orderBy('player.player_index', 'asc');
        if (lockRows) {
            playersQuery = playersQuery.forUpdate();
        }
        const players = await playersQuery.then((playerRecords: PlayerRecord[]) => {
                if (playerRecords.length !== 2) {
                    throw new PlayerNotFoundError({
                        message: `Invalid number of players retrieved. Number of players retrieved was ${playerRecords.length}`
                    });
                }
                return playerRecords.map(convertPlayerRecordToPlayer);
            });

        return buildGameState(game, players);
    }

    public async saveGame(gameID: string, gameState: GameState): Promise<GameState> {
        await db.transaction(async (trx) => {
            await this.persistGame(gameID, gameState, trx);
        });
        return gameState;
    }

    private async persistGame(gameID: string, gameState: GameState, database: DatabaseClient): Promise<void> {
        const playerRecords: PlayerRecord[] = convertPlayersToPlayerRecords(gameState.players);
        for (let i = 0; i < playerRecords.length; i++) {
            try{
                await database('players').where('id', playerRecords[i].id).update(playerRecords[i]);
            } catch (error) {
                throw new SaveGameError({
                    message: `Error saving game ${error}`
                });
            }
        }
        const gameRecord: Game={
            id: gameState.id,
            name: gameState.name,
            phase: gameState.phase,
            turn: gameState.turn,
            active_player_index: gameState.active_player_index
        };
        try{
            await database('games').where('id', gameID).update(gameRecord);
        } catch (error) {
            throw new SaveGameError({
                message: `Error saving game ${error}`
            });
        }
    }
}

export { turnManager, GameStateController };