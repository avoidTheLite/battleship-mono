import { Knex } from 'knex';

const blankBoard = Array(10).fill(Array(10).fill("0"));

const shipData = [
    {
        "name": "Aircraft Carrier",
        "key": "A",
        "length": 5,
        "hits": 0,
        "sunk": false
    },
    {
        "name": "Battleship",
        "key": "B",
        "length": 4,
        "hits": 0,
        "sunk": false
    },
    {
        "name": "Cruiser",
        "key": "C",
        "length": 3,
        "hits": 0,
        "sunk": false
    },
    {
        "name": "Submarine",
        "key": "S",
        "length": 3,
        "hits": 0,
        "sunk": false
    },
    {
        "name": "Destroyer",
        "key": "D",
        "length": 2,
        "hits": 0,
        "sunk": false
    }
]

const game1Players = [
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

const game2Players = [
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