const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const { compare } = require('bcrypt');
const _ = require('lodash');

// model
const User = require('../models/user.model');
// const Note = require('../models/note.model');

// helper
const { BadRequest400 } = require('../helpers/bad-request.error');
const { Unauthorized401 } = require('../helpers/unauthorized.error');
const { Forbidden403 } = require('../helpers/forbidden.error');

/**
 * @desc Login
 * @route POST - /auth
 * @access Public
 */

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return next(new BadRequest400('all field required @login'));
    }

    // exec bcoz we need to validatePassword
    const user = await User.findOne({ username }).exec();

    if (!user) {
      return next(new Unauthorized401('User not found'));
    }

    // check if other person is using this 'user login'
    if (!user?.active) {
      return next(new Unauthorized401('Unauthorized!'));
    }

    const passMatch = await compare(password, user.password);

    if (typeof passMatch !== 'boolean' || !passMatch) {
      return next(new Unauthorized401('wrong password @login'));
    }

    console.log('password & username match ----- ');

    // generate a access token
    const accessToken = jwt.sign(
      {
        username: user.username,
        roles: user.roles
      },
      process.env.ACCESS_SECRET,
      { expiresIn: '25min' } // 1h
    );

    // generate refresh token
    const refreshToken = jwt.sign(
      { username: user.username },
      process.env.REFRESH_SECRET,
      { expiresIn: '7d' } // 1d
    );

    // persist/cache the refreshToken as 'jwt' in res.cookie with expiry date
    // clearCookie must have at-least: secure & sameSite
    res.cookie('jwt', refreshToken, {
      httpOnly: true, // accessible only by webserver
      secure: true, // paired w/ sameSite
      sameSite: 'None', // for Chrome, & need secure=true
      maxAge: 7 * 24 * 60 * 60 * 1000, //
      partitioned: true
    });

    // destructure
    const { _id, roles } = user;

    return res.json({ accessToken, user: { _id, username, roles } });
  } catch (err) {
    return next(err);
  }
};

/**
 * @desc Refresh
 * @route GET - /auth/refresh
 * @access Public - bcoz access token has expired
 */

const refresh = (req, res, next) => {
  const { cookies } = req;
  // console.log({ cookies });

  if (!cookies?.jwt) return next(new Unauthorized401('no cookies @refresh'));

  const refreshToken = cookies.jwt;

  // console.log({ refreshToken });

  return jwt.verify(
    refreshToken,
    process.env.REFRESH_SECRET,
    async (err, decoded) => {
      if (err) {
        return next(err); // token expired 403? or 401?
        // return next(new Forbidden403(`Forbidden! ${err.message}`))
      }

      const foundUser = await User.findOne({
        username: decoded?.username
      })
        .lean()
        .exec(); // why not lean vs toObject()

      if (!foundUser) return next(new Unauthorized401('not found @refresh 2'));

      const accessToken = jwt.sign(
        {
          username: foundUser.username,
          roles: foundUser.roles
        },
        process.env.ACCESS_SECRET,
        { expiresIn: '25min' }
      );
      // strip
      foundUser.password = undefined;
      foundUser.salt = undefined;

      console.log('refresh-ed');

      return res.json({ accessToken, user: foundUser });
    }
  );
  // ??
  // return res.json(refreshToken)
};

/**
 * @desc Logout
 * @route POST - /auth
 * @access Public
 */

const logout = (req, res, next) => {
  try {
    // if (!req.cookies?.jwt) return res.sendStatus(204); // unnecessary

    // sameSite: cause untrackable error
    res.clearCookie('jwt', {
      httpOnly: true, // accessible only by webserver
      secure: true, // paired w/ sameSite
      sameSite: 'None', // for Chrome, & need secure=true
      partitioned: true // new addition, jan 2024
    });

    return res.sendStatus(204);
  } catch (err) {
    return next(err);
  }
};

// checks and decoder of "Bearer xxx" req.headers.authorization
// then "Mount" data to req.auth
const requireLogin = expressJwt({
  secret: process.env.ACCESS_SECRET,
  algorithms: ['HS256'],
  requestProperty: 'auth'
});

module.exports = { login, logout, refresh, requireLogin };
