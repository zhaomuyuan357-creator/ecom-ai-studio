const express = require("express");
const { getPrisma } = require("./lib/prisma");
const { UserRepository } = require("./repositories/user.repository");
const { AuthCodeRepository } = require("./repositories/auth-code.repository");
const { AssetRepository } = require("./repositories/asset.repository");
const { TaskRepository } = require("./repositories/task.repository");
const { AuthService } = require("./services/auth.service");
const { UserService } = require("./services/user.service");
const { AssetService } = require("./services/asset.service");
const { TaskService } = require("./services/task.service");
const { createAuthRouter } = require("./routes/auth.routes");
const { createMeRouter } = require("./routes/me.routes");
const { createAssetsRouter } = require("./routes/assets.routes");
const { createTasksRouter } = require("./routes/tasks.routes");

function createBackboneApp() {
  const app = express();
  const prisma = getPrisma();

  const userRepository = new UserRepository(prisma);
  const authCodeRepository = new AuthCodeRepository(prisma);
  const assetRepository = new AssetRepository(prisma);
  const taskRepository = new TaskRepository(prisma);

  const authService = new AuthService({
    prisma,
    userRepository,
    authCodeRepository,
  });
  const userService = new UserService({
    userRepository,
    taskRepository,
    assetRepository,
  });
  const assetService = new AssetService({
    assetRepository,
  });
  const taskService = new TaskService({
    prisma,
    taskRepository,
  });

  app.use(express.json({ limit: "10mb" }));

  app.get("/healthz", (req, res) => {
    res.json({ ok: true, scope: "product-backbone" });
  });

  app.use("/api/auth", createAuthRouter({ authService }));
  app.use("/api/me", createMeRouter({ userService }));
  app.use("/api/assets", createAssetsRouter({ assetService }));
  app.use("/api/tasks", createTasksRouter({ taskService }));

  return app;
}

module.exports = {
  createBackboneApp,
};
