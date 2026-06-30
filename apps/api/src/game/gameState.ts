import type { PlayerBase, Player, PlayerRecord, GameState, Game, AttackResult } from '../common/types/types.ts';
import { NewGameError, PlayerNotFoundError, SaveGameError } from '../common/types/errors.ts';
import { GAMESTATE_TABLE, PLAYER_TABLE } from '../db/tables.ts';
import ShortUniqueId from 'short-unique-id';
import type { Knex } from 'knex';
import createBoard from '../common/util/createBoard.ts';
import createShips from '../common/util/createShips.ts';
import db from '../db/db.ts';
import TurnManager from './services/TurnManager.ts';

let uid: ShortUniqueId = new ShortUniqueId({ length: 10 });
const turnManager: TurnManager = new TurnManager();
type DbClient = Knex | Knex.Transaction;

const EMPTY_ATTACK_RESULT: AttackResult = {
    position: null,
    result: null,
    target: null
};

function parseRecordValue<T>(value: string | T): T {
    return typeof value === 'string' ? JSON.parse(value) : value;
}

function parseLastAttack(value: string | AttackResult | null): AttackResult {
    if (value === null) {
        return { ...EMPTY_ATTACK_RESULT };
    }
    return parseRecordValue<AttackResult>(value) ?? { ...EMPTY_ATTACK_RESULT };
}

function convertPlayerRecordToPlayer(playerRecord: PlayerRecord): Player {
    return {
        id: playerRecord.id,
        username: playerRecord.username,
        player_index: playerRecord.player_index,
        game_id: playerRecord.game_id,
        board_data: parseRecordValue<Player['board_data']>(playerRecord.board_data),
        attack_data: parseRecordValue<Player['attack_data']>(playerRecord.attack_data),
        ship_data: parseRecordValue<Player['ship_data']>(playerRecord.ship_data),
        last_attack: parseLastAttack(playerRecord.last_attack)
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
    private async loadGame(gameID: string, client: DbClient, lockRows = false): Promise<GameState> {
        let gameQuery = client(`${GAMESTATE_TABLE} as game`).select(
            "game.id",
            "game.name",
            "game.phase",
            "game.turn",
            "game.active_player_index"
        )
        .where('game.id', gameID).first();
        if (lockRows) {
            gameQuery = gameQuery.forUpdate();
        }
        const game = await gameQuery
        .then((gameRecord: Game) => {
            if (!gameRecord) {
                throw new PlayerNotFoundError({
                    message: `Game with id ${gameID} not found`
                });
            }
            return gameRecord;
        })

        let playersQuery = client(`${PLAYER_TABLE} as player`).select(
            "player.id",
            "player.username",
            "player.player_index",
            "player.game_id",
            "player.board_data",
            "player.attack_data",
            "player.ship_data",
            "player.last_attack"
        )
        .where('player.game_id', gameID)
        .orderBy('player.player_index', 'asc');
        if (lockRows) {
            playersQuery = playersQuery.forUpdate();
        }
        const players = await playersQuery
        .then((playerRecords: PlayerRecord[]) => {
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

    public async getGame(gameID: string): Promise<GameState> {
        return this.loadGame(gameID, db);
    }

    private async persistGame(client: DbClient, gameID: string, gameState: GameState): Promise<void> {
        const gameRecord: Game={
            id: gameState.id,
            name: gameState.name,
            phase: gameState.phase,
            turn: gameState.turn,
            active_player_index: gameState.active_player_index
        };
        const playerRecords: PlayerRecord[] = convertPlayersToPlayerRecords(gameState.players);
        for (let i = 0; i < playerRecords.length; i++) {
            await client('players').where('id', playerRecords[i].id).update(playerRecords[i]);
        }
        await client('games').where('id', gameID).update(gameRecord);
    }

    public async saveGame(gameID: string, gameState: GameState, trx?: Knex.Transaction): Promise<GameState> {
        try{
            if (trx) {
                await this.persistGame(trx, gameID, gameState);
            } else {
                await db.transaction(async (transaction) => {
                    await this.persistGame(transaction, gameID, gameState);
                });
            }
        } catch (error) {
            throw new SaveGameError({
                message: `Error saving game ${error}`
            });
        }
        return gameState;
    }

    public async updateGame(gameID: string, update: (gameState: GameState) => GameState): Promise<GameState> {
        await db.transaction(async (trx) => {
            const gameState = await this.loadGame(gameID, trx, true);
            const updatedGameState = update(gameState);
            await this.saveGame(gameID, updatedGameState, trx);
        });
        return this.getGame(gameID);
    }
}

export { turnManager, GameStateController };