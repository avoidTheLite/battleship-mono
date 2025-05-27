import { Router } from "express";
import gameController from "./gameController.ts";
import bodyParser from "body-parser";

const gameRouter: Router = Router();
const gameControllerInstance = gameController();

gameRouter.use(bodyParser.json());

gameRouter.post('/new', gameControllerInstance.newGame);
gameRouter.get('/:id', gameControllerInstance.getGame);
gameRouter.patch('/:id/deploy', gameControllerInstance.deploy);
gameRouter.post('/:id/attack', gameControllerInstance.attack);

export default gameRouter;