import type { PlayerBase, Player, PlayerRecord, GameState, Game, Board, ShipData, Attack } from '../common/types/types.ts';
import { DeployError, NewGameError, PlayerNotFoundError, EndTurnError, AttackError, SaveGameError } from '../common/types/errors.ts';
import { GAMESTATE_TABLE, PLAYER_TABLE } from '../db/tables.ts';
import ShortUniqueId from 'short-unique-id';
import createBoard from '../common/util/createBoard.ts';
import createShips from '../common/util/createShips.ts';
import db from '../db/db.ts';
import TurnManager from './services/TurnManager.ts';
import type { Knex } from 'knex';

let uid: ShortUniqueId = new ShortUniqueId({ length: 10 });
const turnManager: TurnManager = new TurnManager();
type GameStateUpdate = (gameState: GameState) => GameState | Promise<GameState>;

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

function parseRecordField<T>(field: string | T): T {
    return typeof field === 'string' ? JSON.parse(field) : field;
}

function createEmptyAttackResult() {
    return {
        position: null,
        result: null,
        target: null
    };
}

function parseLastAttack(field: PlayerRecord['last_attack']) {
    if (!field) {
        return createEmptyAttackResult();
    }
    return parseRecordField(field) ?? createEmptyAttackResult();
}

function convertPlayerRecordToPlayer(playerRecord: PlayerRecord): Player {
    return {
        id: playerRecord.id,
        username: playerRecord.username,
        player_index: playerRecord.player_index,
        game_id: playerRecord.game_id,
        board_data: parseRecordField(playerRecord.board_data),
        attack_data: parseRecordField(playerRecord.attack_data),
        ship_data: parseRecordField(playerRecord.ship_data),
        last_attack: parseLastAttack(playerRecord.last_attack)
    };
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
    public async getGame(gameID: string, trx?: Knex.Transaction, lock: boolean = false): Promise<GameState> {
        const database = trx ?? db;
        let gameQuery = database('games').select(
            "game.id",
            "game.name",
            "game.phase",
            "game.turn",
            "game.active_player_index"
        ).from(`${GAMESTATE_TABLE} as game`)
        .where('game.id', gameID);
        if (lock && db.client.config.client !== 'sqlite3') {
            gameQuery = gameQuery.forUpdate();
        }
        const game = await gameQuery.first().then((gameRecord: Game) => {
            if (!gameRecord) {
                throw new PlayerNotFoundError({
                    message: `Game with id ${gameID} not found`
                });
            }
            return gameRecord;
        })

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
        if (lock && db.client.config.client !== 'sqlite3') {
            playersQuery = playersQuery.forUpdate();
        }
        const players = await playersQuery.then((playerRecords: PlayerRecord[]) => {
            if (playerRecords.length !== 2) {
                throw new PlayerNotFoundError({
                    message: `Invalid number of players retrie3ved. Number of players retrieved was ${playerRecords.length}`
                });
            }
            return playerRecords.map(convertPlayerRecordToPlayer);
        });
        const gameState = {
            id: game.id,
            name: game.name,
            phase: game.phase,
            turn: game.turn,
            active_player_index: game.active_player_index,
            players: [
                players[0],
                players[1]
            ]
        }
        return gameState;
    }

    public async updateGame(gameID: string, updateGameState: GameStateUpdate): Promise<GameState> {
        return db.transaction(async (trx) => {
            const gameState = await this.getGame(gameID, trx, true);
            const updatedGameState = await updateGameState(gameState);
            await this.saveGame(gameID, updatedGameState, trx);
            return this.getGame(gameID, trx);
        });
    }

    public async saveGame(gameID: string, gameState: GameState, trx?: Knex.Transaction): Promise<GameState> {
        if (!trx) {
            return db.transaction(async (transaction) => this.saveGame(gameID, gameState, transaction));
        }
        try {
            const playerRecords: PlayerRecord[] = convertPlayersToPlayerRecords(gameState.players);
            for (let i = 0; i < playerRecords.length; i++) {
                await trx('players').where('id', playerRecords[i].id).update(playerRecords[i]);
            }
            const gameRecord: Game={
                id: gameState.id,
                name: gameState.name,
                phase: gameState.phase,
                turn: gameState.turn,
                active_player_index: gameState.active_player_index
            };
            await trx('games').where('id', gameID).update(gameRecord);
        } catch (error) {
            throw new SaveGameError({
                message: `Error saving game ${error}`
            });
        }
        return gameState;
    }
}

export { turnManager, GameStateController };