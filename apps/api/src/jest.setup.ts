import { beforeAll, beforeEach, afterAll } from "@jest/globals";

let db: typeof import("./db/db.ts").default | undefined;

if (process.env.RUN_DB_TESTS === 'true') {
    beforeAll(async () => {
        db = (await import("./db/db.ts")).default;
        await db.migrate.latest();
        await db.seed.run();
    });
}

beforeEach(async () => {
    // await db.seed.run();
});

afterAll(async () => {
    await db?.destroy();
});