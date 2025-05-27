import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('games', (table) => {
        table.string('id').primary();
        table.string('name').notNullable();
        table.string('phase').notNullable();
        table.integer('turn').notNullable();
        table.integer('active_player_index').notNullable();
        table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('games');
}