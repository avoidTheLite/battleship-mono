import type { PlayerBase, Player, PlayerRecord, GameState, Game, Board, ShipData, AttackResult } from '../common/types/types.ts';
import { DeployError, NewGameError, PlayerNotFoundError, EndTurnError, AttackError, SaveGameError } from '../common/types/errors.ts';
import { GAMESTATE_TABLE, PLAYER_TABLE } from '../db/tables.ts';
import ShortUniqueId from 'short-unique-id';
import createBoard from '../common/util/createBoard.ts';
import createShips from '../common/util/createShips.ts';
import db from '../db/db.ts';
import TurnManager from './services/TurnManager.ts';

let uid: ShortUniqueId = new ShortUniqueId({ length: 10 });
const turnManager: TurnManager = new TurnManager();

function emptyLastAttack(): AttackResult {
    return {
        position: null,
        result: null,
        target: null
    };
}

function parseRecordField<T>(value: string | T | null | undefined, fallback: () => T): T {
    if (value === null || value === undefined) {
        return fallback();
    }
    if (typeof value === 'string') {
        return JSON.parse(value) as T;
    }
    return value;
}

function convertPlayerRecordToPlayer(playerRecord: PlayerRecord): Player {
    return {
        id: playerRecord.id,
        username: playerRecord.username,
        player_index: playerRecord.player_index,
        game_id: playerRecord.game_id,
        board_data: parseRecordField<Board>(playerRecord.board_data, createBoard),
        attack_data: parseRecordField<Board>(playerRecord.attack_data, createBoard),
        ship_data: parseRecordField<ShipData>(playerRecord.ship_data, createShips),
        last_attack: parseRecordField<AttackResult>(playerRecord.last_attack, emptyLastAttack)
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
            await trx(GAMESTATE_TABLE).insert(game);
            await trx(PLAYER_TABLE).insert([player1, player2]);
        });
        const gameState = await this.getGame(game.id);
        return gameState;

    }
    public async getGame(gameID: string): Promise<GameState> {
        const game = await db('games').select(
            "game.id",
            "game.name",
            "game.phase",
            "game.turn",
            "game.active_player_index"
        ).from(`${GAMESTATE_TABLE} as game`)
        .where('game.id', gameID).first()
        .then((gameRecord: Game) => {
            if (!gameRecord) {
                throw new PlayerNotFoundError({
                    message: `Game with id ${gameID} not found`
                });
            }
            return gameRecord;
        })

        const players = await db.select(
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
        .orderBy('player.player_index', 'asc')
        .then((playerRecords: PlayerRecord[]) => {
            if (playerRecords.length !== 2) {
                throw new PlayerNotFoundError({
                    message: `Invalid number of players retrie3ved. Number of players retrieved was ${playerRecords.length}`
                });
            }
            const players = playerRecords.map(convertPlayerRecordToPlayer);
            if (players[0].player_index !== 0 || players[1].player_index !== 1) {
                throw new PlayerNotFoundError({
                    message: `Invalid player indexes retrieved for game ${gameID}`
                });
            }
            return players;
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

    public async saveGame(gameID: string, gameState: GameState): Promise<GameState> {
        const playerRecords: PlayerRecord[] = convertPlayersToPlayerRecords(gameState.players);
        const gameRecord: Game={
            id: gameState.id,
            name: gameState.name,
            phase: gameState.phase,
            turn: gameState.turn,
            active_player_index: gameState.active_player_index
        };
        try{
            await db.transaction(async (trx) => {
                for (let i = 0; i < playerRecords.length; i++) {
                    await trx(PLAYER_TABLE).where('id', playerRecords[i].id).update(playerRecords[i]);
                }
                await trx(GAMESTATE_TABLE).where('id', gameID).update(gameRecord);
            });
        } catch (error) {
            throw new SaveGameError({
                message: `Error saving game ${error}`
            });
        }
        return gameState;
    }
}

export { turnManager, GameStateController };