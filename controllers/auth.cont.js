const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { compare } = require('bcrypt');
const _ = require('lodash');

// model
const User = require('../models/user.model');
const Note = require('../models/note.model');

// helper
const { NotFoundError } = require('../helpers/not-found.error');
const { BadRequestError } = require('../helpers/bad-request.error');
const { UnauthorizedError } = require('../helpers/unauthorized.error')

/**
 * @desc Login
 * @route POST - /auth
 * @access Public
 */

const login = async (req, res, next) =>{
	try{
		const { username, password } = req.body

		if(!username || !password ){
			return next(new BadRequestError('all field required @login'))
		}

		// exec bcoz we need to validatePassword
		const user = await User.findOne({ username }).exec()

		if(!user){
			return next(new NotFoundError('User not found'))
		}

		// check if other person is using this 'user login'
		if(!user?.active){
			return next(new UnauthorizedError('Unauthorized!'))
		}

		const passMatch = await compare(password, user.password);

		if(typeof passMatch !== 'boolean' || !passMatch){
			return next(new UnauthorizedError('wrong password @login'))
		}
  
    console.log('password & username match ----- ')

    // generate a access token 
    const accessToken = jwt.sign({ 
    		UserInfo: {
    			username: user.username,
    			roles: user.roles
    		} 
    	}, 
  	  process.env.ACCESS_SECRET,
 	   { expiresIn: '1hr' }
    );

    // generate refresh token
    const refreshToken = jwt.sign(
    	{ username: user.username },
    	process.env.REFRESH_SECRET,
    	{ expiresIn: '1d' }
    )

    // persist/cache the refreshToken as 'jwt' in res.cookie with expiry date
    // why await?
    await res.cookie('jwt', refreshToken, {
     httpOnly: true, // accessible only by webserver
     // secure: true, // https
     sameSite: 'None', // cross-site cookie
     maxAge: 7 * 24 * 60 * 60 * 1000 // 
   	});

		// destructure
		const { _id, roles } = user;

		return res.json({ accessToken, user: { _id, username, roles } })

	} catch(err){

		return next(err)
	}
}

/**
 * @desc Refresh
 * @route GET - /auth/refresh
 * @access Public - bcoz access token has expired
 */

const refresh = (req, res, next) => {

const { cookies } = req

	console.log(cookies)
return res.json('refresh')
}

/**
 * @desc Logout
 * @route POST - /auth
 * @access Public
 */

const logout = async (req, res, next) =>{
	try{
		// de-mount
		const cookies = req.cookies

		if(!cookies?.jwt) return res.sendStatus(204) // no content

		// clearing
		res.clearCookie('jwt', { httpOnly: true, sameSite: 'None' })

		return res.json({ msg: "Cookie clear" })
	} catch(err){

		return next(err)
	}
}

module.exports = { login, logout, refresh }