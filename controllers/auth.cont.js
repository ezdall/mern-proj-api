const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const { compare } = require('bcrypt');
const _ = require('lodash');

// model
const User = require('../models/user.model');
const Note = require('../models/note.model');

// helper
const { NotFoundError } = require('../helpers/not-found.error');
const { BadRequestError } = require('../helpers/bad-request.error');
const { UnauthorizedError } = require('../helpers/unauthorized.error');
const { ForbiddenError } = require('../helpers/forbidden.error');

/**
 * @desc Login
 * @route POST - /auth
 * @access Public
 */

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return next(new BadRequestError('all field required @login'));
    }

    // exec bcoz we need to validatePassword
    const user = await User.findOne({ username }).exec();

    if (!user) {
      return next(new NotFoundError('User not found'));
    }

    // check if other person is using this 'user login'
    if (!user?.active) {
      return next(new UnauthorizedError('Unauthorized!'));
    }

    const passMatch = await compare(password, user.password);

    if (typeof passMatch !== 'boolean' || !passMatch) {
      return next(new UnauthorizedError('wrong password @login'));
    }

    console.log('password & username match ----- ');

    // generate a access token
    const accessToken = jwt.sign(
      {
        username: user.username,
        roles: user.roles
      },
      process.env.ACCESS_SECRET,
      { expiresIn: '11s' } // 1h
    );

    // generate refresh token
    const refreshToken = jwt.sign(
      { username: user.username },
      process.env.REFRESH_SECRET,
      { expiresIn: '20s' } // 1d
    );

    // persist/cache the refreshToken as 'jwt' in res.cookie with expiry date
    // why await?
    res.cookie('jwt', refreshToken, {
      httpOnly: true, // accessible only by webserver
      maxAge: 7 * 24 * 60 * 60 * 1000 //
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

  if (!cookies?.jwt) return next(new UnauthorizedError('no cookies @refresh'));

  const refreshToken = cookies.jwt;

  console.log({ refreshToken });

  return jwt.verify(
    refreshToken,
    process.env.REFRESH_SECRET,
    async (err, decoded) => {
      if (err) {
        console.log('err-refresh:', err.message);
        // return next(err); // token expired 500
        return next(new ForbiddenError('Forbidden! @refresh'));
      }

      const foundUser = await User.findOne({
        username: decoded?.username
      })
        .lean()
        .exec(); // why not lean vs toObject()

      if (!foundUser)
        return next(new UnauthorizedError('not found @refresh 2'));

      const accessToken = jwt.sign(
        {
          username: foundUser.username,
          roles: foundUser.roles
        },
        process.env.ACCESS_SECRET,
        { expiresIn: '25s' }
      );
      // strip
      foundUser.password = undefined;
      foundUser.salt = undefined;

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

const logout = async (req, res, next) => {
  try {
    // de-mount
    const { cookies } = req;

    if (!cookies?.jwt) return res.sendStatus(204); // no content

    // clearing
    // sameSite: cause untrackable error
    res.clearCookie('jwt', { httpOnly: true });

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
