const express = require("express");
const { ok, fail } = require("../utils/response");
const { AppError } = require("../utils/errors");

function createMeRouter({ userService }) {
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"];
      const data = await userService.getProfile(userId);
      return ok(res, data);
    } catch (error) {
      if (error instanceof AppError) {
        return fail(res, error.message, error.status, { code: error.code });
      }
      return fail(res, "failed to get profile", 500);
    }
  });

  router.get("/projects", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"];
      const data = await userService.getMyOverview(userId);
      return ok(res, data);
    } catch (error) {
      if (error instanceof AppError) {
        return fail(res, error.message, error.status, { code: error.code });
      }
      return fail(res, "failed to get my overview", 500);
    }
  });

  return router;
}

module.exports = {
  createMeRouter,
};
