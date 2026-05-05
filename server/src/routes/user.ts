import { Router } from "express";
import {
  saveInterview,
  getUserPerformance,
} from "../controllers/userInterviewController";

const router = Router();

router.post("/interviews", saveInterview);
router.get("/performance", getUserPerformance);

export default router;
