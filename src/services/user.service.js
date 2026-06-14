const { AppError } = require("../utils/errors");

class UserService {
  constructor({ userRepository, taskRepository, assetRepository }) {
    this.userRepository = userRepository;
    this.taskRepository = taskRepository;
    this.assetRepository = assetRepository;
  }

  async getProfile(userId) {
    if (!userId) {
      throw new AppError("user id is required", 400, "missing_user_id");
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError("user not found", 404, "user_not_found");
    }

    return {
      user,
      wallet: {
        balance: 0,
        freeBalance: 0,
        paidBalance: 0,
      },
    };
  }

  async getMyOverview(userId) {
    const [tasks, assets] = await Promise.all([
      this.taskRepository.listByUser(userId, { take: 12 }),
      this.assetRepository.listByUser(userId, { take: 12 }),
    ]);

    return {
      tasks,
      recentGenerations: tasks.slice(0, 6),
      assets,
      projects: [],
    };
  }
}

module.exports = {
  UserService,
};
