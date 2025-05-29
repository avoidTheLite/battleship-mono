import createBoard from "../createBoard.ts"
import createShips from "../createShips.ts"
import type { GameState } from "../../types/types.ts";


export default function createTestGame(): GameState {
    return {
        id: 'test',
        name: 'test1',
        phase: 'deploy',
        turn: 0,
        active_player_index: 0,
        players: [
            {
                id: 'test1-player1',
                username: 'player1',
                game_id: 'test1',
                player_index: 0,
                board_data: createBoard(),
                attack_data: createBoard(),
                ship_data: createShips(),
                last_attack: {
                    position: null,
                    result: null,
                    target: null
                }
            },
            {
                id: 'test1-player2',
                username: 'player2',
                game_id: 'test1',
                player_index: 1,
                board_data: createBoard(),
                attack_data: createBoard(),
                ship_data: createShips(),
                last_attack: {
                    position: null,
                    result: null,
                    target: null
                }
            }
        ]
    }
}