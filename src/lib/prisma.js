let PrismaClient;
let prisma;

function getPrismaClientCtor() {
  if (!PrismaClient) {
    ({ PrismaClient } = require("@prisma/client"));
  }
  return PrismaClient;
}

function createPrismaClient() {
  const Client = getPrismaClientCtor();
  return new Client();
}

function getPrisma() {
  if (!prisma) {
    prisma = createPrismaClient();
  }
  return prisma;
}

module.exports = {
  createPrismaClient,
  getPrisma,
};
