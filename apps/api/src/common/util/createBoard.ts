import type { Board } from "../types/types.ts";

export default function createBoard(): Board {
    return Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => "O")) as Board;
}