import { describe, expect, it } from "@jest/globals";
import createBoard from "./createBoard.ts";

describe("createBoard", () => {
    it("creates independent rows so marking one cell does not mutate a column", () => {
        const board = createBoard();

        board[0][0] = "M";

        expect(board[0][0]).toBe("M");
        expect(board[1][0]).toBe("O");
        expect(board[9][0]).toBe("O");
    });
});
