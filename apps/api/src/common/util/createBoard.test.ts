import createBoard from "./createBoard.ts";
import { describe, expect, it } from "@jest/globals";

describe('createBoard', () => {
    it('should create independent rows', () => {
        const board = createBoard();

        board[0][0] = 'H';

        expect(board[0][0]).toBe('H');
        expect(board[1][0]).toBe('O');
    });
});
