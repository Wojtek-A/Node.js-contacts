const express = require('express');
const router = express.Router();
const fs = require('fs/promises');

const { AVATAR_DIR } = require('../../middlewares/upload');

router.get('/', async (req, res, next) => {
  try {
    await fs.readdir(AVATAR_DIR);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

module.exports = router;
