import type { ShipData } from '../types/types.ts';

export default function createShips(): ShipData {
    return [
        {
            "name": "Aircraft Carrier",
            "key": "A",
            "size": 5,
            "hits": 0,
            "sunk": false
        },
        {
            "name": "Battleship",
            "key": "B",
            "size": 4,
            "hits": 0,
            "sunk": false
        },
        {
            "name": "Cruiser",
            "key": "C",
            "size": 3,
            "hits": 0,
            "sunk": false
        },
        {
            "name": "Submarine",
            "key": "S",
            "size": 3,
            "hits": 0,
            "sunk": false
        },
        {
            "name": "Destroyer",
            "key": "D",
            "size": 2,
            "hits": 0,
            "sunk": false
        }
    ];
}