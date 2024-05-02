const rateLimit = require('express-rate-limit');
const { logEvents } = require('./logger');

const loginLimiter = rateLimit({
	windowsMs: 60 * 1000, // 1 min
	max: 5, // limit each ip to 5 login request
	message: {
		message: 'Too many login attempt, try again in 60 sec'
	},
	standardHeaders: true, // return rate limit 'RateLimit-*'
	legacyHeaders: false, // disable 'X-RateLimit-*'
	handler(req, res, next, opts) {
		// logEvents(`Too many request: ${opts.message.message}\t${req.method}\t${req.url}\t${req.headers.origin || ''}`, 'errLog.log')

		return res.status(opts.statusCode).json(opts.message);
	}
});

module.exports = { loginLimiter };
