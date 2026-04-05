import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { CreateScoreSchema, UpdateScoreSchema, ListScoresQuerySchema } from "./scores.types.js";
import * as controller from "./scores.controller.js";

const router = Router();

router.post("/", validate(CreateScoreSchema), controller.create);
router.get("/", validate(ListScoresQuerySchema, "query"), controller.list);
router.get("/:id", controller.getOne);
router.put("/:id", validate(UpdateScoreSchema), controller.update);
router.delete("/:id", controller.remove);

export { router as scoresRouter };
