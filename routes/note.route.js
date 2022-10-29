const express = require('express')
const router = express.Router()

const { noteById, createNote, updateNote, deleteNote, noteList } = require('../controllers/note.cont');

router.route('/notes')
	.get(noteList)	
	.post(createNote)
	.patch(updateNote)
	.delete(deleteNote)

// param
// router.param('noteId', noteById);

//  mount
module.exports = { noteRoute: router};