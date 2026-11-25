import mongoose from "mongoose";

const captchaSessionSchema = new mongoose.Schema(
  {
    sid: {
      type: String,
      required: true,
      unique: true,
    },
    session: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    collection: "captcha_http_sessions",
    versionKey: false,
  }
);

captchaSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const CaptchaSession = mongoose.model("CaptchaSession", captchaSessionSchema);

export default CaptchaSession;
