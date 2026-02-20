import { Router } from 'express';
import { evaluateSession } from '../controllers/resultsController';

const router = Router();

router.post('/evaluate', evaluateSession);

export default router;
