const mongoose = require('mongoose');
const _ = require('lodash');

// model
const User = require('../models/user.model');

// helper
const { NotFoundError } = require('../helpers/not-found.error');
const { BadRequestError } = require('../helpers/bad-request.error');


/**
 * @desc create a user
 * @route POST /api/users/
 * @access Private
 */

const createUser = async (req, res, next) => {

  try{
    const { username, password, roles } = req.body;

    // confirm data
    if(!username || !password || !Array.isArray(roles) || !roles.length ){
      return next(new BadRequestError('all info required @createUser'))     
    }

    const newUser = req.body // ??

    const user = await User.create({ ...newUser }) // ??

  // check if created 201
  if(!user){
    return next(new BadRequestError('invalid user @createUser'))
  }

    return res.status(201).json({ user })

  } catch(err){

    return next(err)
  }
}

/**
 * @desc GET all users
 * @route GET /api/users/
 * @access Private
 */

const getAllUser = async (req, res, next) => {
  try {

    const users = await User.find().select({ salt: 0, password: 0 }).lean()
    // console.log(users)
    if(!users){
      return next(NotFoundError('Not found users'))
    }

    // no await?
    return res.json(users);
  } catch (error) {
    return next(error);
  }
}

// view User
const readUser = async (req, res, next) => {
  try {
    // remove sensitive info, double checking
    req.profile.password = undefined;
    req.profile.salt = undefined;

    // no await?
    return res.json({ user: req.profile });
  } catch (error) {
    return next(error);
  }
};


// params
// :userId --> req.profile
const userById = async (req, res, next, userId) => {
  // 4th is params??
  try {
    // console.log('userId is Valid?:', mongoose.isValidObjectId(userId));

    // console.log('arg:', userId);
    const user = await User.findById(userId).exec();

    // console.log('isMongooseObj(user)?:', isMongooseObj(user));

    if (!user) {
      // return res.status(400) ?? vs throw error?
      return next(NotFoundError('User not Found'));
    }

    // destructing, will convert its mongooseObj- into js-obj
    // don't destruct
    // const { _id, name, email, role } = user;

    // mount to req.profile
    // req.profile = { _id, name, email, role };
    req.profile = user;

    //
    return next();
  } catch (error) {
    // possible error
    // not found - id not found
    return next(error);
  }
};

module.exports = { readUser, getAllUser, createUser, userById };
