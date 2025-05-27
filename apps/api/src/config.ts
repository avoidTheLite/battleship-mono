import * as dotenv from 'dotenv'
import appConfig from '@battleship/util/appConfig';

dotenv.config();
dotenv.config({ path: `../.env.${process.env.NODE_ENV}` });


const config = appConfig({
  env: {
    default: 'local',
    env: 'NODE_ENV',
  },
  serverPort: {
    default: 3002,
    env: 'SERVER_PORT',
  },
  logLevel: {
    default: 'debug',
    env: 'LOG_LEVEL',
  },
  dbHost: {
    default: 'localhost',
    env: 'DB_URL',
  },
  dbPort: {
    default: 5433,
    env: 'DB_PORT',
  },
  dbUsername: {
    default: 'postgres',
    env: 'DB_USER',
  },
  dbPassword: {
    default: 'password',
    env: 'DB_PASSWORD',
  },
  dbName: {
    env: 'DB_NAME',
    default: 'battleship_db',
  },
});

export default config;