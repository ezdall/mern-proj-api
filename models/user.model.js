const mongoose = require('mongoose');

const crypto = require('crypto');
const uuidv1 = require('uuid/v1');

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      trim: true,
      minlength: 1,
      maxlength: 32,
      unique: true,
      required: true
    },

    password: {
      type: String,
      required: true
    },
    salt: String, // for password?

    roles: {
      type: [String],
      default: ['Employee']
    },

    active: {
      type: Boolean,
      default: true
    }
  },
  // other options
  { timestamps: true, versionKey: false }
);

module.exports = model('User', userSchema);
