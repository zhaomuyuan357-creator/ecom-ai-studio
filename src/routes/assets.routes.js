const express = require("express");
const { ok, fail } = require("../utils/response");
const { AppError } = require("../utils/errors");

function createAssetsRouter({ assetService }) {
  const router = express.Router();

  router.post("/", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"];
      const data = await assetService.createAsset(userId, req.body || {});
      return ok(res, data, 201);
    } catch (error) {
      if (error instanceof AppError) {
        return fail(res, error.message, error.status, { code: error.code });
      }
      return fail(res, "failed to create asset", 500);
    }
  });

  return router;
}

module.exports = {
  createAssetsRouter,
};
