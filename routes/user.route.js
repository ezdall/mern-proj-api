const express = require('express')
const router = express.Router()


const {
  userById,
  getAllUser,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/user.cont');


// GET
router.get('/users', getAllUser)

// POST
router.post('/users', createUser)

// PATCH
router.patch('/users', updateUser)

// DELETE
router.delete('/users', deleteUser)

// param
router.param('userId', userById);

//  mount
module.exports = { userRoute: router};