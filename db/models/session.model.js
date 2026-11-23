
import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    refreshTokenHash: {
      type: String,
      required: true,
      unique: true,
    },

    userAgent: {
      type: String,
    },

    ip: {
      type: String,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
    previousRefreshTokenHash: {
      type: String,
      default: null,
    },
    previousRefreshTokenExpiresAt: {
      type: Date,
      default: null,
    },

    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Automatically delete expired sessions
sessionSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

const Session = mongoose.model("Session", sessionSchema);

export default Session;
