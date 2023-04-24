const passport = require('passport');
const { ExtractJwt, Strategy } = require('passport-jwt');
const { User } = require('./models/users');
require('dotenv').config();

const strategyOptions = {
  secretOrKey: process.env.JWT_SECRET,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

passport.use(
  new Strategy(strategyOptions, (payload, done) => {
    User.findOne({ _id: payload.id })
      .then(([user]) => {
        if (!user) {
          return done(new Error('User not found'));
        }
        return done(null, user);
      })
      .catch(error => done(error));
  })
);

const auth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (error, user) => {
    if (!user || error)
      return res.status(401).json({ message: 'Not authorized' });
    req.user = user;
    next();
  })(req, res, next);
};

module.exports = { auth };
