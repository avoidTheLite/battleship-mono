import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Knex } from 'knex';

import config from './config.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
            directory: path.resolve(__dirname, './db/migrations'),
        },
        seeds: {
            directory: path.resolve(__dirname, './db/seeds'),
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
            directory: path.resolve(__dirname, './db/migrations'),
        },
        seeds: {
            directory: path.resolve(__dirname, './db/seeds'),
        },
    },
    test: {
        debug: false,
        client: 'sqlite3',
        connection: { filename: ':memory:' },
        useNullAsDefault: true,
        migrations: {
            tableName: 'knex_migrations',
            directory: path.resolve(__dirname, './db/migrations'),
        },
        seeds: {
            directory: path.resolve(__dirname, './db/seeds'),
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
            directory: path.resolve(__dirname, './db/migrations'),
        },
        seeds: {
            directory: path.resolve(__dirname, './db/seeds'),
        },
    },
};

export default knexConfig