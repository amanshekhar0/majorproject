import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  resumeUrl?: string;
  totalInterviews: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
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
  },
  { timestamps: true },
);

export const User = model<IUser>("User", UserSchema);
