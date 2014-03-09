// PHP server info goes here
export var mainServer = {
	host: 'localhost',
	port: 80,
	path: '/',
}

// Node server info goes here
export var nodeServer = {
	port: 8080,
}

// Master API key goes here
export var apikey = 'JSDC4Life';

// List of cue server IP addresses go here
export var cueServers = [
	'192.168.1.42',
	'192.168.1.43',
]

// Import the game's rule set here
import rules = require('./rules-2014/rules');

import clock = require('clock');
import jdsc = require('jsdc');
export var GameRules = rules.GameRules;