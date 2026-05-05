"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    name: { type: String, default: "", trim: true },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    resumeUrl: { type: String, trim: true },
    totalInterviews: { type: Number, default: 0 },
}, { timestamps: true });
exports.User = (0, mongoose_1.model)("User", UserSchema);
