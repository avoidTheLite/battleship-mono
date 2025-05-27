import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {

    await knex("games").del();

    await knex('games').insert([
        {
            id: 'seed-game-1',
            name: 'Game 1',
            phase: 'deploy',
            turn: 0,
            active_player_index: 0
        },
        {
            id: 'seed-game-2',
            name: 'Game 1',
            phase: 'play',
            turn: 1,
            active_player_index: 0
        }
    ]);
}