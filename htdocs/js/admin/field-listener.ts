/// <reference path="base.ts" />

interface GameStatus {
	teams: TeamStatus[];
	field: TerritoryStatus[];
	batteries: BatteryStatus[];
}

interface TerritoryStatus {
	id: number;
	owner: number;
	powered: bool;
}

interface TeamInfo {
	name: string;
	university: string;
	imageName: string;
	teamId: number;
	colorId: number;
}

interface TeamStatus {
	team: TeamInfo;
	territories: number;
	controlPoints: number;
	batteries: bool[];
}

interface BatteryStatus {
	id: number;
	owner: number;
	territory: number;
}



class Field implements EventTarget {
	field: JQuery;
	grid: JQuery[][];
	height: number;
	width: number;
	currentStatus: GameStatus = null;
	onload: Function;

	private colorClasses: string;
	private colorsById: ColorMap = {};
	private teams: Team[] = [];
	private teamsById: TeamMap = {};
	private cellsById: { [key: string]: JQuery; } = {};
	private neighbors: { [key: string]: number[]; } = {};
	private initialized = false;

	constructor(colors: Color[], teams: Team[]) {
		bindMemberFunctions(this);
		this.colorsById = <any>colors.indexByProperty('colorId');
		this.colorClasses = colors.map((color) => color.name).join(' ');
		this.changeTeams(teams);
		this.currentStatus = null;

		this.field = $('<table class="field x-large">');

		var size = 11;
		this.height = size;
		this.width = size;

		this.grid = [];
		for (var r = 0; r < size; r++) {
			var row = $('<tr>');
			this.grid[r] = [];
			for (var c = 0; c < size; c++) {
				var cell = $('<td>')
				row.append(cell);
				this.grid[r][c] = cell;
			}
			this.field.append(row);
		}

		jsdc.clock.connect((err) => {
			if (err) {
				Modal.error('Failed to connect', err);
				return;
			}

			var clock = jsdc.clock;
			clock.join('game');
			clock.emit('game event', { event: 'get field' });
			clock.on('game event', this.onGameEvent);
			clock.on('game status', this.onGameStatus);
		});
	}

	changeTeams(teams: Team[]): void {
		this.teams = teams;
		this.teamsById = <any>teams.indexByProperty('teamId');
	}

	update(): void {
		jsdc.clock.emit('game status');
	}


	getCell(id: number): JQuery {
		if (id === 0) {
			return null;
		} else {
			return this.cellsById[id.toString()] || null;
		}
	}

	getNeighbors(id: number): JQuery[] {
		if (id === 0) {
			return [];
		} else {
			return this.neighbors[id.toString()].map((neighbor) => this.getCell(neighbor));
		}
	}

	getCells(): JQuery[] {
		var cells = [];
		for (var id in this.cellsById) {
			if (this.cellsById.hasOwnProperty(id)) {
				cells.push(this.cellsById[id]);
			}
		}
		return cells;
	}
	
	colorCell(id: number, teamId: number) {
		var cell = this.getCell(id);
		if (cell) {
			cell.removeClass(this.colorClasses);

			var team = this.getTeam(teamId);
			if (team && team.colorId > 0) {
				cell.addClass(this.getColor(team.colorId));
			}
		}
	}

	private getColor(id: number) {
		return this.colorsById[id.toString()].name;
	}

	private getTeam(id: number) {
		return this.teamsById[id.toString()] || null;
	}

	private updateCell(status: TerritoryStatus) {
		var cell = this.getCell(status.id);
		cell.data('status', status);

		this.colorCell(status.id, status.owner);
		if (status.powered) {
			cell.addClass('powered');
			cell.removeClass('unpowered');
		} else {
			cell.addClass('unpowered');
			cell.removeClass('powered');
		}
	}

	private updateBattery(status: BatteryStatus) {
		var className = 'battery-' + status.id;
		this.field.find('.' + className).text('').removeClass('battery').removeClass(className);

		if (status.territory !== 0) {
			this.getCell(status.territory).text('⚡').addClass('battery').addClass(className);
		}
	}

	private getTeamStatusFromId(teamId: number) {
		for (var i = 0; i < this.currentStatus.teams.length; i++) {
			if (this.currentStatus.teams[i].team.teamId === teamId) {
				return this.currentStatus.teams[i];
			}
		}
		return null;
	}

