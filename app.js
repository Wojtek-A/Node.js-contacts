const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const morgan = require('morgan');

const contactsRouter = require('./routes/api/contacts');
const usersRouter = require('./routes/api/users');
const avatarRouter = require('./routes/api/avatar');
const usersAvatarRouter = require('./routes/api/avatars');
const { AVATAR_DIR } = require('./middlewares/upload');

const app = express();

const formatsLogger = app.get('env') === 'development' ? 'dev' : 'short';

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/contacts', contactsRouter);
app.use('/api/users', usersRouter);
app.use('/avatars', avatarRouter, express.static(AVATAR_DIR));
app.use('/users', usersAvatarRouter);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});

module.exports = app;
