"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const codeController_1 = require("../controllers/codeController");
const router = (0, express_1.Router)();
router.post('/run', codeController_1.runCode);
exports.default = router;
