const mongoose = require("mongoose");
const Student = require("../../models/StudentModel");

async function createStudent(overrides = {}) {
    const {
        firstName = "Pedro",
        lastName = "Oliveira",
        githubUsername = "pedrorodriguesarantes",
        studentEmail = "pedrorodriguesarantes@gmail.com",
        groups = []
    } = overrides;

    const student = new Student({
        firstName,
        lastName,
        githubUsername,
        studentEmail,
        groups
    });

    await student.save();
    return student;
}

module.exports = { createStudent };