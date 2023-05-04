const express = require('express');
const router = express.Router();
const fs = require('fs/promises');
const path = require('path');
const Jimp = require('jimp');
const { upload } = require('../../middlewares/upload');
const { auth } = require('../../middlewares/authentication');
const { updateUser } = require('../../models/users');

const { AVATAR_DIR } = require('../../middlewares/upload');

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

      res.status(200).json({ avatarURL: `${newAvatarURL}` });
    } catch (error) {
      fs.unlink(req.file.path);
      console.log(error);
      next(error);
    }
  }
);

module.exports = router;
