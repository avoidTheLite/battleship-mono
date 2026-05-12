import type { Knex } from 'knex';

import config from './config.ts';

const connectionDetails: Knex.StaticConnectionConfig = {
    database: config.get('dbName') as string,
    user: config.get('dbUsername') as string,
    password: config.get('dbPassword') as string,
    host: config.get('dbHost') as string,
    port: config.get('dbPort') as number,
};

const knexConfig: { [key: string]: Knex.Config } = {
    local: {
        debug: true,
        client: 'pg',
        connection: connectionDetails,
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            tableName: 'knex_migrations',
            directory: './src/db/migrations',
        },
        seeds: {
            directory: './src/db/seeds',
        },
    },
    development: {
        debug: true,
        client: 'pg',
        connection: connectionDetails,
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            tableName: 'knex_migrations',
            directory: './src/db/migrations',
        },
        seeds: {
            directory: './src/db/seeds',
        },
    },
    test: {
        debug: false,
        client: 'sqlite3',
        connection: {
            filename: ':memory:',
        },
        useNullAsDefault: true,
        pool: {
            min: 1,
            max: 1,
        },
        migrations: {
            tableName: 'knex_migrations',
            directory: './src/db/migrations',
        },
        seeds: {
            directory: './src/db/seeds',
        },
    },
    production: {
        debug: false,
        client: 'pg',
        connection: connectionDetails,
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            tableName: 'knex_migrations',
            directory: './src/db/migrations',
        },
        seeds: {
            directory: './src/db/seeds',
        },
    },
};

export default knexConfig