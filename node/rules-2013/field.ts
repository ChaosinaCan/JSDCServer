///<reference path="../node.d.ts" />
///<reference path="../jsdc.ts" />
import jsdc = require('../jsdc');
import BaseEventEmitter = require('../eventbase');

/** Events:
 *  territory changed: source		Sent when the power source moves to a new territory
 */
export class PowerSource extends BaseEventEmitter {
	private _territory: Territory;
	get territory() { return this._territory }
	set territory(value: Territory) {
		if (this._territory === value) {
			return;
		}
		if (value && value.powerSource) {
			throw new Error('Territory ' + value.id + ' already has a power source');
		}
		
		var oldTerritory = this._territory;
		this._territory = value;

		if (oldTerritory) {
			oldTerritory.powerSource = null;
		}

		if (this._territory) {
			this._territory.powerSource = this;
		}

		this.emit('territory changed', this);
	}

	private _moveable: boolean;
	get moveable() { return this._moveable }

	constructor(territory: Territory, moveable?: boolean) {
		super()
		this.territory = territory;
		this._moveable = !!(moveable || false);
	}
}

/** Events:
 *  team changed: node			Sent when the "ownerTeam" property changes
 *  source changed: node		Sent when the "powerSource" property changes
 *  power changed: node			Sent when the "powered" property changes
 *  held: node					Sent when a node is held by a team for 10 seconds
 *  warning: node				Sent when the node is 3 seconds from being scored
 *  sync: node					Sent when the scoring timer is paused, resumed, etc
 */
export class Territory extends BaseEventEmitter {
	public field: Field;
	public id: number;
	public x: number;
	public y: number;
	public width: number;
	public height: number;
	public holdTime: number;
	public warningTime: number = 3000;

	public neighbors: Territory[];

	private _lastScoringTime: number;		// timestamp of last scoring event
	private _elapsedScoringTime: number;	// time elapsed in timer when timer is paused
	private _scoringTimer: any;				// main scoring timer ID
	private _warningTimer: any;				// 3-second warning timer ID

	private _invalidated: boolean;
	private _holdEvents: boolean;				// if true, don't send power change events until processing is finished
	private _heldPower: boolean;				// save the power value before processing begins

	private _ownerTeam: number;
	get ownerTeam() { return this._ownerTeam }
	set ownerTeam(id: number) {
		if (id != this.ownerTeam) {
			//console.log('owner changed for', this.id);
			this._ownerTeam = id;
			this._sendTeamChanged();
			this.checkPower();
			this.resetScoringTimer();
		}
	}

	private _powerSource: PowerSource;
	get powerSource() { return this._powerSource }
	set powerSource(value: PowerSource) {
		if (value != this.powerSource) {
			console.log('source changed for', this.id);
			this._powerSource = value;
			this.emit('source changed', this);
			this.checkPower();
		}
	}

	private _powered: boolean;
	get powered() {
		if (this._invalidated) {
			//console.log('updating power for', this.id);
			this.checkPower();
		}
		return this._powered 
	}
	set powered(value: boolean) {
		//console.log('power validated for', this.id);
		this._invalidated = false;
		if (value !== this.powered) {
			this._powered = value;

			if (!this._holdEvents) {
				this._sendPowerChanged();

				if (value === false) {
					this.resetScoringTimer();
				}
			}
		}
	}

	get isTimerRunning() {
		return this._scoringTimer !== null;
	}

	get timeUntilScore() {
		if (this.isTimerRunning) {
			return this.holdTime - (this._lastScoringTime - Date.now()) / 1000;
		} else {
			return this.holdTime - this._elapsedScoringTime;
		}
	}

