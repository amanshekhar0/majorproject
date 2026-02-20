import { Router } from 'express';
import { parseResume, upload } from '../controllers/resumeController';

const router = Router();

router.post('/upload', upload.single('resume'), parseResume);

export default router;
