class AuthCodeRepository {
  constructor(db) {
    this.db = db;
  }

  create(data, ctx = this.db) {
    return ctx.authCode.create({
      data,
    });
  }

  findLatestByTarget(target, scene, ctx = this.db) {
    return ctx.authCode.findFirst({
      where: {
        target,
        scene,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  markUsed(id, usedAt = new Date(), ctx = this.db) {
    return ctx.authCode.update({
      where: { id },
      data: { usedAt },
    });
  }
}

module.exports = {
  AuthCodeRepository,
};
