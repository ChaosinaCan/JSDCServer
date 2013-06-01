///<reference path='node.d.ts'/>

import http = module('http')
import clock = module('clock')
import events = module('./events')

export function serialize(obj: any) {
	if (typeof obj === 'string')
		return obj;

	var query = [];
	for (var key in obj) {
		if (!obj.hasOwnProperty(key)) 
			continue;

		if (obj[key] === null)
			query.push(key);
		else
			query.push(key + '=' + encodeURIComponent(obj[key]));
	}
	return query.join('&');
}

export function bindMemberFunctions(obj: any) {
	var _this = obj, _constructor = (<any>obj).constructor;

	if (!_constructor.__fn__) {
		_constructor.__fn__ = {};
		for (var m in _this) {
			var fn = _this[m];
			if (typeof fn === 'function' && m != 'constructor') {
				_constructor.__fn__[m] = fn;	
			}
		}
	}

	for (var m in _constructor.__fn__) {
		(function (m, fn) {
			_this[m] = function () {
				return fn.apply(_this, Array.prototype.slice.call(arguments));						
			};
		})(m, _constructor.__fn__[m]);
	}
}


export class ResponseHandler extends events.BaseEventEmitter {
	private callback: Function;

	constructor(callback: (err, data) => any) {
		super();
		bindMemberFunctions(this);
		this.callback = callback;
	}

	setResponse(res: http.ClientResponse) {
		res.setEncoding('utf-8');
		var data = '';

		res.on('data', (chunk) => data += chunk	);

		res.on('end', () => {
			if (res.statusCode >= 200 && res.statusCode < 300) {
				try {
					data = JSON.parse(data);
				} catch (e) { }
				
				this.emitResult(data);
			} else {
				this.emitError(new Error(res.statusCode + ': ' + data));
			}
		})

		res.on('close', () => {
			this.emitError(new Error('Connection closed'));
		})

		res.on('error', this.emitError);
	}

	private emitResult(data: any) {
		if (this.callback)
			this.callback(null, data);
	}

	private emitError(err: any) {
		if (this.callback)
			this.callback(err);
	}



	get(options: any): ResponseHandler {
		var req = http.get(options, this.setResponse);
		req.on('error', this.emitError);
		return this;
	}

	post(options: any, data: any): ResponseHandler {
		data = JSON.stringify(data);

		options.method = 'post';
		options.headers = options.headers || {};
		options.headers['Content-Length'] = data.length;

		var req = http.request(options, this.setResponse);
		req.on('error', this.emitError);

		req.write(data);
		req.end();
		return this;
	}

	static get(host: string, path: string, callback?: (err, data) => any) {
		callback = callback || (err, data) => undefined;
		new ResponseHandler(callback).get({
			host: host,
			port: 80,
			path: path,
		});
	}

	static post(host: string, path: string, data: any, callback?: (err, data) => any) {
		callback = callback || (err, data) => undefined;
		new ResponseHandler(callback).post({
			host: host,
			port: 80,
			path: path,
		}, data);
	}
}


export class API {
	public apikey: string;

	constructor(public host: string, public port: number = 80, public path: string = '/') {
		bindMemberFunctions(this);
	}

	get(method: string, params: any, callback?: (err, data) => any): ResponseHandler {
		var request = {
			host: this.host,
			port: this.port,
			path: this.path + 'api/' + method + '/?' + serialize(params),
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
				'X-API-KEY': this.apikey,
			}
		}

		callback = callback || (err, data) => null;

		return new ResponseHandler(callback).get(request);
	}

	post(method: string, params: any, callback?: (err, data) => any): ResponseHandler {
		
		var request = {
			host: this.host,
			port: this.port,
			path: this.path + 'api/' + method + '/',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
				'X-API-KEY': this.apikey,
			}
		}

		callback = callback || (err, data) => null;

		return new ResponseHandler(callback).post(request, params);
	}
}


export class CueServer {
	constructor(public host: string, public port?: number = 80, public path?: string = '/') {
		bindMemberFunctions(this);
	}

	send(cue: number, callback: Function): ResponseHandler;
	send(cmd: any, callback: Function): ResponseHandler;
	send(options: { cmd?: string; user?: number; def?: number; }, callback: (err, data) => any): ResponseHandler {
		var command, 
			user = null, 
			def = null;

		if (typeof arguments[0] === 'number') {
			command = 'Cue ' + arguments[0] + ' Go';
		} else if (typeof arguments[0] === 'string') {
			command = arguments[0];
		} else {
			command = options.cmd;
			user = options.user || null;
			def = options.def || null;
		}

		var request = {
			host: this.host,
			port: this.port,
			path: this.path + 'exe.cgi?cmd=' + encodeURIComponent(command),
		}

		if (user)
			request.path += '&usr=' + encodeURIComponent(user);
		if (def)
			request.path += '&def=' + encodeURIComponent(def);

		return new ResponseHandler(callback).get(request);
	}
}


export class GameAudio extends events.BaseEventEmitter {
	public files = {};

	constructor() {
		super();
		bindMemberFunctions(this);
	}

	add(files: any);
	add(name: string, path?: string) {
		if (typeof arguments[0] === 'object') {
			var files = arguments[0];
			for (var key in files) {
				if (files.hasOwnProperty(key))
					this.files[key] = files[key]
			}
		} else {
			this.files[name] = path;
		}
	}

