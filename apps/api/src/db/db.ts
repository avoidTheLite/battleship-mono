import Knex from 'knex';
import knexConfig from '../knexfile';

const environment = process.env.NODE_ENV || 'local';
if (!knexConfig[environment]) {
    throw new Error(`Unable to find knex config for environment: ${environment}`);
}

export const db = Knex(knexConfig[environment]);

export default db;