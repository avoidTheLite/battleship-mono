import { describe, expect, it } from "@jest/globals";

import createBoard from "./createBoard.ts";

describe("createBoard", () => {
    it("creates independent rows so cell mutations stay isolated", () => {
        const board = createBoard();

        board[0][0] = "H";

        expect(board[0][0]).toBe("H");
        expect(board[1][0]).toBe("O");
        expect(board[0]).not.toBe(board[1]);
    });
});
