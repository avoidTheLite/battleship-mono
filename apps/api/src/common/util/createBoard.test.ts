import { describe, expect, it } from "@jest/globals";
import createBoard from "./createBoard.ts";

describe('createBoard', () => {
    it('creates independent rows so one cell mutation does not update a whole column', () => {
        const board = createBoard();

        board[2][3] = 'H';

        expect(board[2][3]).toBe('H');
        expect(board[0][3]).toBe('O');
        expect(board[9][3]).toBe('O');
    });
});
