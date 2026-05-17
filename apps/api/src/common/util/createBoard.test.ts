import { describe, it, expect } from "@jest/globals";
import createBoard from "./createBoard.ts";

describe('createBoard', () => {
    it('creates independent row arrays', () => {
        const board = createBoard();

        board[0][0] = 'A';

        expect(board[0][0]).toBe('A');
        expect(board[1][0]).toBe('O');
    });
});
