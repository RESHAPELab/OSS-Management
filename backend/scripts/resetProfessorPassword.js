/**
 * Reset a professor password in MongoDB (bcrypt hash, same as authController).
 * Usage: from OSS-Management/: node backend/scripts/resetProfessorPassword.js <email> <newPassword>
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Professor = require("../models/ProfessorModel");

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error("Usage: node backend/scripts/resetProfessorPassword.js <email> <newPassword>");
    process.exit(1);
  }
  if (!process.env.URI) {
    console.error("Missing URI in .env (MongoDB connection string).");
    process.exit(1);
  }

  const emailNorm = String(email).toLowerCase();

  await mongoose.connect(process.env.URI);
  const prof = await Professor.findOne({ email: emailNorm });
  if (!prof) {
    console.error(`No professor found for email: ${emailNorm}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  prof.password = await bcrypt.hash(newPassword, 10);
  await prof.save();
  console.log(`Password updated for ${emailNorm}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
