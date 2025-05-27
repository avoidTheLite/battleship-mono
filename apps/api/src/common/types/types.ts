
export interface Game {
    id: string;
    name: string;
    phase: string;
    turn: number;
    active_player_index: number;
}
export interface GameState extends Game {
    players: Player[];
}

export interface PlayerBase {
    username: string;
    player_index: number;
}

export interface Player extends PlayerBase {
    id: string;
    game_id: string;
    board_data: Board;
    attack_data: Board;
    ship_data: ShipData;
    last_attack: AttackResult;
}

export interface PlayerRecord extends PlayerBase {
    id: string;
    game_id: string;
    board_data: string;
    attack_data: string;
    ship_data: string;
    last_attack: string;
}

export type Board = [
    [string, string, string, string, string, string, string, string, string, string],
    [string, string, string, string, string, string, string, string, string, string],
    [string, string, string, string, string, string, string, string, string, string],
    [string, string, string, string, string, string, string, string, string, string],
    [string, string, string, string, string, string, string, string, string, string],
    [string, string, string, string, string, string, string, string, string, string],
    [string, string, string, string, string, string, string, string, string, string],
    [string, string, string, string, string, string, string, string, string, string],
    [string, string, string, string, string, string, string, string, string, string],
    [string, string, string, string, string, string, string, string, string, string]
]

type Ship = {
    name: string,
    key: string,
    size: number,
    hits: number,
    sunk: boolean
}

export type ShipData = [
    Ship,
    Ship,
    Ship,
    Ship,
    Ship
]

export type Attack = {
    position: [ number, number ]
}

export interface AttackResult extends Attack {
    result: string
}