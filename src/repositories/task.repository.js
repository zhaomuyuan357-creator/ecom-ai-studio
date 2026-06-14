class TaskRepository {
  constructor(db) {
    this.db = db;
  }

  create(data, ctx = this.db) {
    return ctx.generationTask.create({
      data,
      include: {
        sourceAssets: true,
      },
    });
  }

  findById(id, ctx = this.db) {
    return ctx.generationTask.findUnique({
      where: { id },
      include: {
        sourceAssets: {
          include: {
            asset: true,
          },
        },
        results: {
          include: {
            asset: true,
          },
        },
      },
    });
  }

  listByUser(userId, filters = {}, ctx = this.db) {
    return ctx.generationTask.findMany({
      where: {
        userId,
        ...(filters.taskType ? { taskType: filters.taskType } : {}),
        ...(filters.taskStatus ? { taskStatus: filters.taskStatus } : {}),
      },
      include: {
        results: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: filters.take || 24,
      skip: filters.skip || 0,
    });
  }

  updateStatus(id, taskStatus, ctx = this.db) {
    return ctx.generationTask.update({
      where: { id },
      data: { taskStatus },
    });
  }
}

module.exports = {
  TaskRepository,
};
