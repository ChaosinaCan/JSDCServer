/// <reference path='node.d.ts'/>
/// <reference path='socket.io.d.ts'/>

//-----------------------------------------------------------------------------
// #region Server Setup
//-----------------------------------------------------------------------------

var clc = require('cli-color'),
	url = require('url'),
	express = require('express'),
	http = require('http');

// Formatting functions for console output
var fmt = {
	error: clc.red.bold,
	warn: clc.yellow,
	notice: clc.blue,
}

// Catch any uncaught exceptions so the server doesn't crash
process.on('uncaughtException', function (err) {
	if (typeof err.stack !== 'undefined')
		console.log(fmt.error(err.stack));
	else
		console.log(fmt.error(err));
});

import jsdc = require('./jsdc')
import clock = require('./clock')
import config = require('./config')

var api = new jsdc.API(config.mainServer.host, config.mainServer.port, config.mainServer.path);
api.apikey = config.apikey;

// Create the server components
var app = express(),
	server = http.createServer(app),
	game = new clock.GameClock(api),
	io: SocketManager = require('socket.io').listen(server);

var cueServers: jsdc.CueServer[] = config.cueServers.map((host) => new jsdc.CueServer(host));
var rules: jsdc.GameRules = new config.GameRules(game, api, cueServers);

// #endregion

//-----------------------------------------------------------------------------
// #region Socket.io Setup
//-----------------------------------------------------------------------------

io.configure(() => {
	//io.enable('browser client minification');
	//io.enable('browser client etag');
	//io.enable('browser client gzip');
	//io.set('log level', 1);
	io.set('log level', 1);
	io.set('transports', [
	  'websocket',
	  'flashsocket',
	  'htmlfile',
	  'xhr-polling',
	  'jsonp-polling',
	]);
});

// Handle messages from client pages

io.sockets.on('connection', (socket) => {
	socket.on('join', (channels) => {
		for (var i = 0; i < channels.length; i++)
			socket.join(channels[i]);
	});

	socket.on('get audio', () => {
		socket.emit('list audio', rules.audio.files)
	});

	socket.on('sync', () => {
		socket.emit('sync', game.status)
	});

	socket.on('game start', () => game.start());
	socket.on('game pause', () => game.pause());
	socket.on('game resume', () => game.resume());
	socket.on('game stop', () => game.stop());

	socket.on('set time', (time) => {
		game.timeRemaining = time
	});

	socket.on('load match', () => {
		game.loadCurrentMatch()
	});

	socket.on('emergency', () => game.startEmergency());

	socket.on('reset field', () => {
		game.emit('reset field')
	});

	socket.on('game status', () => {
		io.sockets.in('game').emit('game status', rules.getStatus())
	});

	socket.on('game event', (e) => game.emit('game event', e));
});

// Handle game events

game.on('start', () => {
	io.sockets.in('game').emit('game start', game.status)
});

game.on('pause', () => {
	io.sockets.in('game').emit('game pause', game.status)
});

game.on('resume', () => {
	io.sockets.in('game').emit('game resume', game.status)
});

game.on('stop', () => {
	io.sockets.in('game').emit('game stop', game.status)
	// set the match to finished
	api.post('match', {
		method: 'update',
		id: game.match,
		status: 'finished',
	}, (err, result?) => {
		if (err) {
			console.log('Failed to set the match state to finished', err);
		} else {
			console.log('Match finished.');
		}
	});
});

game.on('gameover', () => {
	io.sockets.in('game').emit('game over', game.status)
});

game.on('abort', () => {
	io.sockets.in('game').emit('game abort', game.status)
});

game.on('time changed', () => {
	io.sockets.in('game').emit('sync', game.status)
});

game.on('new score', (data) => {
	io.sockets.in('scoring').emit('new score', data)
});

game.on('score deleted', (data) => {
	api.post('matchresult', {
		method: 'update',
		match: game.match,
	}, (err, result?) => {
		if (err) {
			console.log('Failed to update match results after score deletion', err);
		} else {
			console.log('Updated results after score deletion');
		}
	});

	io.sockets.in('scoring').emit('score deleted', data);
});

game.on('results changed', (data) => {
	io.sockets.in('scoring').emit('results changed', data)
});

game.on('match changed', () => {
	console.log('match changed', game.match);
	io.sockets.in('game').emit('match changed', game.match);
});

game.on('emergency', () => {
	console.log(fmt.warn('EMERGENCY STOP'));
	io.sockets.in('game').emit('emergency');
	game.startEmergency();
})

game.on('reset field', () => {
	io.sockets.in('game').emit('field reset')
});

rules.audio.on('play', (data) => {
	io.sockets.in('audio').emit('play audio', data)
});

rules.audio.on('stop', (data) => {
	io.sockets.in('audio').emit('stop audio', data)
});

game.on('game event', (data) => {
	if (data.channel) {
		io.sockets.in(data.channel).emit('game event', data);
	} else {
		io.sockets.in('game').emit('game event', data);
	}
});

// #endregion

//-----------------------------------------------------------------------------
// #region HTTP Interface
//-----------------------------------------------------------------------------

// Helper methods for generic responses

var mimes = {
	text: { 'Content-Type': 'text/plain' },
	json: { 'Content-Type': 'application/json' },
}

http.ServerResponse.prototype.badRequest = function() {
	this.send('Bad Request', mimes.text, 400);
}

http.ServerResponse.prototype.ok = function() {
	this.send('OK', mimes.text, 200);
}

http.ServerResponse.prototype.json = function(data) {
	this.send(JSON.stringify(data), mimes.json, 200);
}

http.ServerResponse.prototype.serverError = function(data) {
	this.send(data || 'Internal Server Error', mimes.text, 500);
}

// Handle HTTP requests

app.use(express.bodyParser());

