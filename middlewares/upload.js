const multer = require('multer');
const path = require('path');

const AVATAR_DIR = path.join(process.cwd(), 'public', 'avatars');
const TEMP_DIR = path.join(process.cwd(), 'tmp');

const storage = multer.diskStorage({
  destination: TEMP_DIR,
  filename: (req, file, callback) => {
    callback(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
});

module.exports = { upload, AVATAR_DIR, TEMP_DIR };
