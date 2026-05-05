"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const interviewerController_1 = require("../controllers/interviewerController");
const router = (0, express_1.Router)();
router.post('/chat', interviewerController_1.chat);
router.post('/generate-questions', interviewerController_1.generateQuestions);
router.post('/generate-random', interviewerController_1.generateRandomQuestions);
exports.default = router;
