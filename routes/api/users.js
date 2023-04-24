const express = require('express');
const router = express.Router();
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();
const { auth } = require('../../middleware');

const {
  getUserByEmail,
  addUser,
  getUserbyId,
  updateUser,
} = require('../../models/users');

const hashingPassword = async password => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return hash;
};
const validatePassword = async (password, hash) =>
  bcrypt.compare(password, hash);

router.post('/signup', async (req, res, next) => {
  const { password, email } = req.body;

  const schema = Joi.object().keys({
    password: Joi.string().required(),
    email: Joi.string()
      .email()
      .required(),
  });
  const { error } = schema.validate(req.body);
  if (error)
    return res.status(400).json({ message: `${error.details[0].message}` });

  const user = await getUserByEmail(email);
  if (user) return res.status(409).json({ message: 'Email in use' });

  const hashedPassword = await hashingPassword(password);

  try {
    const user = await addUser({ email, password: hashedPassword });
    res.status(201).json({
      user: { email: `${user.email}`, subscription: `${user.subscription}` },
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  const { password, email } = req.body;

  const schema = Joi.object().keys({
    password: Joi.string().required(),
    email: Joi.string()
      .email()
      .required(),
  });
  const { error } = schema.validate(req.body);
  if (error)
    return res.status(400).json({ message: `${error.details[0].message}` });

  const user = await getUserByEmail(email);

  if (!user)
    return res.status(401).json({ message: 'Email or password is wrong' });

  const passwordValidation = await validatePassword(password, user.password);
  if (!passwordValidation)
    return res.status(401).json({ message: 'Email or password is wrong' });

  const payload = {
    id: user.id,
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
  try {
    await updateUser(user.id, { token: token });

    return res.status(201).json({
      token: `${token}`,
      user: { email: `${user.email}`, subscription: `${user.subscription}` },
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.get('/logout', auth, async (req, res, next) => {
  const { _id } = req.user;
  try {
    await updateUser(_id, { token: null });
    return res.status(204).json({ message: 'No Content' });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.get('/current', auth, (req, res, next) => {
  const { email, subscription } = req.user;
  return res
    .status(200)
    .json({ email: `${email}`, subscription: `${subscription}` });
});

module.exports = router;
