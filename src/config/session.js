import crypto from "crypto";
import session from "express-session";
import CaptchaSession from "../../db/models/captchaSession.model.js";

const SESSION_COOKIE_MAX_AGE_MS = 10 * 60 * 1000;
export const CAPTCHA_TTL_MS = 5 * 60 * 1000;

const configuredSessionSecret = process.env.SESSION_SECRET;
const jwtSecret = process.env.JWT_SECRET;
export const sessionSecret =
  configuredSessionSecret ||
  (jwtSecret
    ? crypto
        .createHmac("sha256", jwtSecret)
        .update("notely:captcha-session:v1")
        .digest("hex")
    : undefined);

if (!sessionSecret || Buffer.byteLength(sessionSecret) < 32) {
  throw new Error(
    "Configure SESSION_SECRET (at least 32 characters) or JWT_SECRET to enable CAPTCHA sessions"
  );
}

const isSecureDeployment =
  process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
const configuredSameSite = process.env.COOKIE_SAME_SITE?.toLowerCase();
const cookieSameSite = ["lax", "strict", "none"].includes(configuredSameSite)
  ? configuredSameSite
  : "lax";
const cookieDomain = process.env.COOKIE_DOMAIN?.trim() || undefined;
const cookieSecure =
  isSecureDeployment ||
  process.env.COOKIE_SECURE === "true" ||
  cookieSameSite === "none";

class MongoCaptchaSessionStore extends session.Store {
  get(sid, callback) {
    CaptchaSession.findOne({ sid, expiresAt: { $gt: new Date() } })
      .lean()
      .exec()
      .then((record) => callback(null, record?.session || null))
      .catch(callback);
  }

  set(sid, sessionData, callback) {
    const expiresAt = sessionData.cookie?.expires
      ? new Date(sessionData.cookie.expires)
      : new Date(Date.now() + SESSION_COOKIE_MAX_AGE_MS);

    CaptchaSession.updateOne(
      { sid },
      { $set: { session: sessionData, expiresAt } },
      { upsert: true }
    )
      .exec()
      .then(() => callback?.(null))
      .catch((error) => callback?.(error));
  }

  destroy(sid, callback) {
    CaptchaSession.deleteOne({ sid })
      .exec()
      .then(() => callback?.(null))
      .catch((error) => callback?.(error));
  }

  touch(sid, sessionData, callback) {
    const expiresAt = sessionData.cookie?.expires
      ? new Date(sessionData.cookie.expires)
      : new Date(Date.now() + SESSION_COOKIE_MAX_AGE_MS);

    CaptchaSession.updateOne({ sid }, { $set: { expiresAt } })
      .exec()
      .then(() => callback?.(null))
      .catch((error) => callback?.(error));
  }

  async consumeCaptcha(sid) {
    const now = new Date();
    const record = await CaptchaSession.findOneAndUpdate(
      {
        sid,
        expiresAt: { $gt: now },
        "session.captcha.expiresAt": { $gt: now },
      },
      { $unset: { "session.captcha": "" } },
      { new: false }
    )
      .lean()
      .exec();

    return record?.session?.captcha || null;
  }
}

export const sessionStore = new MongoCaptchaSessionStore();

export const sessionMiddleware = session({
  name: "notely.captcha.sid",
  secret: sessionSecret,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  rolling: false,
  cookie: {
    httpOnly: true,
    sameSite: cookieSameSite,
    secure: cookieSecure,
    maxAge: SESSION_COOKIE_MAX_AGE_MS,
    path: "/api/v1/auth",
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  },
});
