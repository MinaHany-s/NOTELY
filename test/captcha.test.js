import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";

if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = randomBytes(32).toString("hex");
}

const { sessionStore } = await import("../src/config/session.js");
const { createCaptchaChallenge, hashCaptcha } = await import("../src/modules/auth/captcha.js");
const { default: verifyCaptcha } = await import("../src/middlewares/verifyCaptcha.js");

const createResponse = () => ({
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("generates an SVG challenge with an expiring HMAC", () => {
  const challenge = createCaptchaChallenge();

  assert.match(challenge.svg, /^<svg/);
  assert.match(challenge.hash, /^[a-f0-9]{64}$/);
  assert.ok(challenge.expiresAt.getTime() > Date.now());
});

test("accepts a correct challenge once and rejects its replay", async () => {
  const originalConsumeCaptcha = sessionStore.consumeCaptcha;
  let storedChallenge = {
    hash: hashCaptcha("notely-test").toString("hex"),
  };
  sessionStore.consumeCaptcha = async () => {
    const challenge = storedChallenge;
    storedChallenge = null;
    return challenge;
  };

  try {
    const request = {
      sessionID: "test-session",
      session: { captcha: {} },
      body: { captcha: "Notely-Test" },
    };
    const response = createResponse();
    let passed = false;

    await verifyCaptcha(request, response, () => {
      passed = true;
    });

    assert.equal(passed, true);
    assert.equal(request.session.captcha, undefined);

    const replayResponse = createResponse();
    await verifyCaptcha(
      { sessionID: "test-session", session: {}, body: { captcha: "notely-test" } },
      replayResponse,
      () => assert.fail("A consumed challenge must not validate again")
    );
    assert.equal(replayResponse.statusCode, 400);
    assert.equal(replayResponse.body.code, "CAPTCHA_EXPIRED");
  } finally {
    sessionStore.consumeCaptcha = originalConsumeCaptcha;
  }
});

test("consumes and rejects an incorrect challenge", async () => {
  const originalConsumeCaptcha = sessionStore.consumeCaptcha;
  let storedChallenge = {
    hash: hashCaptcha("notely-test").toString("hex"),
  };
  sessionStore.consumeCaptcha = async () => {
    const challenge = storedChallenge;
    storedChallenge = null;
    return challenge;
  };

  try {
    const response = createResponse();
    await verifyCaptcha(
      { sessionID: "test-session", session: {}, body: { captcha: "incorrect" } },
      response,
      () => assert.fail("An incorrect challenge must not validate")
    );

    assert.equal(response.statusCode, 400);
    assert.equal(response.body.code, "CAPTCHA_INVALID");
    assert.equal(storedChallenge, null);
  } finally {
    sessionStore.consumeCaptcha = originalConsumeCaptcha;
  }
});
