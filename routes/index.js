const router = require('express').Router();
const path = require('path');

// using flexible regex
router.get('^/$|/index(.html)?', (req, res) => {
  return res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
});

module.exports = { rootRoute: router };
