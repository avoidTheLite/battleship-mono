import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('players', (table) => {
        table.string('id').primary();
        table.string('username');
        table.integer('player_index').notNullable();
        table.string('game_id').notNullable();
        table.jsonb('board_data').notNullable();
        table.jsonb('attack_data').notNullable();
        table.jsonb('ship_data').notNullable();
        table.jsonb('last_attack');
        table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('players');
}