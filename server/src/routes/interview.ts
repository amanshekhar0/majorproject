import { Router } from 'express';
import { chat, generateQuestions } from '../controllers/interviewerController';

const router = Router();

router.post('/chat', chat);
router.post('/generate-questions', generateQuestions);

export default router;
