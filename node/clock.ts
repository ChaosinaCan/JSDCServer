///<reference path='node.d.ts'/>

import jsdc = module('jsdc');
import events = module('./events');

export class TeamInfo {
	public teamId: number;
	public colorId: number;
	public name: string;
	public university: string;
	public imageName: string;

	constructor (matchdata: any) {
		this.teamId = parseInt(matchdata.teamId);
		this.colorId = parseInt(matchdata.colorId || '0');
		this.name = matchdata.name;
		this.university = matchdata.university;
		this.imageName = matchdata.imageName;
	}
}

export class GameClock extends events.BaseEventEmitter {
	private _running: bool;
	private _paused: bool;
	private _aborted: bool;
	private _finished: bool;
	private _emergency: bool;

	private _gameTime: number;
	private _lastUpdateTime: number;
	private _intervalID: number;
	private _updateIntervalID: number;
	private _nextEvent: number;

	private _matchId: number;
	private _teams: TeamInfo[];

	private jsdc: jsdc.API;
	
	public config: { 
		duration: number; 
		resolution: number; 
		updateInterval: number;
		events: TimedEvent[]; 
	};

	constructor(api: jsdc.API) {
		super();

		this.jsdc = api;
		this.config = {
			duration: 300,
			resolution: 100,
			updateInterval: 20 * 1000,
			events: [],
		}

		this._running = false;
		this._paused = false;
		this._aborted = false;
		this._finished = false;
		this._emergency = false;

		this.timeElapsed = 0;
		this.match = -1;

		this.loadCurrentMatch();
	}

	get match() { return this._matchId; }
	set match(id) {
		if (id === this._matchId)
			return;

		this._matchId = id;

		this.emit('match changed', this.match);
		if (this.running || this.paused)
			this.stop();

		this.reset();
	}

	get teams() { return this._teams; }

	get running() { return this._running; }
	get paused() { return this._paused; }
	get aborted() { return this._aborted; }
	get finished() { return this._finished; }
	get emergency() { return this._emergency; }
	get timeElapsed() { return this._gameTime; }
	set timeElapsed(time) {
		this._gameTime = time;
		this.emit('time changed');
	}
	
	get timeRemaining() { return this.config.duration - this._gameTime; }
	set timeRemaining(time) {
		this._gameTime = this.config.duration - time;
		this.emit('time changed');
	}

	get status() {
		return {
			timestamp: Date.now() / 1000,
			match: this.match,
			running: this.running,
			paused: this.paused,
			aborted: this.aborted,
			finished: this.finished,
			emergency: this.emergency,
			timeElapsed: this.timeElapsed,
			timeRemaining: this.timeRemaining,
		}
	}

	loadCurrentMatch(callback?: Function): void {
		callback = callback || this._logErrors;
		this.jsdc.get('match', 'current', (err, data) => {

			if (!err && data.length > 0) {
				// if there is a current match, load data from it
				data = data[0];
				this._teams = data.teams.map((teamdata) => new TeamInfo(teamdata));
				this.match = data.matchId;
			} else {
				// if there is no current match, use default values
				this._teams = [];
				this.match = 0;
			}
			
			if (callback)
				callback(err, data);
		});
	}

	private _startInterval(): void {
		clearInterval(this._intervalID);
		this._intervalID = setInterval(this._tick.bind(this), this.config.resolution);
		this._lastUpdateTime = Date.now() / 1000;
	}

	private _stopInterval(): void {
		clearInterval(this._intervalID);
		this._intervalID = -1;
	}

	private _updateGameTime(): void {
		var now = Date.now() / 1000;
		this._gameTime += (now - this._lastUpdateTime);
		this._lastUpdateTime = now;
	}

	private _tick(): void {
		this._updateGameTime();

		// Call any timed events that should take place
		var ev = this.config.events;
		while (this._nextEvent < ev.length 
			&& this.timeElapsed > ev[this._nextEvent].time) {
			ev[this._nextEvent].run();
			this._nextEvent += 1;
		}

		// end the game when the time runs out
		if (this.timeRemaining <= 0) {
			this.timeRemaining = 0;
			this.emit('gameover');
			this.stop(true);
		}
	}

	private _sortEvents() {
		this.config.events.sort((a, b) => a.time - b.time);
	}

	private _startUpdateInverval(): void {
		clearInterval(this._updateIntervalID);
		this._updateIntervalID = setInterval(this.updateResults.bind(this), this.config.updateInterval);
	}

	private _stopUpdateInterval(): void {
		clearInterval(this._updateIntervalID);
		this._updateIntervalID = -1;
		this.updateResults();
	}

	private _logErrors(err, data): void {
		if (err)
			console.log(err);
	}

	/*private _getCurrentMatch(callback?): void {
		callback = callback || this._logErrors;
		this.jsdc.get('match', 'current', (err, matches) => {
			if (err) {
				callback(err);
				return;
			}
			if (matches.length > 0) {
				this._matchId = parseInt(matches[0].matchId);
			} else {
				this._matchId = -1;
			}
			callback(null, this.match);
		});
	}*/

	public updateResults(callback?: (err, data) => any): void {
		callback = callback || this._logErrors;

		if (this.match <= 0) {
			callback(new Error('Cannot update results: no match loaded.'), null);
		}

		this.jsdc.post('matchresult', {
			method: 'update',
			match: this.match,
		}, callback);
	}

	


	public start(): bool {
		if (this.running || this.paused)
			return false;
		
		this._sortEvents();
		this._startInterval();
		this._startUpdateInverval();

		this._running = true;
		this._paused = this._aborted = this._finished = this._emergency = false;

		this.timeElapsed = 0;
		this._nextEvent = 0;
		
		this.emit('start');
		return true;
	}

	public stop(noAbort?: bool): bool {
		this._stopInterval();
		this._stopUpdateInterval();

		this._running = this._paused = false;
		this._finished = true;

		if (!noAbort) {
			this._aborted = true;
			this.emit('abort');
		}

		this.emit('stop');

		return true;
	}

	public pause(): bool {
		if (!this._running || this._paused) 
			return false;

		this._updateGameTime();
		this._stopInterval();

		this._running = false;
		this._paused = true;

		this.emit('pause');
		return true;
	}
	
	public resume(): bool {
		if (!this._paused) 
			return false;

		this._startInterval();

		this._running = true;
		this._paused = this._emergency = false;
		this.emit('resume');
		return true;
	}

	public reset(): void {
		this.timeElapsed = 0;
		this._running = this._paused = this._finished = this._aborted = this._emergency = false;
	}

	public startEmergency(): void {
		this._emergency = true;
		this.pause();
	}

}

export class TimedEvent {
	public time: number;
	public callback: Function;
	public args: any[];

	constructor (time: number, callback: Function, ...args: any[]);
	constructor(time: number, callback: Function) {
		this.time = time;
		this.callback = callback;
		this.args = [];

		for (var i = 2; i < arguments.length; i++)
			this.args.push(arguments[i]);
	}

	run(): void {
		this.callback.apply(null, this.args);
	}
}
