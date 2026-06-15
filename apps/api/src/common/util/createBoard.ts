import type { Board } from "../types/types.ts";

export default function createBoard(): Board {
    return Array.from({ length: 10 }, () => Array(10).fill("O")) as Board;
}
