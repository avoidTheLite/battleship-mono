import { describe, expect, it } from "@jest/globals";
import createBoard from "./createBoard.ts";

describe('createBoard', () => {
    it('creates independent rows so one marker does not corrupt a column', () => {
        const board = createBoard();

        board[0][0] = 'H';

        expect(board[0][0]).toBe('H');
        expect(board[1][0]).toBe('O');
    });
});
