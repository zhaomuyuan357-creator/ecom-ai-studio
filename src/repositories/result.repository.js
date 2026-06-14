class ResultRepository {
  constructor(db) {
    this.db = db;
  }

  create(data, ctx = this.db) {
    return ctx.generationResult.create({
      data,
    });
  }

  listByTask(taskId, ctx = this.db) {
    return ctx.generationResult.findMany({
      where: { taskId },
      include: {
        asset: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }
}

module.exports = {
  ResultRepository,
};