	constructor(field: Field, id: number, x: number, y: number, width?:number, height?:number) {
		super();
		jsdc.bindMemberFunctions(this);

		this.field = field;
		this.id = id;
		this.x = x;
		this.y = y;
		this.width = width || 1;
		this.height = height || 1;
		this.holdTime = 10;

		this.ownerTeam = 0;
		this.neighbors = [];

		this._invalidated = true;
		this._powered = false;
		this._scoringTimer = null;
		this._warningTimer = null;
		this._lastScoringTime = -1;
		this._elapsedScoringTime = 0;
	}

	holdEvents() {
		if (!this._holdEvents) {
			var invalid = this._invalidated;

			this._holdEvents = true;
			this._invalidated = false;
			this._heldPower = this.powered;
			this._invalidated = invalid;
		}
	}

	resumeEvents() {
		if (this._holdEvents) {
			this._holdEvents = false;
			if (this._heldPower !== this.powered) {
				console.log('changed', this.id, this.powered);
				this._sendPowerChanged();
			}
		}
	}

	addNeighbor(territory: Territory) {
		if (!territory || territory === this)
			return;

		if (this.neighbors.indexOf(territory) < 0)
			this.neighbors.push(territory);
		
		if (territory.neighbors.indexOf(this) < 0)
			territory.neighbors.push(this)

		//console.log('invalidated by neighbor add', this.id);
		this._invalidated = true;
	}

	checkPower() {
		this.field.checkPower();
	}

	// sent when the power value of the territory is changed
	private _sendPowerChanged() {
		this.emit('power changed', this);
	}

	// sent when the owning team of the territory changes
	private _sendTeamChanged() {
		this.emit('team changed', this);
	}

	// sends a 3-second warning event before a territory gets scored
	private _sendTerritoryWarning() {
		this.emit('warning', this);
	}

	// sent when a team holds a territory for the hold time
	private _sendTerritoryHeld() {
		this._elapsedScoringTime = 0;
		this.startScoringTimer();
		this.emit('held', this);
	}

	// sent when the state of the timer changes
	private _sendTimerSync() {
		this.emit('sync', this);
	}

	// restarts the scoring timer. If the territory is not powered, only stops the timer
	resetScoringTimer() {
		//console.log(this.id, 'timer reset');
		this.stopScoringTimer();
		this._elapsedScoringTime = 0;
		this.startScoringTimer();
	}

	// starts the scoring timer. If the territory is not powered, does nothing
	startScoringTimer() {
		if (this.powered && this.holdTime > 0) {
			//console.log(this.id, 'timer start');
			this._lastScoringTime = Date.now();
			this._scoringTimer = setTimeout(this._sendTerritoryHeld, this.holdTime - this._elapsedScoringTime);

			if (this.holdTime - this._elapsedScoringTime > this.warningTime)
				this._warningTimer = setTimeout(this._sendTerritoryWarning, this.holdTime - this._elapsedScoringTime - this.warningTime);

			this._sendTimerSync();
		}
	}

	// pauses the scoring timer
	stopScoringTimer() {
		//console.log(this.id, 'timer stop');
		// remember how much of the interval has elapsed so that we can resume it at the right time
		this._elapsedScoringTime = Date.now() - this._lastScoringTime;
		clearTimeout(this._scoringTimer);
		clearTimeout(this._warningTimer);
		this._scoringTimer = null;
		this._sendTimerSync();
	}
}

/** Events:
 *  team changed: node			Sent when a territory's "ownerTeam" property changes 
 *  source changed: node		Sent when a territory's "powerSource" property changes
 *  power changed: node			Sent when a territory's "powered" property changes
 *  held: node					Sent when a territory is held by a team for 10 seconds
 *  warning: node				Sent when a territory is 3 seconds from being scored
 *  sync: node					Sent when the scoring timer for a territory is paused, resumed, etc
 */
export class Field extends BaseEventEmitter {
	public width: number;
	public height: number;
	private _holdChecks: boolean;
	private _territories: Territory[];
	private _grid: Territory[][];
	private sources: PowerSource[];

	get territories() {
		return this._territories;
	}

