import type { PlayerBase, Player, PlayerRecord, GameState, Game, Board, ShipData, Attack } from '../common/types/types.ts';
import { DeployError, NewGameError, PlayerNotFoundError } from '../common/types/errors.ts';
import { GAMESTATE_TABLE, PLAYER_TABLE } from '../db/tables.ts';
import ShortUniqueId from 'short-unique-id';
import createBoard from '../common/util/createBoard.ts';
import createShips from '../common/util/createShips.ts';
import db from '../db/db.ts';
import Logger from '@battleship/util/Logger';

let uid: ShortUniqueId = new ShortUniqueId({ length: 10 });

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

function GameStateController() {
    async function createGame(players: PlayerBase[], gameName: string): Promise<GameState> {
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
            last_attack: null
        }
        const player2: PlayerRecord = {
            id: uid.rnd(),
            username: players[1].username,
            player_index: 1,
            game_id: game.id,
            board_data: JSON.stringify(createBoard()),
            attack_data: JSON.stringify(createBoard()),
            ship_data: JSON.stringify(createShips()),
            last_attack: null
        }
        await db('games').insert(game);
        await db('players').insert([player1, player2]);
        const gameState = await getGame(game.id);
        return gameState;

    }
    async function getGame(gameID: string): Promise<GameState> {
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
                board_data: typeof playerRecords[0].board_data === 'string' ? JSON.parse(playerRecords[0].board_data) : playerRecords[0].board_data,
                attack_data: typeof playerRecords[0].attack_data === 'string' ? JSON.parse(playerRecords[0].attack_data) : playerRecords[0].attack_data,
                ship_data: typeof playerRecords[0].ship_data === 'string' ? JSON.parse(playerRecords[0].ship_data) : playerRecords[0].ship_data,
                last_attack: typeof playerRecords[0].last_attack === 'string' ? JSON.parse(playerRecords[0].last_attack) : playerRecords[0].last_attack
            },{
                id: playerRecords[1].id,
                username: playerRecords[1].username,
                player_index: playerRecords[1].player_index,
                game_id: playerRecords[1].game_id,
                board_data: typeof playerRecords[1].board_data === 'string' ? JSON.parse(playerRecords[1].board_data) : playerRecords[1].board_data,
                attack_data: typeof playerRecords[1].attack_data === 'string' ? JSON.parse(playerRecords[1].attack_data) : playerRecords[1].attack_data,
                ship_data: typeof playerRecords[1].ship_data === 'string' ? JSON.parse(playerRecords[1].ship_data) : playerRecords[1].ship_data,
                last_attack: typeof playerRecords[1].last_attack === 'string' ? JSON.parse(playerRecords[1].last_attack) : playerRecords[1].last_attack
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
    async function deploy(gameID: string, deployBoard: Board): Promise<GameState> {
        let gameState = await getGame(gameID);
        gameState.players[gameState.active_player_index].board_data = deployBoard;
        console.log(JSON.stringify(gameState));
        const playerRecords: PlayerRecord[] = convertPlayersToPlayerRecords(gameState.players);
        try{
            await db('players').where('id', playerRecords[gameState.active_player_index].id).update(playerRecords[gameState.active_player_index]);
        } catch (error) {
            throw new DeployError({
                message: `Error deploying board ${error}`
            });
        }
        const retrievedGameState = await getGame(gameID);

        return retrievedGameState;
    }
    return {
        createGame,
        getGame,
        deploy
    }
}

export default GameStateController;