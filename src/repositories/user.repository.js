class UserRepository {
  constructor(db) {
    this.db = db;
  }

  findById(id, ctx = this.db) {
    return ctx.user.findUnique({
      where: { id },
    });
  }

  findByEmail(email, ctx = this.db) {
    return ctx.user.findUnique({
      where: { email },
    });
  }

  findByPhone(phone, ctx = this.db) {
    return ctx.user.findUnique({
      where: { phone },
    });
  }

  create(data, ctx = this.db) {
    return ctx.user.create({
      data,
    });
  }
}

module.exports = {
  UserRepository,
};
