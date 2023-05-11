const express = require('express');
const router = express.Router();
require('dotenv').config({ path: '../../.env' });
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs/promises');
const path = require('path');
const Jimp = require('jimp');
const sgMail = require('@sendgrid/mail');
const { v4: uuidv4 } = require('uuid');
const { auth } = require('../../middlewares/authentication');
const { upload } = require('../../middlewares/upload');
const gravatar = require('gravatar');

const {
  getUserByEmail,
  addUser,
  updateUser,
  getUserbyVerificationToken,
} = require('../../models/users');
const { AVATAR_DIR } = require('../../middlewares/upload');

const hashingPassword = async password => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return hash;
};
const validatePassword = async (password, hash) =>
  bcrypt.compare(password, hash);

const sendMail = async user => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const emailConfig = {
    from: `${process.env.EMAIL_ADDRESS}`,
    to: `${user.email}`,
    subject: 'Email verification',
    html: `<a href=http://localhost:3000/api/users/verify/${user.verificationToken}>Verification Link</a>`,
  };

  await sgMail.send(emailConfig);
};

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

  const getAvatarURL = gravatar.url(email, { s: '200', r: 'pg' });

  const getVerificationToken = uuidv4();
  try {
    const user = await addUser({
      email,
      password: hashedPassword,
      avatarURL: getAvatarURL,
      verificationToken: getVerificationToken,
    });

    sendMail(user);

    res.status(201).json({
      user: {
        email: user.email,
        subscription: user.subscription,
        avatarURL: user.avatarURL,
      },
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

  if (user.verify === false && user.verificationToken !== null)
    return res.status(401).json({ message: 'Please verify email' });

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
      user: { email: user.email, subscription: user.subscription },
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
  return res.status(200).json({ email: email, subscription: subscription });
});

router.patch(
  '/avatars',
  auth,
  upload.single('avatar'),
  async (req, res, next) => {
    if (!req.file) return res.status(400);

    const { id } = req.user;
    const date = Date.now();
    const newName = [id, date, req.file.originalname].join('_');
    const avatarNewPath = path.join(AVATAR_DIR, newName);
    const newAvatarURL = `/avatars/${newName}`;

    try {
      await Jimp.read(req.file.path).then(file => {
        file.resize(250, 250).write(req.file.path);
      });

      await fs.rename(req.file.path, avatarNewPath);

      await updateUser(id, { avatarURL: newAvatarURL });

      res.status(200).json({ avatarURL: newAvatarURL });
    } catch (error) {
      fs.unlink(req.file.path);
      console.log(error);
      next(error);
    }
  }
);

router.get('/verify/:verificationToken', async (req, res, next) => {
  const verificationToken = req.params.verificationToken;
  if (!verificationToken) return res.status(400);
  try {
    const user = await getUserbyVerificationToken(verificationToken);
    if (user === null)
      return res.status(404).json({ message: 'User not found' });
    await updateUser(user.id, { verify: true, verificationToken: null });
    return res.status(200).json({ message: 'Verification successful' });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.post('/verify', async (req, res, next) => {
  const { email } = req.body;

  const schema = Joi.object().keys({
    email: Joi.string()
      .email()
      .required(),
  });
  const { error } = schema.validate(req.body);
  if (error)
    return res.status(400).json({ message: `${error.details[0].message}` });

  const user = await getUserByEmail(email);

  if (!user) return res.status(400).json({ message: 'Email is wrong' });

  if (user.verify === true && user.verificationToken === null)
    return res
      .status(400)
      .json({ message: 'Verification has already been passed' });

  try {
    sendMail(user);
    return res.status(200).json({ message: 'Verification email sent' });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

module.exports = router;
