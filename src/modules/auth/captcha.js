import crypto from "crypto";
import svgCaptcha from "svg-captcha";
import { CAPTCHA_TTL_MS, sessionSecret } from "../../config/session.js";

export const hashCaptcha = (value) =>
  crypto
    .createHmac("sha256", sessionSecret)
    .update(value)
    .digest();

export const createCaptchaChallenge = () => {
  const { data, text } = svgCaptcha.create({
    size: 6,
    noise: 2,
    color: true,
    background: "#f2faf5",
    ignoreChars: "0o1iIl",
    width: 180,
    height: 56,
  });

  return {
    svg: data,
    hash: hashCaptcha(text.toLowerCase()).toString("hex"),
    expiresAt: new Date(Date.now() + CAPTCHA_TTL_MS),
  };
};
