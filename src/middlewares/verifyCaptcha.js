import crypto from "crypto";
import { sessionStore } from "../config/session.js";
import { hashCaptcha } from "../modules/auth/captcha.js";

export default async function verifyCaptcha(req, res, next) {
  try {
    const challenge = await sessionStore.consumeCaptcha(req.sessionID);
    if (req.session) delete req.session.captcha;

    if (!challenge) {
      return res.status(400).json({
        success: false,
        code: "CAPTCHA_EXPIRED",
        message: "CAPTCHA expired. Refresh and try again.",
      });
    }

    const submittedText =
      typeof req.body?.captcha === "string"
        ? req.body.captcha.trim().toLowerCase()
        : "";
    const submittedHash = hashCaptcha(submittedText);
    const expectedHash = Buffer.from(challenge.hash, "hex");
    const isValid =
      submittedText.length > 0 &&
      expectedHash.length === submittedHash.length &&
      crypto.timingSafeEqual(expectedHash, submittedHash);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        code: "CAPTCHA_INVALID",
        message: "CAPTCHA is incorrect. Refresh and try again.",
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
}