	private updateTerritoryCounts(): void {
		var territories = {};
		var controlPoints = {};

		this.teams.forEach((team) => {
			// [powered, owned]
			territories[team.teamId] = 0;
			controlPoints[team.teamId] = 0;
		});

		this.currentStatus.field.forEach((territory) => {
			if (territory.owner) {
				if (territory.id <= 4) {
					// start point
					return;
				}

				var counter: number;
				if (territory.id <= 8) {
					// control point
					controlPoints[territory.owner] += 1;
				} else {
					// normal territory
					territories[territory.owner] += 1;
				}
			}


		});

		this.teams.forEach((team) => {
			var status: TeamStatus = this.getTeamStatusFromId(team.teamId);
			status.territories = territories[team.teamId];
			status.controlPoints = controlPoints[team.teamId];
		});
	}

	private updateBatteryOwners(): void {
		this.teams.forEach((team) => {
			var status: TeamStatus = this.getTeamStatusFromId(team.teamId);

			for (var i = 0; i < 2; i++) {
				status.batteries[i] = this.currentStatus.batteries[i].owner === team.teamId;
			}
		});
	}

	private onGameStatus(status: GameStatus) {
		this.currentStatus = status;

		status.batteries.forEach(this.updateBattery);
		status.field.forEach(this.updateCell);
		this.updateTerritoryCounts();
		this._event('game status', status);
	}

	private onGameEvent(data) {
		switch (data.event) {
			case 'field': 
				this.onGetField(data.data);
				jsdc.clock.emit('game status');
				break;

			case 'territory update':
				this.onTerritoryUpdate(data.data);
				break;

			case 'battery update':
				this.onBatteryUpdate(data.data);
				break;
		}
	}

	private onTerritoryUpdate(data: TerritoryStatus) {
		this.updateCell(data);
		for (var i = 0; i < this.currentStatus.field.length; i++) {
			if (this.currentStatus.field[i].id === data.id) {
				this.currentStatus.field[i] = data;
			}
		}
		this.updateTerritoryCounts();
		this._event('territory update', data);
	}

	private onBatteryUpdate(data: BatteryStatus[]) {
		data.forEach(this.updateBattery);
		this.currentStatus.batteries = data;
		this._event('battery update', data);
	}

	private onGetField(data) {
		if (this.initialized) {
			return;
		} else {
			this.initialized = true;
		}
		
		var grid: number[][] = data.grid;
		var styles: string[][] = data.styles;
		this.neighbors = data.neighbors;

		for (var x = 0; x < this.width; x++) {
			for (var y = 0; y < this.height; y++) {
				var cell = this.grid[y][x];
				var id = grid[y][x];
				var style = styles[y][x];

				var existing = this.getCell(id);
				if (existing) {
					// expand the existing cell
					if (existing.data('x') < x) {
						existing.attr('colspan', parseInt(existing.attr('colspan') || '1') + 1);
					} else if (existing.data('y') < y) {
						existing.attr('rowspan', parseInt(existing.attr('rowspan') || '1') + 1);
					}

					cell.remove();
					cell = existing;
				} else {
					cell.data('x', x);
					cell.data('y', y);
					cell.data('id', id);
					cell.data('capturable', !['s', '*', 'o', 'a', 'j'].contains(style));
					cell.data('status', null);
					this.cellsById[id.toString()] = cell;
				}

				var classes = [];
				switch (style) {
					case ' ': break;
					case 's': 
						cell.text('⚡');
						classes.push('source');
						break;
					case '*': 
						cell.append($('<span>').text(''));
						classes.push('spin'); 
						classes.push('upper');
						break;
					case 'o':
					case 'a':
					case 'j':
						classes.push('out');
						if (x === 0) 
							classes.push('u-left');
						else if (x === this.width - 1)
							classes.push('u-right');
						else if (y === 0)
							classes.push('u-up');
						else if (y === this.height - 1)
							classes.push('u-down');
						else
							classes.push('all');

						if (style === 'a') {
							cell.text('💻');
							classes.push('admin');
						} else if (style === 'j') {
							cell.text('');
							classes.push('projector');
						}
						break;
					case '-':
					case 'p':
						var raised = ['-', 'p', '^', 'v', '<', '>', '*'];
						if (!raised.contains(styles[y-1][x]))
							classes.push('u');
						if (!raised.contains(styles[y+1][x]))
							classes.push('d');
						if (!raised.contains(styles[y][x-1]))
							classes.push('l');
						if (!raised.contains(styles[y][x+1]))
							classes.push('r');

						classes.push('upper');

						if (style === 'p') {
							cell.text('✦');
							classes.push('cp');
						}
						break;
					case '^':
					case 'v':
					case '<':
					case '>':
						if (style != '^' && styles[y-1][x] != '-')
							classes.push('u');
						if (style != 'v' && styles[y+1][x] != '-')
							classes.push('d');
						if (style != '<' && styles[y][x-1] != '-')
							classes.push('l');
						if (style != '>' && styles[y][x+1] != '-')
							classes.push('r');

						classes.push('upper');
						break;
				}

				cell.addClass(classes.join(' '));

			}
		}

		if (this.onload) {
			this.onload();
		}
	}

