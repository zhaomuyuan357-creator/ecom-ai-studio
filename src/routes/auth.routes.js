const express = require("express");
const { ok, fail } = require("../utils/response");
const { AppError } = require("../utils/errors");

function createAuthRouter({ authService }) {
  const router = express.Router();

  router.post("/send-code", async (req, res) => {
    try {
      const data = await authService.sendCode(req.body || {});
      return ok(res, data, 201);
    } catch (error) {
      if (error instanceof AppError) {
        return fail(res, error.message, error.status, { code: error.code });
      }
      return fail(res, "failed to send code", 500);
    }
  });

  router.post("/login", async (req, res) => {
    try {
      const data = await authService.loginWithCode(req.body || {});
      return ok(res, data);
    } catch (error) {
      if (error instanceof AppError) {
        return fail(res, error.message, error.status, { code: error.code });
      }
      return fail(res, "failed to login", 500);
    }
  });

  return router;
}

module.exports = {
  createAuthRouter,
};
