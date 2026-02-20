import { Router } from 'express';
import { runCode } from '../controllers/codeController';

const router = Router();

router.post('/run', runCode);

export default router;
