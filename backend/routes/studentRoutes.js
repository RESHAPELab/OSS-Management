const express = require("express");
const router = express.Router(); 
const {getStudents} = require('../controllers/studentController')


//api/student/${groupID}
router.route('/:groupID').get(getStudents)

module.exports = router;