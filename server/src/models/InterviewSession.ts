import { Schema, model, Document, Types } from "mongoose";

export interface IProctoringSnapshot {
  tabSwitchCount: number;
  faceViolationCount: number;
  noiseAlertCount: number;
}

export interface IInterviewSession extends Document {
  userId: Types.ObjectId;
  difficulty: string;
  overallScore: number;
  grade?: string;
  recommendation?: string;
  evaluation: Record<string, unknown>;
  sessionSnapshot: Record<string, unknown>;
  proctoring: IProctoringSnapshot;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProctoringSchema = new Schema<IProctoringSnapshot>(
  {
    tabSwitchCount: { type: Number, default: 0 },
    faceViolationCount: { type: Number, default: 0 },
    noiseAlertCount: { type: Number, default: 0 },
  },
  { _id: false },
);

const InterviewSessionSchema = new Schema<IInterviewSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    difficulty: { type: String, default: "medium" },
    overallScore: { type: Number, required: true, index: true },
    grade: String,
    recommendation: String,
    evaluation: { type: Schema.Types.Mixed, required: true },
    sessionSnapshot: { type: Schema.Types.Mixed, default: {} },
    proctoring: { type: ProctoringSchema, default: () => ({}) },
    completedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

export const InterviewSession = model<IInterviewSession>(
  "InterviewSession",
  InterviewSessionSchema,
);
