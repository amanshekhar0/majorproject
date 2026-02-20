import { Schema, model, Document } from 'mongoose';

export interface ISession extends Document {
    sessionId: string;
    candidateName?: string;
    resumeProjects: string[];
    chatHistory: Array<{ role: string; content: string; timestamp: Date }>;
    codeSubmissions: Array<{ language: string; code: string; question: string; timestamp: Date }>;
    mcqAnswers: Array<{ questionId: string; answer: string; correct: boolean }>;
    tabSwitchCount: number;
    timeUsed: number;
    terminated: boolean;
    completed: boolean;
    score?: number;
    evaluation?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
    {
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
        evaluation: Schema.Types.Mixed,
    },
    { timestamps: true }
);

export const Session = model<ISession>('Session', SessionSchema);
