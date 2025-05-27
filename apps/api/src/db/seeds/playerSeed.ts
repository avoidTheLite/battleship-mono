import type { Knex } from 'knex';
import type { PlayerRecord, ShipData, Board, Player } from '../../common/types/types.ts';
import createShips from '../../common/util/createShips.ts';
import createBoard from '../../common/util/createBoard.ts';


const blankBoard: Board = createBoard();
const shipData: ShipData = createShips();

const game1Players: PlayerRecord[] = [
    {
        id: 'seed-game-1-player-1',
        username: 'Player 1',
        player_index: 0,
        game_id: 'seed-game-1',
        board_data: JSON.stringify(blankBoard),
        attack_data: JSON.stringify(blankBoard),
        ship_data: JSON.stringify(shipData),
        last_attack: null
    },
    {
        id: 'seed-game-1-player-2',
        username: 'Player 2',
        player_index: 1,
        game_id: 'seed-game-1',
        board_data: JSON.stringify(blankBoard),
        attack_data: JSON.stringify(blankBoard),
        ship_data: JSON.stringify(shipData),
        last_attack: null
    },
]

const game2Players: PlayerRecord[] = [
    {
        id: 'seed-game-2-player-1',
        username: 'Player 1',
        player_index: 0,
        game_id: 'seed-game-2',
        board_data: JSON.stringify([
            ["O", "O", "O", "O", "O", "O", "O", "D", "D", "O"],
            ["O", "O", "O", "O", "O", "A", "O", "O", "O", "O"],
            ["O", "O", "O", "O", "O", "A", "O", "O", "O", "O"],
            ["O", "O", "O", "O", "O", "A", "O", "O", "O", "O"],
            ["O", "O", "O", "O", "O", "A", "O", "O", "O", "O"],
            ["O", "O", "O", "O", "O", "A", "O", "O", "C", "O"],
            ["O", "O", "O", "B", "B", "B", "B", "O", "C", "O"],
            ["O", "O", "O", "O", "O", "O", "O", "O", "C", "O"],
            ["O", "O", "O", "O", "O", "O", "O", "O", "O", "O"],
            ["O", "O", "O", "O", "O", "S", "S", "S", "O", "O"]
        ]),
        attack_data: JSON.stringify(blankBoard),
        ship_data: JSON.stringify(shipData),
        last_attack: null
    },
    {
        id: 'seed-game-2-player-2',
        username: 'Player 2',
        player_index: 1,
        game_id: 'seed-game-2',
        board_data: JSON.stringify([
            ["A", "A", "A", "A", "A", "O", "O", "D", "D", "O"],
            ["O", "O", "O", "O", "O", "O", "O", "O", "O", "O"],
            ["O", "O", "O", "O", "O", "O", "O", "O", "O", "O"],
            ["O", "O", "O", "O", "O", "O", "O", "O", "O", "O"],
            ["O", "O", "O", "O", "O", "O", "O", "O", "O", "O"],
            ["O", "O", "B", "O", "O", "O", "O", "O", "C", "O"],
            ["O", "O", "B", "O", "O", "O", "O", "O", "C", "O"],
            ["O", "O", "B", "O", "O", "O", "O", "O", "C", "O"],
            ["O", "O", "B", "O", "O", "O", "O", "O", "O", "O"],
            ["O", "O", "O", "O", "O", "S", "S", "S", "O", "O"]
        ]),
        attack_data: JSON.stringify(blankBoard),
        ship_data: JSON.stringify(shipData),
        last_attack: null
    },
]

export async function seed(knex: Knex): Promise<void> {
    
    await knex("players").del();
    console.log("Seeding players");
    console.log(JSON.stringify([
        ...game1Players,
        ...game2Players
    ]));
    await knex('players').insert([
        ...game1Players,
        ...game2Players
    ]);
}