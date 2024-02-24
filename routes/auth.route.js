const router = require('express').Router();

const { loginLimiter } = require('../middlewares/login-limiter');
const { login, logout, refresh } = require('../controllers/auth.cont');

router.post('/auth', loginLimiter, login);

router.get('/auth/refresh', refresh);

router.get('/auth/logout', logout);

module.exports = { authRoute: router };
