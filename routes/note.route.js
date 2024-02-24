const router = require('express').Router();

const {
  noteById,
  createNote,
  updateNote,
  deleteNote,
  noteList
} = require('../controllers/note.cont');

const { requireLogin } = require('../controllers/auth.cont');

// middleware
router.use(requireLogin);

// route
router
  .route('/notes')
  .get(noteList)
  .post(createNote)
  .patch(updateNote)
  .delete(deleteNote);

// param
// router.param('noteId', noteById);

//  mount
module.exports = { noteRoute: router };
