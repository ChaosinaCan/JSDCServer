///<reference path="../node.d.ts" />
///<reference path="../jsdc.ts" />
///<reference path="../clock.ts" />

import jsdc = require('../jsdc');
import clock = require('../clock');
export import field = require('./field');

var TimedEvent = clock.TimedEvent;

var NumSources = 4;
var TerritoryHoldTime = 10 * 1000;

// territory IDs
var grid = [
	[1, 10, 10, 10, 11, 11, 11, 13, 13, 13, 2],
	[14, 15, 15, 16, 16, 11, 18, 18, 19, 19, 20],
	[14, 15, 15, 21, 21, 22, 23, 23, 19, 19, 20],
	[14, 24, 25, 0, 22, 22, 22, 0, 26, 27, 20],
	[28, 24, 25, 29, 60, 61, 62, 30, 26, 27, 31],
	[28, 28, 29, 29, 63, 70, 64, 30, 30, 31, 31],
	[28, 35, 36, 29, 65, 66, 67, 30, 37, 38, 31],
	[40, 35, 36, 0, 41, 41, 41, 0, 37, 38, 42],
	[40, 43, 43, 44, 44, 41, 45, 45, 46, 46, 42],
	[40, 43, 43, 47, 47, 48, 49, 49, 46, 46, 42],
	[4, 50, 50, 50, 48, 48, 48, 53, 53, 53, 3],
]

