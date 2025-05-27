import type { Board } from "../types/types.ts";

export default function createBoard(): Board {
    return Array(10).fill(Array(10).fill("O")) as Board;
}