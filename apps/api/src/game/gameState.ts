import type { PlayerBase, Player, PlayerRecord, GameState, Game, Board, ShipData, Attack } from '../common/types/types.ts';
import { DeployError, NewGameError, PlayerNotFoundError, EndTurnError, AttackError, SaveGameError } from '../common/types/errors.ts';
import { GAMESTATE_TABLE, PLAYER_TABLE } from '../db/tables.ts';
import ShortUniqueId from 'short-unique-id';
import createBoard from '../common/util/createBoard.ts';
import createShips from '../common/util/createShips.ts';
import db from '../db/db.ts';
import TurnManager from './services/TurnManager.ts';

let uid: ShortUniqueId = new ShortUniqueId({ length: 10 });
const turnManager: TurnManager = new TurnManager();

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

function emptyLastAttack() {
    return {
        position: null,
        result: null,
        target: null
    };
}

function parseJsonField(value, fallback) {
    if (typeof value === 'string') {
        return JSON.parse(value);
    }
    return value ?? fallback;
}

function convertPlayerRecord(playerRecord: PlayerRecord): Player {
    return {
        id: playerRecord.id,
        username: playerRecord.username,
        player_index: playerRecord.player_index,
        game_id: playerRecord.game_id,
        board_data: parseJsonField(playerRecord.board_data, createBoard()),
        attack_data: parseJsonField(playerRecord.attack_data, createBoard()),
        ship_data: parseJsonField(playerRecord.ship_data, createShips()),
        last_attack: parseJsonField(playerRecord.last_attack, emptyLastAttack())
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
    private async loadGame(gameID: string, connection = db, lockRows = false): Promise<GameState> {
        let gameQuery = connection('games').select(
            "game.id",
            "game.name",
            "game.phase",
            "game.turn",
            "game.active_player_index"
        ).from(`${GAMESTATE_TABLE} as game`)
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

        let playerQuery = connection.select(
            "player.id",
            "player.username",
            "player.player_index",
            "player.game_id",
            "player.board_data",
            "player.attack_data",
            "player.ship_data",
            "player.last_attack"
        ).from(`${PLAYER_TABLE} as player`)
        .where('player.game_id', gameID);
        if (lockRows) {
            playerQuery = playerQuery.forUpdate();
        }
        const players = await playerQuery
        .then((playerRecords: PlayerRecord[]) => {
            if (playerRecords.length !== 2) {
                throw new PlayerNotFoundError({
                    message: `Invalid number of players retrie3ved. Number of players retrieved was ${playerRecords.length}`
                });
            }
            return playerRecords
                .sort((playerA, playerB) => playerA.player_index - playerB.player_index)
                .map(convertPlayerRecord);
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
        return this.loadGame(gameID);
    }

    private async persistGame(gameID: string, gameState: GameState, connection = db): Promise<GameState> {
        const playerRecords: PlayerRecord[] = convertPlayersToPlayerRecords(gameState.players);
        const gameRecord: Game={
            id: gameState.id,
            name: gameState.name,
            phase: gameState.phase,
            turn: gameState.turn,
            active_player_index: gameState.active_player_index
        };
        for (let i = 0; i < playerRecords.length; i++) {
            await connection('players').where('id', playerRecords[i].id).update(playerRecords[i]);
        }
        await connection('games').where('id', gameID).update(gameRecord);
        return gameState;
    }

    public async saveGame(gameID: string, gameState: GameState): Promise<GameState> {
        try{
            await db.transaction(async (trx) => {
                await this.persistGame(gameID, gameState, trx);
            });
        } catch (error) {
            throw new SaveGameError({
                message: `Error saving game ${error}`
            });
        }
        return gameState;
    }

    public async updateGame(gameID: string, update: (gameState: GameState) => GameState | Promise<GameState>): Promise<GameState> {
        try {
            return await db.transaction(async (trx) => {
                const gameState = await this.loadGame(gameID, trx, true);
                const updatedGameState = await update(gameState);
                return this.persistGame(gameID, updatedGameState, trx);
            });
        } catch (error) {
            throw new SaveGameError({
                message: `Error saving game ${error}`
            });
        }
    }
}

export { turnManager, GameStateController };