// styles for scoreboard/scoring display
// s = source
// a = admin-side, inaccessible
// p = projector-size, inaccessible
// - = raised level
// + = top level
// ^ > v < = ramps (45 degrees off)
var styles = [
	['s', ' ', ' ', ' ', ' ', 'j', ' ', ' ', ' ', ' ', 's'],
	[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
	[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
	[' ', ' ', ' ', '<', ' ', ' ', ' ', '^', ' ', ' ', ' '],
	[' ', ' ', ' ', ' ', '-', '-', '-', ' ', ' ', ' ', ' '],
	[' ', ' ', ' ', ' ', '-', '+', '-', ' ', ' ', ' ', 'a'],
	[' ', ' ', ' ', ' ', '-', '-', '-', ' ', ' ', ' ', ' '],
	[' ', ' ', ' ', 'v', ' ', ' ', ' ', '>', ' ', ' ', ' '],
	[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
	[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
	['s', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', 's'],
]

export interface GameStatus {
	teams: TeamStatus[];
	field: TerritoryStatus[];
}

export interface GameTakeTerritoryMessage {
	team: number;
	territory: number;
}

export interface GameToggleRampMessage {
	team: number;
}

export interface TerritoryStatus {
	id: number;
	owner: number;
	powered: boolean;
}

export interface TeamStatus {
	team: clock.TeamInfo;
	bottomTerritories: number;
	middleTerritories: number;
	topTerritories: number;
	ramp: field.RampDirection;
}

export class GameRules extends jsdc.GameRules {
	public field: field.Field;
	public sources: field.PowerSource[];
	public homeTerritories: { [key: string]: field.Territory; };
	public ramps: { [key: string]: field.Ramp; };

	private _teams: { [key: string]: TeamStatus; };

	constructor(game: clock.GameClock, api: jsdc.API, cue: jsdc.CueServer[]) {
		super(game, api, cue);

		// Perform any one-time initialization here
		game.config.duration = 7 * 60;
		game.config.events = [
			new TimedEvent(game.config.duration - 60, this.audio.play, 'oneminute'),
			new TimedEvent(game.config.duration - 30, this.audio.play, 'alarm'),
		];

		this.cues = {
			'field reset': 1,
			'emergency': 911,

			'ramp up': {
				'red': 2.1,
				'blue': 2.2,
				'green': 2.3,
				'yellow': 2.4,
			},
			'ramp down': {
				'red': 3.1,
				'blue': 3.2,
				'green': 3.3,
				'yellow': 3.4,
			},
			'stop ramps': 4.1,
			'start ramps': 4.2,
		}

		this.actions = {
			'action': 1,
			'hold bottom territory': 2,
			'hold middle territory': 3,
			'hold top territory': 4,
			'gameover bottom territory': 5,
			'gameover middle territory': 6,
			'gameover top territory': 7,
			'first ramp': 8,
		}

		this.audio.add({
			start: 'start_bell.ogg',
			stop: 'buzzer.ogg',
			alarm: 'red_alert.ogg',
			endperiod: 'transfer_complete.ogg',
			oneminute: 'one_minute.ogg',
			emergency: 'emergency.ogg',
		})
	}

	getTeamStatus(team: number): TeamStatus {
		return this._teams[team];
	}

	getStatus(): GameStatus {
		return {
			teams: this._getTeamStatusArray(),
			field: this._getFieldStatusArray(),
		}
	}

	setTeamStatus(team: number, status: TeamStatus) {
		this._teams[team] = status;
	}

	// Events handlers are attached by convention. Funtions with certain names will
	// automatically be called when an event is emitted by the 'game' object:
	//
	// this.game.emit('foo bar', data) -> this.onFooBar(data)
	// this.game.emit('game event', { event: 'foo bar', data: data }) -> this.onGameFooBar(data)
	// this.sendEvent('foo bar', data) -> this.onGameFooBar(data)

	onMatchChanged() {
		if (this.rulesLoaded) {
			this.initializeGame();
		} else {
			setTimeout(this.onMatchChanged, 100);
		}
	}

	onStart() {
		// Perform any per-match initialization here
		this.audio.play('start');
		this.field.startScoringTimers();

		this._setAllRampsDown();
		this.sendCue('start ramps');
	}

	onPause() {
		// Called when the game is paused
		this.field.stopScoringTimers();
		this.sendCue('stop ramps');
	}

	onResume() {
		// Called when the game resumes from being paused
		this.audio.play('start');
		this.field.startScoringTimers();
		this.sendCue('start ramps');
	}

	onStop() {
		// Called when the game ends for any reason
		this.audio.play('stop');
		this.field.stopScoringTimers();
		this.sendCue('stop ramps');
	}

	onGameover() {
		// Called in addition to onStop() when the timer hits 0
		// Tally up scores for each owned territory at the end of the match
		this.field.territories.forEach((territory) => {
			if (territory.powered && territory.ownerTeam) {
				var score = null;
				if (this._isBottomTerritory(territory.id)) {
					score = 'gameover bottom territory';
				} else if (this._isMiddleTerritory(territory.id)) {
					score = 'gameover middle territory';
				} else if (this._isTopTerritory(territory.id)) {
					score = 'gameover top territory';
				}

				if (score !== null) {
					this.sendScore(score, territory.ownerTeam, (err) => {
						if (err) {
							console.log('Failed to score territory ' + territory.id + ' for team ' + territory.ownerTeam + ' at match end.');
						}
					});
				}
			}
		});
	}

	onAbort() {
		// Called in addition to onStop() if the match is aborted
	}

	onReset() {
		// Called when a field reset command is sent

		// Set all ramps down.
		this._setAllRampsDown();

		// Reset anything else
		this.sendCue('field reset');
	}

	onEmergency() {
		// Called when a judge declares an emergency
		this.sendCue('emergency');
	}

	onGameTakeTerritory(data: GameTakeTerritoryMessage) {
		console.log('take territory ', data.team, data.territory);
		var team: number = data.team;
		var territory = this.field.getTerritory(data.territory);
		var neighbors = territory.neighbors;
		var canTake = false;

		if (!this.game.running) {
			console.log('Team ' + team + ' attempted to take territory ' + territory.id + ' but match was not running.');
			return;
		}

		if (!territory || territory.id <= 4) {
			console.log('Team ' + team + ' attempted to take territory ' + territory.id + ' but it cannot be taken.');
			return;
		}

		if (territory.ownerTeam === team) {
			console.log('Team ' + team + ' attempted to take territory ' + territory.id + ' but already owned it.');
			return;
		}

		for (var i = 0; i < neighbors.length; i++) {
			var neighbor = neighbors[i];
			if (neighbor.ownerTeam === team && neighbor.powered) {
				canTake = true;
				break;
			}
		}

		if (!canTake) {
			console.log('Team ' + team + ' attempted to take territory ' + territory.id + ' but was not allowed.');
			return;
		}

		var oldOwner = territory.ownerTeam;
		territory.ownerTeam = team;

		// change territory owners
		if (this._isBottomTerritory(territory.id)) {
			this.getTeamStatus(team).bottomTerritories += 1;
			if (oldOwner) {
				this.getTeamStatus(oldOwner).bottomTerritories -= 1;
			}
		} else if (this._isMiddleTerritory(territory.id)) {
			this.getTeamStatus(team).middleTerritories += 1;
			if (oldOwner) {
				this.getTeamStatus(oldOwner).middleTerritories -= 1;
			}
		} else if (this._isTopTerritory(territory.id)) {
			this.getTeamStatus(team).topTerritories += 1;
			if (oldOwner) {
				this.getTeamStatus(oldOwner).topTerritories -= 1;
			}
		}
	}

	onGameToggleRamp(data: GameToggleRampMessage) {
		console.log('toggle ramp ', data);

		var ramp = this._getTeamRamp(data.team);
		ramp.direction = ramp.direction === field.RampDirection.Up ? field.RampDirection.Down : field.RampDirection.Up;

		this._postRampUpdate(ramp);

		if (!ramp.hasToggled) {
			ramp.hasToggled = true;
			this.sendScore('first ramp', data.team, (err) => {
				if (err) {
					console.log('Failed to score first ramp toggle for team ' + data.team);
				}
			});
		}
	}

	onGameGetField() {
		var neighbors = {};
		this.field.territories.forEach((territory) => {
			neighbors[territory.id] = territory.neighbors.map((neighbor) => neighbor.id);
		});

		// Update styles array with proper ramp directions
		var updatedStyles: string[][] = clone(styles);
		iterkeys(this.ramps, (key) => {
			var ramp = this.ramps[key];
			updatedStyles[ramp.y][ramp.x] = ramp.icon;
		});

		var data = {
			grid: grid,
			neighbors: neighbors,
			styles: updatedStyles,
		}

		this.sendEvent('field', data);
	}

	private initializeGame(): void {
		this.field = new field.Field(grid);
		this.field.holdPowerChecks();

		this.field.addListener('team changed', this._onTerritoryUpdate);
		this.field.addListener('power changed', this._onTerritoryUpdate);
		this.field.addListener('power changed', this._onPowerChanged);
		this.field.addListener('held', this._onTerritoryScored);
		this.field.addListener('warning', this._onTerritoryWarning);

		this.sources = [];
		this.sources[0] = new field.PowerSource(this.field.getTerritory(1), false);
		this.sources[1] = new field.PowerSource(this.field.getTerritory(2), false);
		this.sources[2] = new field.PowerSource(this.field.getTerritory(3), false);
		this.sources[3] = new field.PowerSource(this.field.getTerritory(4), false);

		// set hold times on each territory
		// territories 1-4 are bases. Teams do not score points for holding them
		this.field.territories.forEach((node) => {
			node.holdTime = this._isSourceTerritory(node.id) ? -1 : TerritoryHoldTime;
		});

		// Initialize the state of the field
		this.field.getTerritory(1).ownerTeam = 0;
		this.field.getTerritory(2).ownerTeam = 0;
		this.field.getTerritory(3).ownerTeam = 0;
		this.field.getTerritory(4).ownerTeam = 0;

		this.homeTerritories = {
			'yellow': this.field.getTerritory(1),
			'blue': this.field.getTerritory(2),
			'green': this.field.getTerritory(3),
			'red': this.field.getTerritory(4),
		};

		this.ramps = {
			'yellow': new field.Ramp(field.RampLocation.TopLeft, 3, 3),
			'blue': new field.Ramp(field.RampLocation.TopRight, 7, 3),
			'green': new field.Ramp(field.RampLocation.BottomRight, 7, 7),
			'red': new field.Ramp(field.RampLocation.BottomLeft, 3, 7),
		};

		// Initialize the state of each team
		this._teams = {};
		this.game.teams.forEach((team, i) => {
			var color = this.getColor(team.colorId);

			this.homeTerritories[color].ownerTeam = team.teamId;
			this.setTeamStatus(team.teamId, {
				team: team,
				bottomTerritories: 0,
				middleTerritories: 0,
				topTerritories: 0,
				ramp: this.ramps[color].direction,
			});
		});

		// Mark the bases as power sources
		this.field.addPowerSource(
			this.sources[0],
			this.sources[1],
			this.sources[2],
			this.sources[3]
			);
		this.field.resumePowerChecks();

		// Update each field renderer with the proper ramp directions
		this._postAllRampUpdate();
	}

	private _getTerritoryStatus(territory: field.Territory): TerritoryStatus {
		return {
			id: territory.id,
			owner: territory.ownerTeam,
			powered: territory.powered,
		}
	}

	private _getTeamStatusArray(): TeamStatus[] {
		var teams = [];
		for (var key in this._teams) {
			if (this._teams.hasOwnProperty(key)) {
				teams.push(this._teams[key]);
			}
		}
		return teams;
	}

	private _getFieldStatusArray(): TerritoryStatus[] {
		return this.field.territories.map(this._getTerritoryStatus).filter((territory) => territory.id != 0);
	}

	private _onTerritoryUpdate(node: field.Territory) {
		this.sendEvent('territory update', this._getTerritoryStatus(node));
	}

	private _onTerritoryScored(node: field.Territory) {
		// emit score and warning events on a separate channel so we don't bombard tablets with game events
		this.sendEvent('territory scored', 'field', node.id);
		var action = null;

		if (this._isBottomTerritory(node.id)) {
			action = 'hold bottom territory';
		} else if (this._isMiddleTerritory(node.id)) {
			action = 'hold middle territory';
		} else if (this._isTopTerritory(node.id)) {
			action = 'hold top territory';
		}

		if (action) {
			this.sendScore(action, node.ownerTeam, (err) => {
				if (err) {
					console.log('Failed to score territory ' + node.id + ' for team ' + node.ownerTeam + ': ' + err);
				}
			});
		} else {
			console.log('Error: Don\'t know what action to send for territory ' + node.id);
		}
	}

	private _onTerritoryWarning(node: field.Territory) {
		// emit score and warning events on a separate channel so we don't bombard tablets with game events
		this.sendEvent('territory warning', 'field', node.id);
	}

	private _onPowerChanged(node: field.Territory) {
	}

	private _isSourceTerritory(id: number) {
		return id <= 4;
	}

	private _isBottomTerritory(id: number) {
		return id >= 10 && id < 60;
	}

	private _isMiddleTerritory(id: number) {
		return id >= 60 && id < 70;
	}

	private _isTopTerritory(id: number) {
		return id >= 70;
	}

	private _postAllRampUpdate() {
		for (var key in this.ramps) {
			if (this.ramps.hasOwnProperty(key)) {
				this._postRampUpdate(this.ramps[key], true);
			}
		}
	}

	private _postRampUpdate(ramp: field.Ramp, immediate?: boolean) {
		// Post field changes
		this.sendEvent('style change', {
			x: ramp.x,
			y: ramp.y,
			style: ramp.icon
		});

		if (!immediate && ramp.direction == field.RampDirection.Down) {
			this.sendEvent('ramp warning', {
				x: ramp.x,
				y: ramp.y
			});
		} else {
			this.sendEvent('clear ramp warning', {
				x: ramp.x,
				y: ramp.y
			});
		}

		// Post cues
		var color = this._getRampColor(ramp);
		if (ramp.direction === field.RampDirection.Down) {
			this.sendCue('ramp down.' + color);
		} else {
			this.sendCue('ramp up.' + color);
		}
	}

	private _getTeamRamp(teamId: number) {
		var color = this.getTeamStatus(teamId).team.colorId;
		return this.ramps[this.getColor(color)];
	}

	private _getRampColor(ramp: field.Ramp) {
		for (var key in this.ramps) {
			if (this.ramps.hasOwnProperty(key)) {
				if (this.ramps[key].location === ramp.location) {
					return key;
				}
			}
		}
		return null;
	}

	private _setAllRampsDown() {
		for (var key in this.ramps) {
			if (this.ramps.hasOwnProperty(key)) {
				this.ramps[key].direction = field.RampDirection.Down;
			}
		}
		this._postAllRampUpdate();
	}
}

/** Runs a callback function for each property of an object */
function iterkeys(object: any, callbackfn: (key: string) => any): void {
	for (var key in object) {
		if (object.hasOwnProperty(key)) {
			callbackfn(key);
		}
	}
}

/** Creates a deep clone of any JSON-serializable object */
function clone(object: any) {
	if (typeof object !== 'object')
		return object;

	if (Array.isArray(object)) {
		var r = new Array(object.length);
		for (var i = 0; i < object.length; ++i) {
			r[i] = clone(object[i]);
		}
		return r;
	} else {
		var o = {};
		for (var key in object) {
			if (object.hasOwnProperty(key)) {
				o[key] = clone(object[key]);
			}
		}
		return o;
	}
}