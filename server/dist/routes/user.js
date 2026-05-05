"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userInterviewController_1 = require("../controllers/userInterviewController");
const router = (0, express_1.Router)();
router.post("/interviews", userInterviewController_1.saveInterview);
router.get("/performance", userInterviewController_1.getUserPerformance);
exports.default = router;
