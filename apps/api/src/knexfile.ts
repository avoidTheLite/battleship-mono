import type { Knex } from 'knex';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import config from './config.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDirectory = join(__dirname, 'db/migrations');
const seedsDirectory = join(__dirname, 'db/seeds');

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
            directory: migrationsDirectory,
        },
        seeds: {
            directory: seedsDirectory,
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
            directory: migrationsDirectory,
        },
        seeds: {
            directory: seedsDirectory,
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
            directory: migrationsDirectory,
        },
        seeds: {
            directory: seedsDirectory,
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
            directory: migrationsDirectory,
        },
        seeds: {
            directory: seedsDirectory,
        },
    },
};

export default knexConfig