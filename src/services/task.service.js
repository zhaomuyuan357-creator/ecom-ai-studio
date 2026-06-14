const { AppError } = require("../utils/errors");

class TaskService {
  constructor({ prisma, taskRepository }) {
    this.prisma = prisma;
    this.taskRepository = taskRepository;
  }

  async createTask(userId, payload) {
    if (!userId) {
      throw new AppError("user id is required", 400, "missing_user_id");
    }

    if (!payload?.taskType) {
      throw new AppError("taskType is required", 400, "missing_task_type");
    }

    return this.prisma.$transaction(async (tx) => {
      return this.taskRepository.create({
        userId,
        taskType: payload.taskType,
        taskStatus: payload.taskStatus || "pending",
        inputPayload: payload.inputPayload || null,
        resultPayload: payload.resultPayload || null,
        sourceAssets: payload.sourceAssetIds?.length
          ? {
              create: payload.sourceAssetIds.map((assetId) => ({
                assetId,
                role: payload.assetRole || null,
              })),
            }
          : undefined,
      }, tx);
    });
  }

  async getTask(taskId) {
    if (!taskId) {
      throw new AppError("task id is required", 400, "missing_task_id");
    }

    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new AppError("task not found", 404, "task_not_found");
    }

    return task;
  }
}

module.exports = {
  TaskService,
};