app.get('/ping', (req, res) => {
	res.ok();
});

app.get('/clock/status', (req, res) => {
	res.json(game.status);
});

app.get('/clock/config', (req, res) => {
	res.json(game.config);
});

app.get('/clock/time/:format?', (req, res) => {
	switch (req.params.format) {
		case 'elapsed':
			res.json(game.timeElapsed);
			break;

		default:
			res.json(game.timeRemaining);
	}
})

app.get('/game/status', (req, res) => {
	res.json(rules.getStatus());
});

app.get('/match/status', (req, res) => {
	res.json({
		matchId: game.match
	});
});

app.post('/match', (req, res) => {
	if (req.body.method === undefined) {
		res.badRequest();
	} else switch (req.body.method) {
		case 'load':
			game.loadCurrentMatch((err, data) => {
				if (err)
					res.serverError(JSON.stringify(err));
				else
					res.ok();
			});
			break;

		default:
			res.badRequest();
	}
});

app.post('/clock', (req, res) => {
	if (req.body.method === undefined) {
		res.badRequest();
	} else switch (req.body.method) {
			case 'start':
				res.json({ success: game.start(), status: game.status });
				break;
			case 'pause':
				res.json({ success: game.pause(), status: game.status });
				break;
			case 'resume':
				res.json({ success: game.resume(), status: game.status });
				break;
			case 'stop':
				res.json({ success: game.stop(), status: game.status });
				break;
			default:
				res.badRequest();
		}
})

app.post('/event', (req, res) => {
	if (req.body.event === undefined) {
		res.badRequest()
	} else {
		var event = req.body.event;
		console.log('event:', event);
		delete req.body.event;
		game.emit(event, req.body);
		res.ok();
	}
});

app.post('/gameevent', (req, res) => {
	if (req.body.event === undefined) {
		res.badRequest();
	} else {
		var event = req.body.event;
		delete req.body.event;
		game.emit('game event', { event:event, data: req.body });
		res.ok();
	}
});

// #endregion

//-----------------------------------------------------------------------------
// #region Command Line Interface
//-----------------------------------------------------------------------------

game.on('start', () => console.log('Game started:', game.timeRemaining));
game.on('pause', () => console.log('Game paused:', game.timeRemaining));
game.on('resume', () => console.log('Game resumed:', game.timeRemaining));
game.on('stop', () => console.log('Game stopped:', game.timeRemaining));
game.on('time changed', () => console.log('Time changed:', game.timeRemaining));

// Map commands to functions. Functions are passed command parameters as arguments.
// Function return value (if any) is printed to the console. Boolean return values
// are interpreted as success/failure and print OK/Failed.

var commands: { [key: string]: Function; } = {
	'help': () => {
		var keys = [];
		for (var key in commands) {
			if (commands.hasOwnProperty(key)) {
				keys.push(key);
			}
		}
		console.log('Command list:');
		keys.sort().forEach((key) => console.log(key));
	},
	'start': () => game.start(),
	'stop': () => game.stop(),
	'pause': () => game.pause(),
	'resume': () => game.resume(),
	'reset': () => game.reset(),
	'status': () => game.status,
	'time': () => game.timeRemaining,
	'emergency': () => {
		if (game.pause()) {
			console.log('Game paused for emergency.');
		}
		game.emit('emergency');
	},
	'quit': process.exit,
	'exit': process.exit,
	'cue': () => {
		if (arguments.length === 0) {
			return 'Usage: cue [server#] command';
		} else {
			var server = 0;
			var cue: any = null;
			if (arguments.length === 1) {
				cue = arguments[0];
			} else {
				server = parseInt(arguments[0]);
				cue = arguments[1];
			}

			// If the cue is a cue number, cast it to a number
			try {
				cue = parseInt(cue);
			} catch (e) { }

			cueServers[server].send(cue, (err, result?) => {
				if (err) {
					console.log('Failed to send cue.');
				} else {
					console.log('Cue sent.');
				}
			});
			return 'Sending...';
		}
	},
	'set': (name, value) => {
		switch (name) {
			case 'time':
				var time = parseFloat(value);
				if (isNaN(time)) {
					return false;
				}
				game.timeRemaining = time;
				return true;

			default:
				return false;
		}
	},
	'event': () => {
		if (arguments.length === 0) {
			return 'Usage: event event-name = json-data';
		} else {
			var params = partition(Array.prototype.join.call(arguments, ' '), '=');
			var event = params[0].trim();
			var data = params[2] || null;
			if (data) {
				try {
					data = JSON.parse(data.trim());
				} catch (e) {
					return 'Event data must be valid JSON data.';
				}
			}
			console.log('emitting', event, data);
			game.emit(event, data);
		}
	},
};

process.stdin.resume();
process.stdin.setEncoding('utf-8');
process.stdin.on('data', (line) => {
	var input = line.match(/(\w+)(?:\s+(.+))?/);
	if (!input) {
		return;
	}

	var cmd = input[1];
	var params = input[2];
	if (params) {
		params = params.split(' ');
	} else {
		params = [];
	}

	if (cmd in commands) {
		var result = commands[cmd].apply(null, params);
		if (typeof result === 'boolean') {
			if (result) {
				console.log('OK');
			} else {
				console.log('Failed');
			}
		} else if (typeof result !== 'undefined') {
			console.log(result);
		}
	} else {
		console.log('Unknown command. Type \'help\' for command list.');
	}
});

// Start the server
server.listen(config.nodeServer.port);
console.log('JSDC Server Started');

// Utility Functions

function partition(str: string, sep: string): string[] {
	var i = str.indexOf(sep);
	if (i < 0) {
		return [str, '', ''];
	} else {
		return [str.substr(0, i), sep, str.substr(i + sep.length)];
	}
}