import { Router } from "express";
import {
  chat,
  generateQuestions,
  generateRandomQuestions,
} from "../controllers/interviewerController";

const router = Router();

router.post("/chat", chat);
router.post("/generate-questions", generateQuestions);
router.post("/generate-random", generateRandomQuestions);

export default router;
