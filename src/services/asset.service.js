const { AppError } = require("../utils/errors");

class AssetService {
  constructor({ assetRepository }) {
    this.assetRepository = assetRepository;
  }

  async createAsset(userId, payload) {
    if (!userId) {
      throw new AppError("user id is required", 400, "missing_user_id");
    }

    if (!payload?.assetType || !payload?.sourceName || !payload?.storageUrl) {
      throw new AppError("assetType, sourceName and storageUrl are required", 400, "missing_asset_payload");
    }

    return this.assetRepository.create({
      userId,
      assetType: payload.assetType,
      sourceName: payload.sourceName,
      storageUrl: payload.storageUrl,
      mimeType: payload.mimeType || null,
      fileSize: payload.fileSize || null,
      width: payload.width || null,
      height: payload.height || null,
      metadata: payload.metadata || null,
    });
  }
}

module.exports = {
  AssetService,
};
