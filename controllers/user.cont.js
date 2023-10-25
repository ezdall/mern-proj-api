const mongoose = require('mongoose');
const { hash, genSalt} = require('bcrypt')
const _ = require('lodash');

// model
const User = require('../models/user.model');
const Note = require('../models/note.model')

// helper
const { NotFoundError } = require('../helpers/not-found.error');
const { BadRequestError } = require('../helpers/bad-request.error');

/**
 * @desc GET all users
 * @route GET /api/users/
 * @access Private
 */

const getAllUser = async (req, res, next) => {
  try {

    const users = await User.find()
      .select('-password -salt')
      .lean()
      .exec()
    
    // console.log(users)
    if(!users?.length){
      return next(new NotFoundError('Not found users @getAllUser'))
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
    return res.json({ user: req.profile.toObject() });
  } catch (error) {
    return next(error);
  }
};


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

    // async-hash password
    const salt = await genSalt();
    const hashPass = await hash(password, salt) 

    const user = await User.create({ username, roles, password: hashPass, salt }) // ??

  // check if created 201
  if(!user){
    return next(new BadRequestError('invalid user @createUser'))
  }
  // console.log(user)

    return res.status(201).json({ message: `new user ${username} created!` })

  } catch(err){

    return next(err)
  }
}

/**
 * @desc update a user
 * @route PATCH /api/users/
 * @access Private
 */

const updateUser = async (req, res, next) => {
  try {

    // id from req.auth
    const { id, username, password, roles, active } = req.body

    if(!id){
      return next(new BadRequestError('id required'))
    }

    // const user = req.profile

    const user = await User.findById(id).exec()

    // console.log(user)
    if(!user){
      return next(new NotFoundError('Not found users @updateUser'))
    }

    if(password){
     const salt = await genSalt()
     
     user.password = await hash(password, salt)
    }
     
    user.username = username || user.username;
    user.roles = roles?.length ? roles : user.roles;
    user.active = active ?? user.active

    // merge + save, the "id" wont enter anyway
    const updatedUser = await user.save()

    // 
    updatedUser.password = undefined;
    updatedUser.salt = undefined

    // no await?
    return res.json({user: updatedUser});
  } catch (error) {
    return next(error);
  }
}

/**
 * @desc DELETE a user
 * @route DELETE /api/users/:userId
 * @access Private
 */

const deleteUser = async (req, res, next) => {

  try{

    // de-mount req.profile
    // const user = req.profile

    const { id } = req.body

    if(!id || !mongoose.isValidObjectId(id)){
      return next(new BadRequestError('valid id is required'))
    }

    // find note's user
    // ref:'user', type:ObjectId
    const note = await Note.findOne({ user: id }).lean().exec()

    // dont delete user with notes
    if(note){
      return next(new BadRequestError('this user has notes!'))
    }

    const user = await User.findById(id).exec()

    if(!user){
       return next(new NotFoundError('user not found'))
    }

    // delete itself
    const result = await user.deleteOne()
    const reply = `Username ${result.username} w/ ID ${result._id} is deleted`

    return res.json({ msg: reply })

  } catch(err){
    return next(err)
  }

}

// params
// :userId --> req.profile
const userById = async (req, res, next, userId) => {
  // 4th is params??
  try {

    // console.log('arg:', userId);
    const user = await User.findById(userId)
      .select('-password -salt')
      .exec()

    // console.log('isMongooseObj(user)?:', isMongooseObj(user));

    if (!user) {
      // return res.status(400) ?? vs throw error?
      return next(new NotFoundError('User not Found @userById'));
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

module.exports = { readUser, getAllUser, createUser, updateUser, deleteUser, userById };
