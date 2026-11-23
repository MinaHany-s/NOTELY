
import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      default: "",
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    category: {
      type: String,
      default: "General",
      trim: true,
    },

    isPinned: {
      type: Boolean,
      default: false,
    },

    isArchived: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
    purgeAt: {
      type: Date,
      default: null,
    }
  },
  {
    timestamps: true,
  }
);
noteSchema.index(
  { purgeAt: 1 },
  { expireAfterSeconds: 0 }
);
const Note = mongoose.model("Note", noteSchema);

export default Note;
