const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const { Schema, model } = mongoose;

const noteSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },

    title: {
      type: String,
      required: true
    },

    text: {
      type: String,
      required: true
    },

    completed: {
      type: Boolean,
      default: false
    }
  },
  // other options
  { timestamps: true, versionKey: false }
);

noteSchema.pre('save', function saveNoteSchema(next) {
  console.log({
    isModified: this.isModified(),
    isNew: this.isNew
  });

  next();
});

// add ticket for notes
noteSchema.plugin(AutoIncrement, {
  inc_field: 'ticket',
  id: 'ticketNums',
  start_seq: 500
});

module.exports = model('Note', noteSchema);
