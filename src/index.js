'use strict';

const parser = require('./parser');
const validator = require('./validator');

module.exports = { ...parser, ...validator };
