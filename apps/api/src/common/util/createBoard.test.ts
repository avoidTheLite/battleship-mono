import { describe, it, expect } from "@jest/globals";
import createBoard from "./createBoard.ts";

describe('createBoard', () => {
    it('should create independent rows', () => {
        const board = createBoard();

        board[0][0] = 'H';

        expect(board[0][0]).toBe('H');
        expect(board[1][0]).toBe('O');
    });
});