	// EventTarget implementation

	private _listeners: { [key: string]: EventListener[]; } = {};

	private _event(type: string, detail: any) {
		var event = <CustomEvent>document.createEvent('CustomEvent');
		event.initCustomEvent(type, true, false, detail);
		this.dispatchEvent(event);
	}

	addEventListener(type: string, listener: EventListener) {
		if (!(type in this._listeners)) {
			this._listeners[type] = [];
		}

		if (!this._listeners[type].contains(listener)) {
			this._listeners[type].push(listener);
		}
	}

	removeEventListener(type: string, listener: EventListener) {
		if (type in this._listeners) {
			this._listeners[type].remove(listener);
		}
	}

	dispatchEvent(evt: Event): bool {
		if (evt.type in this._listeners) {
			this._listeners[evt.type].forEach((listener) => {
				listener.apply(this, [evt]);
			});
		}
		return true;
	} 
}



class FieldScoringListener {
	field: Field;

	constructor(field: Field) {
		bindMemberFunctions(this);
		this.field = field;

		jsdc.clock.connect((err) => {
			if (err) {
				return;
			}

			var clock = jsdc.clock;
			clock.join('field');
			clock.on('game event', this.onGameEvent);
		});
	}

	private onGameEvent(event) {
		switch (event.event) {
			case 'territory scored': this.onTerritoryScored(event.data); break;
			case 'territory warning': this.onTerritoryWarning(event.data); break;
		}
	}

	private onTerritoryScored(id: number) {
		var value = (id <= 8) ? 5 : ((id > 60) ? 3 : 1);
		ScoringIndicator.create(this.field.getCell(id), value);
	}

	private onTerritoryWarning(id: number) {
		WarningIndicator.create(this.field.getCell(id));
	}

}

class CellIndicator {
	cell: JQuery;

	sizeToCell(elem: JQuery) {
		var pos = this.cell.position();
		var width = this.cell.outerWidth();
		var height = this.cell.outerHeight();

		elem.css({
			position: 'absolute',
			top: pos.top + 'px',
			left: pos.left + 'px',
			width: width + 'px',
			height: height + 'px',
		});
	}
}

class WarningIndicator extends CellIndicator {
	private elem: JQuery;

	static pool: WarningIndicator[] = [];
	static template = $('<div class=score-warning>')
		.append(
			$('<span class=t3>'),
			$('<span class=t2>'),
			$('<span class=t1>'));

	constructor() {
		super();
		this.elem = WarningIndicator.template.clone();
	}

	static create(cell: JQuery): CellIndicator {
		var indicator = WarningIndicator.pool.pop() || new WarningIndicator();
		indicator.cell = cell;

		indicator.sizeToCell(indicator.elem);
		indicator.elem.appendTo(document.body);
		setTimeout(indicator.destroy.bind(indicator), 3000);

		return indicator;
	}

	destroy() {
		this.elem.remove();
		WarningIndicator.pool.push(this);
	}
}

class ScoringIndicator extends CellIndicator {
	private elem: JQuery;

	static pool: ScoringIndicator[] = [];
	static template = $('<div class=score-indicator>').append($('<span>'));

	constructor() {
		super();
		this.elem = ScoringIndicator.template.clone();
	}

	static create(cell: JQuery, value: number) {
		var indicator = ScoringIndicator.pool.pop() || new ScoringIndicator();
		indicator.cell = cell;

		indicator.sizeToCell(indicator.elem);
		indicator.elem.find('span').text('+' + value);
		indicator.elem.appendTo(document.body);
		setTimeout(indicator.destroy.bind(indicator), 1600);
	}

	destroy() {
		this.elem.remove();
		ScoringIndicator.pool.push(this);
	}
}