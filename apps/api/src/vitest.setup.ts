import { beforeAll, afterAll } from 'vitest';
import db from './db/db.ts';

beforeAll(async () => {
    await db.migrate.latest();
    await db.seed.run();
});

afterAll(async () => {
    await db.destroy();
});
