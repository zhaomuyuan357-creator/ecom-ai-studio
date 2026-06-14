class AssetRepository {
  constructor(db) {
    this.db = db;
  }

  create(data, ctx = this.db) {
    return ctx.mediaAsset.create({
      data,
    });
  }

  findById(id, ctx = this.db) {
    return ctx.mediaAsset.findUnique({
      where: { id },
    });
  }

  listByUser(userId, filters = {}, ctx = this.db) {
    return ctx.mediaAsset.findMany({
      where: {
        userId,
        ...(filters.assetType ? { assetType: filters.assetType } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: filters.take || 24,
      skip: filters.skip || 0,
    });
  }
}

module.exports = {
  AssetRepository,
};
