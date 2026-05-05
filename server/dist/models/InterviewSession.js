"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewSession = void 0;
const mongoose_1 = require("mongoose");
const ProctoringSchema = new mongoose_1.Schema({
    tabSwitchCount: { type: Number, default: 0 },
    faceViolationCount: { type: Number, default: 0 },
    noiseAlertCount: { type: Number, default: 0 },
}, { _id: false });
const InterviewSessionSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    difficulty: { type: String, default: "medium" },
    overallScore: { type: Number, required: true, index: true },
    grade: String,
    recommendation: String,
    evaluation: { type: mongoose_1.Schema.Types.Mixed, required: true },
    sessionSnapshot: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    proctoring: { type: ProctoringSchema, default: () => ({}) },
    completedAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });
exports.InterviewSession = (0, mongoose_1.model)("InterviewSession", InterviewSessionSchema);
