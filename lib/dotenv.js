import path from 'path';
import {fileURLToPath} from 'url';

import dotenv from 'dotenv';

const __filename = fileURLToPath (import.meta.url);
const __dirname = path.dirname (__filename);

export const APP_DIR_PATH = path.dirname (__dirname);

let alreadyLoadDotEnv = false;

export const loadDotEnv = () => {
  if (alreadyLoadDotEnv) {
    return;
  }
  dotenv.config ({path: `${APP_DIR_PATH}/.env`});
  alreadyLoadDotEnv = true;
};
