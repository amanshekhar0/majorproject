"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
const mongoose_1 = require("mongoose");
const SessionSchema = new mongoose_1.Schema({
    sessionId: { type: String, required: true, unique: true, index: true },
    candidateName: String,
    resumeProjects: [String],
    chatHistory: [
        {
            role: { type: String, enum: ['user', 'assistant', 'system'] },
            content: String,
            timestamp: { type: Date, default: Date.now },
        },
    ],
    codeSubmissions: [
        {
            language: String,
            code: String,
            question: String,
            timestamp: { type: Date, default: Date.now },
        },
    ],
    mcqAnswers: [
        {
            questionId: String,
            answer: String,
            correct: Boolean,
        },
    ],
    tabSwitchCount: { type: Number, default: 0 },
    timeUsed: { type: Number, default: 0 },
    terminated: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
    score: Number,
    evaluation: mongoose_1.Schema.Types.Mixed,
}, { timestamps: true });
exports.Session = (0, mongoose_1.model)('Session', SessionSchema);
