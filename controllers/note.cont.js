const mongoose = require('mongoose');
const _ = require('lodash');

// model
const User = require('../models/user.model');
const Note = require('../models/note.model')

// helper
const { NotFoundError } = require('../helpers/not-found.error');
const { BadRequestError } = require('../helpers/bad-request.error');

/**
 * @desc create a note
 * @route POST /api/notes/
 * @access Private
 */

const createNote = async (req, res, next) => {
  try{
    // for-now, user is from req.body
    // vs from req.auth
    const { title, text, user: userId }  = req.body

    // const username = req.profile

    // confirm if user is ObjectId

    // do login first, 
    // de-mount req.user / req.profile
    // get ObjectId of user
    const user = await User.findById(userId).lean().exec()

    if(!user){
      return next(new NotFoundError('User not found'))
    }

    // confirm data
    if(!title || !text){
     	return next(new BadRequestError('all info required'))
    }

    // spread, ObjectId as user
    const note = await Note.create({ title, text, user: userId })

  // check if created, 201
  if(!note){
    // if error occur at database
    return next(new BadRequestError('invalid note'))
  }

  // created
  return res.status(201).json({ msg: note })

  } catch(err){
    return next(err)
  }
}

/**
 * @desc GET all users
 * @route GET /api/users/
 * @access Private
 */

const noteList = async (req, res, next) => {
  try {
    // populate 'user', select: 'username'
    const notes = await Note.find().populate({
      path: 'user', select:'username'
    }).lean().exec()

    // !notes?.length - new syntax nodejs-14+
    if(!notes?.length){
      return next(new NotFoundError('no notes'))
    }

    return res.json(notes);
  } catch (error) {
    return next(error);
  }
}

// view Note
const readNote = async (req, res, next) => {
  try {
    // remove sensitive info, double checking
    req.profile.hashed_password = undefined;
    req.profile.salt = undefined;

    // no await?
    return res.json({ user: req.user });
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc update a user
 * @route PATCH /api/users/:userId
 * @access Private
 */
const updateNote = async (req, res, next) => {
  try {
    
    // current note, de-mount deq.note from noteById
    
    const { id } = req.body

    // let note = req.note

    // console.log(req.body)
    // console.log(req.note)

    if(!id || !mongoose.isValidObjectId(id)){
      return next(new BadRequestError('valid id is required'))
    }

    let note = await Note.findById(id).exec()
    
    if(!note){
      return next(new NotFoundError('note not found!'))
    }

    note = _.extend(note, req.body);

    const { title, text, completed } = note

    // confirm field
    if(!title || !text || typeof completed !== 'boolean'){
      return next(new BadRequestError('all valid field is required'))
    }

    // save update
    const updateNote = await note.save()

    return res.json({ msg: `${updateNote.title} updated!`})

  } catch (error) {
    return next(error);
  }
};

/**
 * @desc DELETE a user
 * @route DELETE /api/users/:userId
 * @access Private
 */

 const deleteNote = async (req, res, next) => {

  try{
    // de-mount
    // const note = req.note

    const { id } = req.body

    if(!id){
    	return next(new BadRequestError('id is required'))
    }

    const note = await Note.findById(id).exec()
    // delete note itself
    const result = await note.deleteOne()

    console.log(result)
    const reply = `Note ${result.title} w/ ID ${result._id} is deleted`

    return res.json({ msg: reply })
  } catch(err){

    return next(err)
  }
 }

// if you use url for id
// :noteId --> req.note
const noteById = async (req, res, next, noteId) => {
  // 4th is params
  try {
    // console.log('noteId is Valid?:', mongoose.isValidObjectId(noteId));

    // console.log(req.body)
    // console.log(req.params)

    // check if id's type is mongo-id
    if(!mongoose.isValidObjectId(noteId)){
      return next(new BadRequestError('invalid id'))
    }

    const note = await Note.findById(noteId).exec()

    // console.log('isMongooseObj(user)?:', isMongooseObj(note));

    if (!note) {
      // return res.status(400) ?? vs throw error?
      return next(new NotFoundError('Note doesnt exist'));
    }
 
    // mount to req.note
    req.note = note;

    return next();
  } catch (error) {
    // possible error
    // not found - id not found
    return next(error);
  }
};


module.exports = { createNote, updateNote, deleteNote, noteList, noteById }