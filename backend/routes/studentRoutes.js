const express = require("express");
const router = express.Router(); 
const {getStudents} = require('../controllers/studentController')

router.route('/:groupID').get(getStudents)

module.exports = router;