	constructor(ids: number[][]) {
		super();
		jsdc.bindMemberFunctions(this);

		this.height = ids.length;
		this.width = ids[0].length;
		this._territories = [];
		this._grid = [];
		this.sources = [];

		this.holdPowerChecks();

		for (var x = 0; x < this.width; x++) {
			this._grid[x] = [];
		}

		for (var y = 0; y < this.height; y++) {
			for (var x = 0; x < this.width; x++) {
				var id = ids[y][x];
				if (id === 0) {
					this._grid[x][y] = null;
					continue;
				}

				// find an existing node or make a new one
				var node = this.getTerritory(id) || new Territory(this, id, x, y);

				// save it to the field
				this._territories[id] = node;
				this._grid[x][y] = node;
				
				// extend the node if it spans multiple squares
				if (x > node.x)
					node.width = (x - node.x) + 1;
				if (y > node.y)
					node.height = (y - node.y) + 1;

				// connect the node to any existing neighbors
				if (x > 0)
					node.addNeighbor(this.atPosition(x - 1, y));
				if (y > 0)
					node.addNeighbor(this.atPosition(x, y - 1));
			}
		}
		this.attachEventListeners();
		this.resumePowerChecks();
	}

	private attachEventListeners(): void {
		this._territories.forEach((territory) => {
			territory.on('source changed', (node) => this.emit('source changed', node));
			territory.on('power changed', (node) => this.emit('power changed', node));
			territory.on('team changed', (node) => this.emit('team changed', node));
			territory.on('warning', (node) => this.emit('warning', node));
			territory.on('held', (node) => this.emit('held', node));
			territory.on('sync', (node) => this.emit('sync', node));
		});
	}

	addPowerSource(...sources: PowerSource[]) {
		//console.log('add power source called');
		this.sources = this.sources.concat(sources);
		this.checkPower();
	}

	getTerritory(id: number): Territory {
		return this.territories[id] || null;
	}

	atPosition(x: number, y: number): Territory {
		return this._grid[x][y] || null;
	}

	holdPowerChecks(): void {
		this._holdChecks = true;
	}

	resumePowerChecks(): void {
		this._holdChecks = false;
		this.checkPower();
	}
	
	checkPower(): void {
		if (this._holdChecks) {
			return;
		}

		console.log('checking power');

		this.territories.forEach((node) => {
			node.holdEvents();
			node.powered = false;
		});

		var checked: number[] = [];
		var stack: Territory[] = this.sources.map((source) => source.territory)
			.filter((source) => !!source);
		//this.sources.forEach((source) => stack.push(source.territory));

		// breadth first search starting at each power source
		while (stack.length !== 0) {
			var node = stack.pop();
			// if node was already checked, skip it
			if (checked.indexOf(node.id) >= 0) {
				//console.log('already checked');
				continue;
			}

			// if the node is not owned by anyone, skip it
			if (node.ownerTeam === 0) {
				continue;
			}

			//console.log('powered');
			node.powered = true;
			checked.push(node.id);
			
			// for each unchecked neighboring territory that is owned by the same team, extend power to it
			node.neighbors.forEach((neighbor) => {
				if (neighbor.ownerTeam === node.ownerTeam && checked.indexOf(neighbor.id) < 0) {
					//console.log('queueing', neighbor.id);
					stack.push(neighbor);
				}
			});
		}

		this.territories.forEach((node) => node.resumeEvents());
	}

	reset(): void {
		this.territories.forEach((node) => {
			node.ownerTeam = 0;
			node.powered = false;
			node.resetScoringTimer();
		});
	}

	resetScoringTimers(): void {
		this.territories.forEach((node) => node.resetScoringTimer());
	}

	startScoringTimers(): void {
		this.territories.forEach((node) => node.startScoringTimer());
	}

	stopScoringTimers(): void {
		this.territories.forEach((node) => node.stopScoringTimer());
	}
}
