const express = require("express");
const { ok, fail } = require("../utils/response");
const { AppError } = require("../utils/errors");

function createTasksRouter({ taskService }) {
  const router = express.Router();

  router.post("/", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"];
      const data = await taskService.createTask(userId, req.body || {});
      return ok(res, data, 201);
    } catch (error) {
      if (error instanceof AppError) {
        return fail(res, error.message, error.status, { code: error.code });
      }
      return fail(res, "failed to create task", 500);
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const data = await taskService.getTask(req.params.id);
      return ok(res, data);
    } catch (error) {
      if (error instanceof AppError) {
        return fail(res, error.message, error.status, { code: error.code });
      }
      return fail(res, "failed to get task", 500);
    }
  });

  return router;
}

module.exports = {
  createTasksRouter,
};
