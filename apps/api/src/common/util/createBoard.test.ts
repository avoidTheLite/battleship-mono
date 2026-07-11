import { describe, expect, it } from "@jest/globals";
import createBoard from "./createBoard.ts";

describe('createBoard', () => {
    it('should create independent rows', () => {
        const board = createBoard();

        board[0][3] = 'H';

        expect(board[0][3]).toBe('H');
        expect(board[1][3]).toBe('O');
    });
});
