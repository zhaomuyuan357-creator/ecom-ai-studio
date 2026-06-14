const crypto = require("crypto");
const { AppError } = require("../utils/errors");

class AuthService {
  constructor({ prisma, userRepository, authCodeRepository }) {
    this.prisma = prisma;
    this.userRepository = userRepository;
    this.authCodeRepository = authCodeRepository;
  }

  async sendCode({ target, scene = "login" }) {
    if (!target) {
      throw new AppError("target is required", 400, "missing_target");
    }

    const rawCode = "123456";
    const codeHash = crypto.createHash("sha256").update(rawCode).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const record = await this.authCodeRepository.create({
      target,
      scene,
      codeHash,
      expiresAt,
    });

    return {
      id: record.id,
      target: record.target,
      scene: record.scene,
      expiresAt: record.expiresAt,
      debugCode: rawCode,
    };
  }

  async loginWithCode({ target, code, loginType = "email_code" }) {
    if (!target || !code) {
      throw new AppError("target and code are required", 400, "missing_login_payload");
    }

    const latestCode = await this.authCodeRepository.findLatestByTarget(target, "login");
    if (!latestCode) {
      throw new AppError("verification code not found", 404, "code_not_found");
    }

    const codeHash = crypto.createHash("sha256").update(code).digest("hex");
    if (latestCode.codeHash !== codeHash) {
      throw new AppError("verification code is invalid", 401, "invalid_code");
    }

    if (latestCode.usedAt) {
      throw new AppError("verification code has already been used", 409, "code_used");
    }

    if (latestCode.expiresAt.getTime() < Date.now()) {
      throw new AppError("verification code expired", 410, "code_expired");
    }

    const isEmail = String(target).includes("@");
    const existingUser = isEmail
      ? await this.userRepository.findByEmail(target)
      : await this.userRepository.findByPhone(target);

    const user = existingUser || await this.userRepository.create({
      email: isEmail ? target : null,
      phone: isEmail ? null : target,
      loginType,
    });

    await this.authCodeRepository.markUsed(latestCode.id);

    return {
      user,
      token: `dev-token-${user.id}`,
    };
  }
}

module.exports = {
  AuthService,
};
