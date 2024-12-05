const mongoose = require("mongoose");
const Professor = require("../../models/ProfessorModel");

async function createProfessor(overrides = {}) {
  const {
    email = `pro32@nau.edu`,
    name = "Pedro Oliveira",
    password = "securepassword123",
    verificationCode = "123456",
    ownedGroups = [],
    quests = [],
    verified = false,
  } = overrides;

  const professor = new Professor({
    email,
    name,
    password,
    verificationCode,
    ownedGroups,
    quests,
    verified,
  });

  return professor.save();
}

module.exports = { createProfessor };
