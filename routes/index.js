const express = require('express');
const router = require('express').Router();
const path = require('path');

// for /, /index, /index.html
router.get('^/$|/index(.html)?', (req, res) => {
  return res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
});

module.exports = { rootRoute: router };
