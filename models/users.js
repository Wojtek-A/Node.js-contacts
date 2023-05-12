const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const user = new Schema({
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
  },
  subscription: {
    type: String,
    enum: ['starter', 'pro', 'business'],
    default: 'starter',
  },
  token: {
    type: String,
    default: null,
  },
  avatarURL: {
    type: String,
  },
  verify: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
    required: [true, 'Verify token is required'],
  },
});

const User = mongoose.model('user', user);

const getUserByEmail = email => User.findOne({ email });

const addUser = body => User.create(body);

const getUserbyId = id => User.findById(id);

const updateUser = (id, key) => User.findByIdAndUpdate(id, key, { new: true });

const getUserbyVerificationToken = verificationToken =>
  User.findOne({ verificationToken });

module.exports = {
  User,
  getUserByEmail,
  addUser,
  getUserbyId,
  updateUser,
  getUserbyVerificationToken,
};
