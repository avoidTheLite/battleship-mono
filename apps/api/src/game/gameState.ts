import type { PlayerBase, Player, PlayerRecord, GameState, Game, Board, ShipData, AttackResult } from '../common/types/types.ts';
import { NewGameError, PlayerNotFoundError, SaveGameError } from '../common/types/errors.ts';
import { GAMESTATE_TABLE, PLAYER_TABLE } from '../db/tables.ts';
import ShortUniqueId from 'short-unique-id';
import createBoard from '../common/util/createBoard.ts';
import createShips from '../common/util/createShips.ts';
import db from '../db/db.ts';
import TurnManager from './services/TurnManager.ts';

let uid: ShortUniqueId = new ShortUniqueId({ length: 10 });
const turnManager: TurnManager = new TurnManager();

function createBlankAttackResult(): AttackResult {
    return {
        position: null,
        result: null,
        target: null
    };
}

function parseJsonField<T>(field: string | T): T {
    return typeof field === 'string' ? JSON.parse(field) as T : field;
}

function parseLastAttack(lastAttack: string | AttackResult | null): AttackResult {
    if (lastAttack === null) {
        return createBlankAttackResult();
    }

    const parsedLastAttack = parseJsonField<AttackResult | null>(lastAttack);
    return parsedLastAttack ?? createBlankAttackResult();
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
            last_attack: JSON.stringify(players[i].last_attack ?? createBlankAttackResult())
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
        .orderBy("player.player_index", "asc")
        .then((playerRecords: PlayerRecord[]) => {
            if (playerRecords.length !== 2) {
                throw new PlayerNotFoundError({
                    message: `Invalid number of players retrie3ved. Number of players retrieved was ${playerRecords.length}`
                });
            }
            const players = [{
                id: playerRecords[0].id,
                username: playerRecords[0].username,
                player_index: playerRecords[0].player_index,
                game_id: playerRecords[0].game_id,
                board_data: parseJsonField<Board>(playerRecords[0].board_data),
                attack_data: parseJsonField<Board>(playerRecords[0].attack_data),
                ship_data: parseJsonField<ShipData>(playerRecords[0].ship_data),
                last_attack: parseLastAttack(playerRecords[0].last_attack)
            },{
                id: playerRecords[1].id,
                username: playerRecords[1].username,
                player_index: playerRecords[1].player_index,
                game_id: playerRecords[1].game_id,
                board_data: parseJsonField<Board>(playerRecords[1].board_data),
                attack_data: parseJsonField<Board>(playerRecords[1].attack_data),
                ship_data: parseJsonField<ShipData>(playerRecords[1].ship_data),
                last_attack: parseLastAttack(playerRecords[1].last_attack)
            }];
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
        const gameRecord: Game={
            id: gameState.id,
            name: gameState.name,
            phase: gameState.phase,
            turn: gameState.turn,
            active_player_index: gameState.active_player_index
        };
        try{
            const playerRecords: PlayerRecord[] = convertPlayersToPlayerRecords(gameState.players);
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