const express = require('express')
const router = express.Router()


const {
  userById,
  getAllUser,
  createUser,
} = require('../controllers/user.cont');


// GET
router.get('/users', getAllUser)

// POST
router.post('/users', createUser)

// param
router.param('userId', userById);

//  mount
module.exports = { userRoute: router};