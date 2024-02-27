const router = require('express').Router();

const {
  userById,
  userList,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/user.cont');

const { requireLogin } = require('../controllers/auth.cont');

// middleware
router.use(requireLogin);

// route
router
  .route('/users')
  .get(userList)
  .post(createUser)
  .patch(updateUser)
  .delete(deleteUser);

// if use url/params to mount data
// router.param('userId', userById);

//  mount
module.exports = { userRoute: router };
