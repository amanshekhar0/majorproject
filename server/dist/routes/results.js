"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const resultsController_1 = require("../controllers/resultsController");
const router = (0, express_1.Router)();
router.post('/evaluate', resultsController_1.evaluateSession);
exports.default = router;