	play(name: string) {
		this.emit('play', name);
	}

	stop(name: string) {
		this.emit('stop', name);
	}
}


export class GameRules extends events.BaseEventEmitter {
	public cues: any;
	public actions: any;
	
	public api: API;
	public cue: CueServer[];
	public game: clock.GameClock;
	public audio: GameAudio;

	get rulesLoaded() {
		return !!this._colors;
	}

	private _colors: { [key: string]: string; };

	constructor(game: clock.GameClock, api: API, cue: CueServer[]) {
		super();
		bindMemberFunctions(this);

		this.cues = {};
		this.actions = {};

		this.api = api;
		this.cue = cue;
		this.game = game;
		this.audio = new GameAudio();

		// Automatically attach event handlers
		for (var key in this) {
			// look for onEventName() functions
			if (this.hasOwnProperty(key) && key.match(/^on[A-Z]/)) {
				// de-camelcase event names
				var event = key;
				for (var i = 0; i < event.length; i++) {
					var e:string = event[i];
					if (e < 'A' || e > 'Z')
						continue;

					event = event.substr(0, i) + ' ' + e.toLowerCase() + event.substr(i + 1);
				}

				// attach event handler
				this.game.on(event.substr('on '.length), this[key]);
			}
		}

		// retrieve rules
		api.get('color', 'all', function (err, data: any[]) => {
			this._colors = {};
			data.forEach((color) => {
				this._colors[color.colorId] = color.name;
			});
		});
	}

	/**
	 * Gets the current status of the game. This should be overriden by subclasses
	 * to return data specific to the game rules. This data is sent to any page that
	 * sends a 'game status' message to the clock server.
	 */
	getStatus(): any {
		return {};
	}

	getColor(colorId: number) {
		return this._colors[colorId.toString()] || null;
	}

	/**
	 * Sends a 'game event' event with the given event name and data
	 */
	sendEvent(event: string, channel: string, data?: any): void;
	sendEvent(event: string, data?: any): void;
	sendEvent(event: string, data?: any): void {
		if (typeof arguments[2] !== 'undefined') {
			this.game.emit('game event', {
				event: arguments[0],
				channel: arguments[1],
				data: arguments[2],
			});
		} else {
			this.game.emit('game event', { event: event, data: data });
		}
	}

	/**
	 * Creates a new scoring event for one team
	 * @param {string} action The name of the action in this.actions
	 * @param {number} team The id of the team which performed the action
	 * @param {Function} callback
	 */
	/**
	 * Creates a new scoring event by one team upon another
	 * @param {string} action The name of the action in this.actions
	 * @param {number} fromTeam The id of the team which performed the action
	 * @param {number} onTeam The id of the team upon which the action was performed
	 * @param {Function} callback
	 */
	sendScore(action: string, team: number, callback?: (err, data) => any): void;
	sendScore(action: string, fromTeam: number, onTeam?: number, callback?: (err, data) => any): void;
	sendScore(action: string, fromTeam: number, onTeam?: number, callback?: (err, data) => any) {
		if (typeof arguments[2] !== 'number') {
			callback = arguments[2];
			fromTeam = arguments[1];
			onTeam = 0;
		}

		var namedAction = this.findMember(action, this.actions);
		if (namedAction != null)
			action = namedAction;

		this.api.post('score', {
			method: 'create',
			action: action,
			match: this.game.match,
			from: fromTeam,
			on: onTeam,
		}, callback);
	}

	/**
	 * Sends a cue to the first cue server.
	 * @param {string} name The name of the cue in this.cues
	 * @param {Function} callback
	 */
	/**
	 * Sends a cue to a cue server
	 * @param {number} server The index of the cue server to command
	 * @param {string} name The name of the cue in this.cues
	 * @param {Function} callback
	 */
	sendCue(name: string, callback?: Function);
	sendCue(server?: number, name?: string, callback?: Function);
	sendCue(server?: number, name?: string, callback?: Function) {
		if (typeof arguments[0] === 'string') {
			name = arguments[0];
			server = 0;
		}

		if (!callback)
			callback = (err) => {
				if (err)
					console.log('Failed to send cue: ' + name, err)
			}

		// Split the name at dots and traverse the cues object to find the cue command
		var cmd = this.findMember(name, this.cues);
		if (cmd != null)
			this.cue[server].send(cmd, callback);
		else 
			callback(new Error('Cue "' + name + '" does not exist.'));
	}

	
	// remap onGameEvent({ 'some event', 'data' }) to onGameSomeEvent(data)
	onGameEvent(e: { event: string; data: any; }) {
		var event = e.event.split(' ').map((word: string) => {
			return word.charAt(0).toUpperCase() + word.substr(1);
		}).join('');

		var handler = 'onGame' + event;
		if (handler in this) {
			this[handler].apply(this, [e.data]);
		}
	}

	private findMember(path: string, obj: any) {
		var parts = path.split('.');
		for (var i = 0; i < parts.length; i++)
			if (parts[i] in obj)
				obj = obj[parts[i]];
			else
				return null;
		return obj;
	}

	//onStart() { }
	//onPause() { }
	//onResume() { }
	//onStop() { }
	//onGameover() { }
	//onAbort() { }

	//onReset() { }
	//onEmergency() { }

	//onGame<EventName>(data: any) { }
}