const express = require("express");
const router = express.Router(); 
const {getStudents, getStudent} = require('../controllers/studentController')


//api/student
router.route('/:groupID').get(getStudents)
router.route('/:groupID/student/:studentID').get(getStudent)

module.exports = router;