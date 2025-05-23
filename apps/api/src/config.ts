import * as dotenv from 'dotenv'
import appConfig from '@battleship/util/appConfig';

dotenv.config();
dotenv.config({ path: '../.env' });


const config = appConfig({
  env: {
    default: 'local',
    env: 'NODE_ENV',
  },
  serverPort: {
    default: 3001,
    env: 'PORT',
  },
  logLevel: {
    default: 'debug',
    env: 'LOG_LEVEL',
  },
});

export default config;