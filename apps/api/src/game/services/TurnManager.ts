import type { GameState, Player, Board } from '../../common/types/types.ts';
import { EndTurnError } from '../../common/types/errors.ts';

export default class TurnManager {

    public endTurnDeployPhase(gameState: GameState): GameState {
        if (gameState.phase !== 'deploy') {
            throw new EndTurnError({
                message: 'Game is not in deploy phase'
            });
        }
        if (gameState.active_player_index === 0) {
            gameState.phase = 'deploy';
            gameState.active_player_index = 1;
        } else {
            gameState.phase = 'play';
            gameState.turn = 1;
            gameState.active_player_index = 0;
        }
        return gameState;
    }

    public endTurnPlayPhase(gameState: GameState): GameState {
        if (gameState.phase !== 'play') {
            throw new EndTurnError({
                message: 'Game is not in play phase'
            });
        }
        
        gameState.turn++;
        gameState.active_player_index = (gameState.active_player_index + 1 ) % 2;
        return gameState;
    }

}