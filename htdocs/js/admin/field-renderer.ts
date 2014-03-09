/// <reference path="base.ts" />

interface ColorStyle {
	fg: string;
	bg: string;
	select?: string;
}

interface IconDefinition {
	character: string;
	size: number;
}

interface Point2d {
	x: number;
	y: number;
}

interface Rect2d {
	x: number;
	y: number;
	w: number;
	h: number;
}

interface FieldObject {
	render(field: FieldCanvas, context: CanvasRenderingContext2D): void;
	updateCoords(field: FieldCanvas): void;

	onRepaintNeeded: Function;
}

interface FieldStatus {
	grid: number[][];
	styles: string[][];
	neighbors: { [key: number]: number[]; };
}

interface GameStatus {
	teams: TeamStatus[];
	field: TerritoryStatus[];
}

interface TerritoryStatus {
	id: number;
	owner: number;
	powered: boolean;
}

interface TeamInfo {
	name: string;
	university: string;
	imageName: string;
	teamId: number;
	colorId: number;
}

enum RampDirection {
	Up,
	Down,
}

interface RampWarning {
	x: number;
	y: number;
	effect?: FieldEffect;
}

interface StyleUpdate {
	x?: number;
	y?: number;
	id?: number;
	style: string;
}

interface TeamStatus {
	team: TeamInfo;
	bottomTerritories: number;
	middleTerritories: number;
	topTerritories: number;
	ramp: RampDirection;
}

enum BorderDirection {
	Right,
	Down,
}

enum NodeRingSide {
	Top,
	Left,
	Right,
	Bottom,
	TopLeft,
	TopRight,
	BottomLeft,
	BottomRight,
}

enum NodeState {
	/** Node is not owned */
	Neutral,
	/** Node is owned but not powered */
	Unpowered,
	/** Node is owned and powered */
	Powered,
}

class EventTargetBase implements EventTarget {
	// EventTarget implementation

	private _listeners: { [key: string]: EventListener[]; } = {};

	public _event(type: string, detail?: any) {
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

	dispatchEvent(evt: Event): boolean {
		if (evt.type in this._listeners) {
			this._listeners[evt.type].forEach((listener) => {
				listener.apply(this, [evt]);
			});
		}
		return true;
	}
}

class FieldListener extends EventTargetBase {
	private static CONFIG_FILE = '/js/admin/field-config.json';

	public field: FieldCanvas;
	public currentStatus: GameStatus;

	private colorsById: ColorMap = {};
	private teams: Team[] = [];
	private teamsById: TeamMap = {};
	private fieldConfig: FieldConfig = null;
	private initialized = false;
	private rampWarnings: RampWarning[] = [];

	constructor(colors: Color[], teams: Team[], drawEffects?: boolean) {
		super();
		bindMemberFunctions(this);

		this.colorsById = <any>colors.indexByProperty('colorId');

		this.field = null;
		this.currentStatus = null;

		this.changeTeams(teams);

		this.fieldConfig = new FieldConfig(FieldListener.CONFIG_FILE);

		jsdc.clock.connect((err) => {
			if (err) {
				Modal.error('Failed to connect', err);
				return;
			}

			jsdc.clock.on('game event', this.onGameEvent);
			jsdc.clock.join('game');

			if (drawEffects) {
				jsdc.clock.join('field');
				jsdc.clock.on('game over', this.onGameOver);
			}

			jsdc.clock.emit('game event', { event: 'get field' });
		});
	}

	public changeTeams(teams: Team[]) {
		this.teams = teams;
		this.teamsById = <any>teams.indexByProperty('teamId');
	}

	public getNeighbors(nodeId: number): number[] {
		var node = this.field.getNode(nodeId);
		return node.neighbors.map((neighbor) => neighbor.id);
	}

	public getFieldStatus(nodeId: number) {
		for (var i = 0; i < this.currentStatus.field.length; i++) {
			if (this.currentStatus.field[i].id === nodeId) {
				return this.currentStatus.field[i];
			}
		}
		return null;
	}

	public getTeamStatus(teamId: number) {
		for (var i = 0; i < this.currentStatus.teams.length; i++) {
			if (this.currentStatus.teams[i].team.teamId === teamId) {
				return this.currentStatus.teams[i];
			}
		}
		return null;
	}

	public rotateCW() {
		this.field.rotation -= 90;
	}

	public rotateCCW() {
		this.field.rotation += 90;
	}

	public update() {
		jsdc.clock.emit('game status');
	}

	private getColor(id: number) {
		return this.colorsById[id].name;
	}

	private getTeam(id: number) {
		return this.teamsById[id] || null;
	}

	private onGameEvent(data) {
		if (this.field === null && data.event !== 'field') {
			console.log('Received ' + data.event + ' event before field was initialized.');
			return;
		}

		switch (data.event) {
			case 'field':
				this.onGetField(data.data);
				jsdc.clock.emit('game status');
				break;

			case 'territory update':
				this.onTerritoryUpdate(data.data);
				break;

			case 'style change':
				this.onStyleUpdate(data.data);
				break;

			case 'ramp warning':
				this.onRampWarning(data.data);
				break;

			case 'clear ramp warning':
				this.onClearRampWarning(data.data);
				break;

			case 'territory warning':
				this.onTerritoryWarning(data.data);
				break;

			case 'territory scored':
				this.onTerritoryScored(data.data);
				break;
		}
	}

	private onGameStatus(status: GameStatus) {
		this.currentStatus = status;

		status.field.forEach(this.updateCell);
		this.updateTerritoryCounts();
		this._event('game status', status);
	}

	private onGetField(data: FieldStatus) {
		if (this.initialized) {
			return;
		}

		this.initialized = true;

		this.fieldConfig.onLoaded(() => {
			this.field = new FieldCanvas(this.fieldConfig);
			this.field.buildField(data.grid, data.styles);

			// Start receiving status updates only once the field is built
			jsdc.clock.on('game status', this.onGameStatus);

			this._event('load');
		});
	}

	private onGameOver() {
		// Add score effects for scored territories at the end of the game.
		this.currentStatus.field.forEach((node) => {
			if (node.id >= 10 && node.powered) {
				this.field.createEffect(node.id, GameoverFieldScoreNumber);
			}
		});
	}

	private cleanRampWarningEffects() {
		this.rampWarnings = this.rampWarnings.filter((warning) => !warning.effect.finished);
	}

	private onClearRampWarning(data: RampWarning) {
		this.rampWarnings.forEach((warning) => {
			if (warning.x === data.x && warning.y === data.y) {
				warning.effect.finished = true;
			}
		});
		this.cleanRampWarningEffects();
	}

	private onRampWarning(data: RampWarning) {
		this.cleanRampWarningEffects();
		data.effect = this.field.createEffect(data.x, data.y, RampSwitchWarning);
		this.rampWarnings.push(data);
	}

	private onStyleUpdate(data: StyleUpdate) {
		if (typeof data.id !== 'undefined') {
			this.field.setNodeIcon(data.id, data.style);
		} else {
			this.field.setNodeIcon(data.x, data.y, data.style);
		}
	}

	private onTerritoryUpdate(data: TerritoryStatus) {
		this.updateCell(data);
		for (var i = 0; i < this.currentStatus.field.length; i++) {
			if (this.currentStatus.field[i].id === data.id) {
				this.currentStatus.field[i] = data;
				break;
			}
		}

		this.updateTerritoryCounts();
		this._event('territory update', data);
	}

	private onTerritoryWarning(nodeId: number) {
		this.field.createEffect(nodeId, FieldScoreWarning);
	}

	private onTerritoryScored(nodeId: number) {
		this.field.createEffect(nodeId, FieldScoreNumber);
	}

	private updateCell(data: TerritoryStatus) {
		var team = this.getTeam(data.owner);
		var color: string;
		var state: NodeState;

		if (team !== null) {
			color = this.getColor(team.colorId);
			state = data.powered ? NodeState.Powered : NodeState.Unpowered;
		} else {
			color = 'neutral';
			state = NodeState.Neutral;
		}

		this.field.setNodeState(data.id, color, state);
	}

	private updateTerritoryCounts() {
		var bottomTerritories = {};
		var middleTerritories = {};
		var topTerritories = {};

		this.teams.forEach((team) => {
			bottomTerritories[team.teamId] = 0;
			middleTerritories[team.teamId] = 0;
			topTerritories[team.teamId] = 0;
		});

		this.currentStatus.field.forEach((node) => {
			if (node.owner) {
				if (node.id >= 10 && node.id < 60) {
					bottomTerritories[node.owner] += 1;
				} else if (node.id >= 60 && node.id < 70) {
					middleTerritories[node.owner] += 1;
				} else if (node.id >= 70) {
					topTerritories[node.owner] += 1;
				}
			}
		});

		this.teams.forEach((team) => {
			var status = this.getTeamStatus(team.teamId);
			status.bottomTerritories = bottomTerritories[team.teamId];
			status.middleTerritories = middleTerritories[team.teamId];
			status.topTerritories = topTerritories[team.teamId];
		});
	}

	addEventListener(type: 'game status', listener: CustomEventListener<GameStatus>);
	addEventListener(type: 'load', listener: EventListener);
	addEventListener(type: 'territory update', listener: CustomEventListener<TerritoryStatus>);
	addEventListener(type: string, listener: EventListener);
	addEventListener(type: string, listener: EventListener) {
		super.addEventListener(type, listener);
	}
}

class FieldTouchListener extends EventTargetBase {
	private _field: FieldCanvas;
	private _selectedNode: number;
	private _touchStartNode: number;

	constructor(field: FieldCanvas) {
		super();
		bindMemberFunctions(this);

		this._field = field;
		this._selectedNode = null;

		this._field.field.mousedown(this._onMouseDown);
		this._field.field.mouseup(this._onMouseUp);
		this._field.field.click(this._onClick);
	}

	private _onClick(e: JQueryMouseEventObject) {
		var clickedNode = this._getEventGridNode(e);
		if (clickedNode) {
			this._event('click', clickedNode);
		}
	}

	private _onMouseDown(e: JQueryMouseEventObject) {
		this._changeSelection(this._getEventGridNode(e));
	}

	private _onMouseUp(e: JQueryMouseEventObject) {
		this._changeSelection(null);
	}

	private _changeSelection(node: number) {
		if (this._selectedNode !== null) {
			this._field.highlightNode(this._selectedNode, false);
		}

		this._selectedNode = node;
		if (this._selectedNode !== null) {
			this._field.highlightNode(this._selectedNode, true);
		}
	}

	private _getEventGridNode(e: JQueryMouseEventObject): number {
		var point = this._field.canvasPositionToGrid(e.offsetX, e.offsetY);
		var node = this._field.getNode(point.x, point.y);
		if (node) {
			return node.id;
		} else {
			return null;
		}
	}

	addEventListener(type: 'click', listener: CustomEventListener<number>);
	addEventListener(type: string, listener: EventListener);
	addEventListener(type: string, listener: EventListener) {
		super.addEventListener(type, listener);
	}
}

class FieldCanvas {
	public static EFFECT_FRAMERATE = 15;

	layers: {
		field: HTMLCanvasElement;
		fieldEffects: HTMLCanvasElement;
		borders: HTMLCanvasElement;
		effects: HTMLCanvasElement;
	};

	public field: JQuery;
	public config: FieldConfig;

	public width: number;
	public height: number;

	public style: ColorStyle;
	public outerBorderWidth: number;
	public innerBorderWidth: number;
	public levelBorderWidth: number;
	public ringWidth: number;

	public get rotation() {
		return this._rotation;
	}

	public set rotation(newRotation: number) {
		this._rotation = newRotation;
		this.field.css('-webkit-transform', 'rotate(' + newRotation + 'deg)');
		this.field.css('transform', 'rotate(' + newRotation + 'deg)');
	}

	/* Map territory node ids to nodes */
	private nodesById: { [key: number]: FieldNode; } = {};

	/** List of border objects */
	private borders: FieldBorder[] = [];
	/** Grid mapping coordinates to territory nodes */
	private nodes: FieldNode[][] = [];
	/** Grid mapping coordinates to non-territory nodes with icons */
	private icons: FieldNode[][] = [];
	/** Flat list of territory nodes for quick iteration */
	private nodeList: FieldNode[] = [];
	/** Contains all out-of-bounds areas without icons */
	private emptyNode: FieldNode;

	private fieldBounds: Rect2d;
	private tileWidth: number;
	private tileHeight: number;
	private _rotation: number = 0;

	private repaintId: number;
	private lastRenderTime: number = null;
	private renderLoopRunning: boolean = false;
	private effects: FieldEffect[] = [];

	constructor(config: FieldConfig) {
		bindMemberFunctions(this);

		this.config = config;

		this.layers = {
			field: document.createElement('canvas'),
			fieldEffects: document.createElement('canvas'),
			borders: document.createElement('canvas'),
			effects: document.createElement('canvas'),
		};

		this.field = $('<div class="field">').append(
			this.layers.field,
			this.layers.fieldEffects,
			this.layers.borders,
			this.layers.effects
			);

		this.field.css('position', 'relative');
		this.field.find('canvas').css({
			position: 'absolute',
			top: '0',
			left: '0',
			right: '0',
			bottom: '0',
		});

		$(this.layers.field).css('z-index', '1');
		$(this.layers.fieldEffects).css('z-index', '2');
		$(this.layers.borders).css('z-index', '3');
		$(this.layers.effects).css('z-index', '4');

		this.style = config.colors['field'];

		this.outerBorderWidth = config.dimensions.outerBorderWidth;
		this.innerBorderWidth = config.dimensions.innerBorderWidth;
		this.levelBorderWidth = config.dimensions.levelBorderWidth;
		this.ringWidth = config.dimensions.ringWidth;

		this.addOutsideBorders();
		this.updateCoords();
		this.render(this.getNow());
	}

	public buildField(grid: number[][], styles: string[][]) {
		var emptyIconNodes: FieldNode[] = [];

		this.width = grid[0].length;
		this.height = grid.length;

		this.borders = [];
		this.emptyNode = new FieldNode(0, this.config);
		this.nodes = [];
		this.icons = [];
		this.nodeList = [];

		this.addOutsideBorders();

		for (var y = 0; y < this.height; y++) {
			this.nodes[y] = [];
			this.icons[y] = [];
		}

		for (var x = 0; x < this.width; x++) {
			for (var y = 0; y < this.height; y++) {
				var id = grid[y][x];
				var style = styles[y][x];
				var node: FieldNode = null;
				var icon: FieldNode = null;

				if (id !== 0) {
					// If a node with this ID exists, get it. Otherwise create it.
					node = this.getNode(id) || new FieldNode(id, this.config);

					if (style in this.config.icons) {
						node.setIcon(this.config.icons[style]);
					}

					this.addNode(node);

					// Create a new tile for this location
					var tile = new FieldTile(x, y, 1, 1);
					node.addTile(tile);
				} else {
					if (style in this.config.icons) {
						// Create a new node and tile to handle the icon
						var icon = new FieldNode(0, this.config);
						icon.setIcon(this.config.icons[style]);

						var tile = new FieldTile(x, y, 1, 1);
						icon.addTile(tile);

						emptyIconNodes.push(icon);
					} else {
						// No icon. Just add a tile to the empty node
						this.emptyNode.addTile(new FieldTile(x, y, 1, 1));
					}
				}

				this.nodes[y][x] = node;
				this.icons[y][x] = icon;

				// Check for neighbor to left
				if (x >= 1) {
					var leftNode = this.nodes[y][x - 1];
					var levelChange = this.getLevel(style) != this.getLevel(styles[y][x - 1]);
					if (leftNode !== node) {
						var width = (leftNode === null || node === null) ? this.outerBorderWidth :
							levelChange ? this.levelBorderWidth : this.innerBorderWidth;
						// add neighbor link and border
						this.borders.push(new FieldBorder(x, y, 1, width, BorderDirection.Down));
						if (node !== null && leftNode !== null) {
							node.addNeighbor(leftNode);
						}
					}
				}

				// Check for neighbor above
				if (y >= 1) {
					var topNode = this.nodes[y - 1][x];
					var levelChange = this.getLevel(style) != this.getLevel(styles[y - 1][x]);
					if (topNode !== node) {
						var width = (topNode === null || node === null) ? this.outerBorderWidth :
							levelChange ? this.levelBorderWidth : this.innerBorderWidth;
						// add neighbor link and border
						this.borders.push(new FieldBorder(x, y, 1, width, BorderDirection.Right));
						if (node !== null && topNode !== null) {
							node.addNeighbor(topNode);
						}
					}
				}
			}
		}

		// Collect all nodes into a list for fast iteration
		iterkeys(this.nodesById, (id) => {
			this.nodeList.push(this.nodesById[id]);
		});

		this.nodeList = this.nodeList.concat(emptyIconNodes);

		// Simplify borders and tiles as much as possible
		this.combineTiles();
		this.combineBorders();

		// Attach repaint events to all items
		this.forEachNode((node) => {
			node.onRepaintNeeded = this.repaint;
		});

		this.borders.forEach((border) => {
			border.onRepaintNeeded = this.repaint;
		});

		this.emptyNode.onRepaintNeeded = this.repaint;

		this.updateCoords();
		this.repaint();
	}

	public canvasPositionToGrid(x: number, y: number): Point2d {
		return {
			x: Math.floor((x - this.fieldBounds.x) / this.tileWidth),
			y: Math.floor((y - this.fieldBounds.y) / this.tileHeight),
		};
	}

	public createEffect(x: number, y: number, effectType: IFieldEffect): FieldEffect;
	public createEffect(nodeId: number, effectType: IFieldEffect): FieldEffect;
	public createEffect(x: number, y: any, effectType?: IFieldEffect): FieldEffect {
		var node: FieldNode;
		if (arguments.length === 3) {
			node = this.getNode(x, y);
		} else {
			node = this.getNode(arguments[0]);
			effectType = arguments[1];
		}

		if (node) {
			// Create the effect
			var effect = new effectType(node);
			effect.updateCoords(this);
			this.effects.push(effect);

			// Restart the render loop if it wasn't running
			if (!this.renderLoopRunning) {
				this.renderLoopRunning = true;
				window.requestAnimationFrame(this.renderEffects);
			}

			return effect;
		} else {
			throw new Error('Could not find node for effect');
		}
	}

	/** Converts grid coordinates to canvas pixel coordinates */
	public gridPositionToCanvas(x: number, y: number): Point2d {
		return {
			x: this.fieldBounds.x + (x * this.tileWidth),
			y: this.fieldBounds.y + (y * this.tileHeight),
		};
	}

	/** Returns canvas pixel coordinates for a border */
	public getBorderCoords(border: FieldBorder): Rect2d {
		var rect = null;
		var start = this.gridPositionToCanvas(border.x, border.y);
		var width = border.width;
		var halfWidth = width / 2;

		switch (border.dir) {
			case BorderDirection.Right:
				var end = this.gridPositionToCanvas(border.x + border.length, border.y);
				rect = {
					x: Math.round(start.x - halfWidth),
					y: Math.round(start.y - halfWidth),
					w: Math.round(end.x + halfWidth) - Math.round(start.x + halfWidth),
					h: Math.round(width),
				};
				break;

			case BorderDirection.Down:
				var end = this.gridPositionToCanvas(border.x, border.y + border.length);
				rect = {
					x: Math.round(start.x - halfWidth),
					y: Math.round(start.y - halfWidth),
					w: Math.round(width),
					h: Math.round(end.y + halfWidth) - Math.round(start.y - halfWidth),
				};
				break;

			default:
				console.error('Unknown border direction');
				break;
		}

		return rect;
	}

	public getNode(x: number, y: number): FieldNode;
	public getNode(id: number): FieldNode
	public getNode(x: number, y?: number): FieldNode {
		if (arguments.length === 1) {
			return this.nodesById[x] || null;
		} else {
			if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
				return null;
			} else {
				return this.nodes[y][x] || this.icons[y][x] || null;
			}
		}
	}

	/** Returns canvas pixel coordinates for the ring portion of an unpowered tile */
	public getRingCoords(tile: FieldTile, side: NodeRingSide): Rect2d {
		var start = this.gridPositionToCanvas(tile.x, tile.y);
		var end = this.gridPositionToCanvas(tile.x + tile.width, tile.y + tile.height);
		switch (side) {
			case NodeRingSide.Top:
				return {
					x: Math.round(start.x),
					y: Math.round(start.y),
					w: Math.round(end.x) - Math.round(start.x),
					h: this.ringWidth,
				};

			case NodeRingSide.Bottom:
				return {
					x: Math.round(start.x),
					y: Math.round(end.y) - this.ringWidth,
					w: Math.round(end.x) - Math.round(start.x),
					h: this.ringWidth,
				};

			case NodeRingSide.Left:
				return {
					x: Math.round(start.x),
					y: Math.round(start.y),
					w: this.ringWidth,
					h: Math.round(end.y) - Math.round(start.y),
				};

			case NodeRingSide.Right:
				return {
					x: Math.round(end.x) - this.ringWidth,
					y: Math.round(start.y),
					w: this.ringWidth,
					h: Math.round(end.y) - Math.round(start.y),
				};

			case NodeRingSide.TopLeft:
				return {
					x: Math.round(start.x),
					y: Math.round(start.y),
					w: this.ringWidth,
					h: this.ringWidth,
				};

			case NodeRingSide.TopRight:
				return {
					x: Math.round(end.x) - this.ringWidth,
					y: Math.round(start.y),
					w: this.ringWidth,
					h: this.ringWidth,
				};

			case NodeRingSide.BottomLeft:
				return {
					x: Math.round(start.x),
					y: Math.round(end.y) - this.ringWidth,
					w: this.ringWidth,
					h: this.ringWidth,
				};

			case NodeRingSide.BottomRight:
				return {
					x: Math.round(end.x) - this.ringWidth,
					y: Math.round(end.y) - this.ringWidth,
					w: this.ringWidth,
					h: this.ringWidth,
				};

			default:
				return null;
		}
	}

	/** Returns canvas pixel coordinates for a tile */
	public getTileCoords(tile: FieldTile): Rect2d {
		var start = this.gridPositionToCanvas(tile.x, tile.y);
		var end = this.gridPositionToCanvas(tile.x + tile.width, tile.y + tile.height);
		return {
			x: Math.round(start.x),
			y: Math.round(start.y),
			w: Math.round(end.x) - Math.round(start.x),
			h: Math.round(end.y) - Math.round(start.y),
		};
	}

	public getTileSize(): Point2d {
		return {
			x: this.tileWidth,
			y: this.tileHeight,
		};
	}

	public highlightNode(x: number, y: number, highlight: boolean);
	public highlightNode(nodeId: number, highlight: boolean);
	public highlightNode(x: number, y: any, highlight?: boolean) {
		var node: FieldNode;
		if (arguments.length === 3) {
			node = this.getNode(x, y);
		} else {
			node = this.getNode(arguments[0]);
			highlight = arguments[1];
		}

		if (node) {
			node.highlight = highlight;
		}
	}

	/** Renders the field to its canvas */
	public repaint() {
		if (!this.repaintId) {
			this.repaintId = window.requestAnimationFrame(this.render);
		}
	}

	public setNodeIcon(x: number, y: number, iconName: string);
	public setNodeIcon(nodeId: number, iconName: string);
	public setNodeIcon(x: number, y: any, iconName?: string) {
		var node: FieldNode;
		if (arguments.length === 3) {
			node = this.getNode(x, y);
		} else {
			node = this.getNode(arguments[0]);
			iconName = arguments[1];
		}

		node.setIcon(this.config.icons[iconName]);
		node.updateCoords(this);
	}

	public setNodeState(nodeId: number, color: string, state: NodeState) {
		var node = this.getNode(nodeId);
		node.style = this.config.colors[color];
		node.state = state;
	}

	public setSize(width: number, height: number) {
		this.field.css({
			width: width + 'px',
			height: height + 'px',
		});

		for (var key in this.layers) {
			if (this.layers.hasOwnProperty(key)) {
				this.layers[key].width = width;
				this.layers[key].height = height;
			}
		}
		this.updateCoords();
	}

	private addNode(node: FieldNode) {
		this.nodesById[node.id] = node;
	}

	/** Adds top, left, right and bottom borders for the outside of the field */
	private addOutsideBorders() {
		var top = new FieldBorder(0, 0, this.width, this.outerBorderWidth, BorderDirection.Right);
		var left = new FieldBorder(0, 0, this.height, this.outerBorderWidth, BorderDirection.Down);
		var right = new FieldBorder(this.width, 0, this.height, this.outerBorderWidth, BorderDirection.Down);
		var bottom = new FieldBorder(0, this.height, this.width, this.outerBorderWidth, BorderDirection.Right);

		this.borders = this.borders.concat([top, left, right, bottom]);
	}

	private combineBorders() {
		for (var i = 0; i < this.borders.length; i++) {
			var currentBorder = this.borders[i];
			for (var j = i + 1; j < this.borders.length; j++) {
				var testBorder = this.borders[j];
				var newBorder = null;

				// borders must be in same direction to merge
				if (currentBorder.dir != testBorder.dir) {
					break;
				}

				// borders must have same width to merge
				if (currentBorder.width != testBorder.width) {
					break;
				}

				switch (currentBorder.dir) {
					case BorderDirection.Right:
						// borders must be at same vertical position
						if (currentBorder.y === testBorder.y) {
							var left = (currentBorder.x < testBorder.x) ? currentBorder : testBorder;
							var right = (left === currentBorder) ? testBorder : currentBorder;
							// do borders overlap?
							if (left.x + left.length >= right.x) {
								var newLength = (right.x - left.x) + right.length;
								newBorder = new FieldBorder(left.x, left.y, newLength, left.width, left.dir);
							}
						}
						break;

					case BorderDirection.Down:
						// borders must be at same horizontal position
						if (currentBorder.x === testBorder.x) {
							var top = (currentBorder.y < testBorder.y) ? currentBorder : testBorder;
							var bottom = (top === currentBorder) ? testBorder : currentBorder;
							// do borders overlap?
							if (top.y + top.length >= bottom.y) {
								var newLength = (bottom.y - top.y) + bottom.length;
								newBorder = new FieldBorder(top.x, top.y, newLength, top.width, top.dir);
							}
						}
						break;
				}

				if (newBorder !== null) {
					// replace current border with new border
					this.borders[i] = newBorder;

					// remove merged border
					this.borders.splice(j, 1);
					j -= 1;
				}
			}
		}
	}

	private combineTiles() {
		this.forEachNode((node) => {
			node.combineTiles();
		});
	}

	private forEachNode(callback: (node: FieldNode) => any) {
		this.nodeList.forEach(callback);
	}

	private getLevel(style: string) {
		switch (style) {
			case '+': return 3;
			case '-': return 2;
			default: return 1;
		}
	}

	private getNow(): number {
		return window.performance ? (window.performance.now() + window.performance.timing.navigationStart) : Date.now();
	}

	private render(now: number) {
		var field = this.layers.field.getContext('2d');
		var borders = this.layers.borders.getContext('2d')
		var elapsed;

		if (this.lastRenderTime === null) {
			this.lastRenderTime = now;
		}

		elapsed = now - this.lastRenderTime;

		// Background fill
		field.clearRect(0, 0, field.canvas.width, field.canvas.height);
		field.fillStyle = this.style.bg;
		field.fillRect(this.fieldBounds.x, this.fieldBounds.y, this.fieldBounds.w, this.fieldBounds.h);

		// Render tiles
		if (this.emptyNode) {
			this.emptyNode.render(this, field);
		}

		this.forEachNode((node) => {
			node.render(this, field);
		});

		// Render borders
		borders.clearRect(0, 0, borders.canvas.width, borders.canvas.height);
		borders.fillStyle = this.style.fg;
		this.borders.forEach((border) => {
			border.render(this, borders);
		});

		// Done repainting. Clear the requestAnimationFrame ID so that we can paint again.
		this.repaintId = null;
	}

	private renderEffects(now: number) {
		var ctx = this.layers.effects.getContext('2d');

		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		// Render effects
		var deleteEffects = false;
		this.effects.forEach((effect) => {
			effect.render(this, ctx)
			deleteEffects = deleteEffects || effect.finished;
		});

		// Get rid of any effects which have finished
		if (deleteEffects) {
			this.effects = this.effects.filter((effect) => !effect.finished);
		}

		if (this.effects.length === 0) {
			// No more effects. Stop the render loop.
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			this.renderLoopRunning = false;
		} else {
			// Still have effects to draw. Keep the render loop going.
			setTimeout(() => {
				window.requestAnimationFrame(this.renderEffects)
			}, 1 / FieldCanvas.EFFECT_FRAMERATE);
		}
	}

	private updateCoords() {
		this.fieldBounds = {
			x: this.outerBorderWidth / 2,
			y: this.outerBorderWidth / 2,
			w: this.layers.field.width - this.outerBorderWidth,
			h: this.layers.field.height - this.outerBorderWidth,
		};

		this.tileWidth = this.fieldBounds.w / this.width;
		this.tileHeight = this.fieldBounds.h / this.height;

		if (this.emptyNode) {
			this.emptyNode.updateCoords(this);
		}

		this.forEachNode((node) => {
			node.updateCoords(this);
		});

		this.borders.forEach((border) => {
			border.updateCoords(this);
		});

		this.effects.forEach((effect) => {
			effect.updateCoords(this);
		});
	}
}

class FieldConfig {
	public dimensions = {
		outerBorderWidth: null,
		innerBorderWidth: null,
		levelBorderWidth: null,
		ringWidth: null,
	};
	public colors: { [key: string]: ColorStyle; } = {};
	public icons: { [key: string]: IconDefinition; } = {};

	get loaded() {
		return this._loaded;
	}

	private _loaded = false;
	private _callbacks = [];

	constructor(file: string) {
		$.getJSON(file, (data) => {
			this._loaded = true;
			this.dimensions = data.dimensions;
			this.colors = data.colors;
			this.icons = data.icons;

			this._callbacks.forEach((callback) => {
				callback();
			});
			this._callbacks = [];
		}).fail((e) => {
				console.error(arguments);
			});
	}

	public onLoaded(callback: Function) {
		if (this.loaded) {
			callback();
		} else {
			this._callbacks.push(callback);
		}
	}
}

class FieldNode implements FieldObject {
	tiles: FieldTile[] = [];
	neighbors: FieldNode[] = [];

	onRepaintNeeded: Function = () => undefined;

	get id() {
		return this._id;
	}

	get icon() {
		return this._icon;
	}
	set icon(newIcon: FieldIcon) {
		this._icon = newIcon;
		if (this.icon) {
			this.icon.onRepaintNeeded = () => {
				this.onRepaintNeeded();
			}
		}
		this.onRepaintNeeded();
	}

	get highlight() {
		return this._highlighted;
	}

	set highlight(newHighlight: boolean) {
		var oldHighlight = this._highlighted;
		this._highlighted = newHighlight;

		if (newHighlight != oldHighlight) {
			this.onRepaintNeeded();
		}
	}

	get state() {
		return this._state;
	}
	set state(newState: NodeState) {
		this._state = newState;
		this.onRepaintNeeded();
	}

	get style() {
		return this._style;
	}
	set style(newStyle: ColorStyle) {
		this._style = newStyle;
		this.onRepaintNeeded();
	}

	private _id: number;
	private _color: string;
	private _icon: FieldIcon = null;
	private _highlighted: boolean = false;
	private _state: NodeState = NodeState.Neutral;
	private _style: ColorStyle;

	constructor(id: number, config: FieldConfig) {
		this._id = id;

		if (id === 0) {
			this.style = config.colors['empty'];
		} else {
			this.style = config.colors['neutral'];
		}

		this.state = NodeState.Neutral;
	}

	public addNeighbor(node: FieldNode) {
		if (this.neighbors.indexOf(node) < 0) {
			this.neighbors.push(node);
			node.addNeighbor(this);
		}
	}

	public addTile(tile: FieldTile) {
		tile.node = this;
		this.tiles.push(tile);

		tile.onRepaintNeeded = () => {
			this.onRepaintNeeded();
		};
	}

	public combineTiles() {
		// We assume that all tiles are 1x1 at this point

		// find rectangle encompassing all tiles
		var bounds = {
			top: Infinity,
			left: Infinity,
			right: 0,
			bottom: 0,
		};

		this.tiles.forEach((tile) => {
			if (tile.x < bounds.left) {
				bounds.left = tile.x;
			}
			if (tile.x > bounds.right) {
				bounds.right = tile.x;
			}
			if (tile.y < bounds.top) {
				bounds.top = tile.y;
			}
			if (tile.y > bounds.bottom) {
				bounds.bottom = tile.y;
			}
		});

		// check that rectangle is filled completely with tiles
		for (var x = bounds.left; x <= bounds.right; x++) {
			for (var y = bounds.top; y <= bounds.bottom; y++) {
				var found = false;
				for (var i = 0; i < this.tiles.length; i++) {
					var tile = this.tiles[i];
					if (tile.x === x && tile.y === y) {
						found = true;
						break;
					}
				}

				if (!found) {
					// if we don't have a tile in this position, don't combine anything
					return;
				}
			}
		}

		// combine all tiles into one
		var newTile = new FieldTile(bounds.left, bounds.top, bounds.right - bounds.left + 1, bounds.bottom - bounds.top + 1);
		this.tiles = [];
		this.addTile(newTile);

		this.onRepaintNeeded();
	}

	public getIconLocation(): Point2d {
		var point;
		if (this.tiles.length == 1) {
			// use centroid of single tile
			var tile = this.tiles[0];
			point = {
				x: tile.x + tile.width / 2,
				y: tile.y + tile.height / 2,
			}
		} else {
			// find center of mass of tiles
			var x = 0;
			var y = 0;
			var inTile = null;
			var closestTile = null;
			var closestDist = Infinity;

			this.tiles.forEach((tile) => {
				x += tile.x + tile.width / 2;
				y += tile.y + tile.height / 2;
			});

			x /= this.tiles.length;
			y /= this.tiles.length;

			// find the tile containing this point
			for (var i = 0; i < this.tiles.length; i++) {
				var tile = this.tiles[i];
				if (x >= tile.x && x <= tile.x + tile.width &&
					y >= tile.y && y <= tile.y + tile.height) {
					inTile = tile;
					break;
				}
			}

			// if no tile contains the point, find the nearest one
			if (inTile === null) {
				this.tiles.forEach((tile) => {
					var dx = (tile.x + tile.width) - x;
					var dy = (tile.y + tile.height) - y;
					var dist = Math.sqrt(dx * dx + dy * dy);

					if (dist < closestDist) {
						closestTile = tile;
						closestDist = dist;
					}
				});

				inTile = closestTile;
			}

			point = {
				x: inTile.x + inTile.width / 2,
				y: inTile.y + inTile.height / 2,
			};
		}

		return point;
	}

	public render(field: FieldCanvas, context: CanvasRenderingContext2D): void {
		this.tiles.forEach((tile) => {
			tile.render(field, context);
		});

		if (this.icon !== null) {
			this.icon.render(field, context);
		}
	}

	public setIcon(icon: IconDefinition) {
		if (icon !== null) {
			this.icon = new FieldIcon(this, icon);
		} else {
			this.icon = null;
		}
	}

	public updateCoords(field: FieldCanvas) {
		this.tiles.forEach((tile) => {
			tile.updateCoords(field);
		});

		if (this.icon !== null) {
			this.icon.updateCoords(field);
		}
	}
}

class FieldTile implements FieldObject {
	node: FieldNode;

	x: number;
	y: number;
	width: number;
	height: number;

	onRepaintNeeded: Function = () => undefined;

	private canvasCoords: Rect2d;
	private ringCoords: Rect2d[];

	constructor(x: number, y: number, width: number, height: number) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}

	public render(field: FieldCanvas, context: CanvasRenderingContext2D): void {
		if (this.node.highlight && 'select' in this.node.style) {
			context.fillStyle = this.node.style.select;
		} else {
			context.fillStyle = this.node.style.bg;
		}

		if (this.node.state === NodeState.Powered || this.node.state === NodeState.Neutral) {
			// draw filled rectangle
			context.fillRect(
				this.canvasCoords.x,
				this.canvasCoords.y,
				this.canvasCoords.w,
				this.canvasCoords.h
				);
		} else if (this.node.state === NodeState.Unpowered) {
			// draw border ring
			this.ringCoords.forEach((rect) => {
				context.fillRect(rect.x, rect.y, rect.w, rect.h);
			});
		}
	}

	public updateCoords(field: FieldCanvas): void {
		this.canvasCoords = field.getTileCoords(this);
		this.ringCoords = [];

		var isRect = this.node.tiles.length === 1;

		var same = (x: number, y: number) => field.getNode(x, y) === this.node

		var top = !same(this.x, this.y - 1);
		var bottom = !same(this.x, this.y + 1);
		var left = !same(this.x - 1, this.y);
		var right = !same(this.x + 1, this.y);

		// Add full edge borders if this node is rectangular or this tile is
		// on the edge of the node.
		if (isRect || top) {
			this.ringCoords.push(field.getRingCoords(this, NodeRingSide.Top));
		}
		if (isRect || bottom) {
			this.ringCoords.push(field.getRingCoords(this, NodeRingSide.Bottom));
		}
		if (isRect || left) {
			this.ringCoords.push(field.getRingCoords(this, NodeRingSide.Left));
		}
		if (isRect || right) {
			this.ringCoords.push(field.getRingCoords(this, NodeRingSide.Right));
		}

		if (!isRect) {
			// Add borders in corners if the two adjacent tiles are part of this node,
			// but the tile diagonally to the corner is not.
			if (!top && !left && !same(this.x - 1, this.y - 1)) {
				this.ringCoords.push(field.getRingCoords(this, NodeRingSide.TopLeft));
			}
			if (!top && !right && !same(this.x + 1, this.y - 1)) {
				this.ringCoords.push(field.getRingCoords(this, NodeRingSide.TopRight));
			}
			if (!bottom && !left && !same(this.x - 1, this.y + 1)) {
				this.ringCoords.push(field.getRingCoords(this, NodeRingSide.BottomLeft));
			}
			if (!bottom && !right && !same(this.x + 1, this.y + 1)) {
				this.ringCoords.push(field.getRingCoords(this, NodeRingSide.BottomRight));
			}
		}
	}
}

class FieldBorder implements FieldObject {
	x: number;
	y: number;
	dir: BorderDirection;
	length: number;
	width: number;

	onRepaintNeeded: Function = () => undefined;

	private canvasCoords: Rect2d;

	constructor(x: number, y: number, length: number, width: number, dir: BorderDirection) {
		this.x = x;
		this.y = y;
		this.dir = dir;
		this.width = width;
		this.length = length;
	}

	public render(field: FieldCanvas, context: CanvasRenderingContext2D): void {
		context.fillRect(
			this.canvasCoords.x,
			this.canvasCoords.y,
			this.canvasCoords.w,
			this.canvasCoords.h
			);
	}

	public updateCoords(field: FieldCanvas): void {
		this.canvasCoords = field.getBorderCoords(this);
	}
}

class FieldIcon implements FieldObject {
	node: FieldNode;
	icon: IconDefinition;
	onRepaintNeeded: Function = () => undefined;

	private gridCoords: Point2d;
	private canvasCoords: Point2d;
	private tileSize: number;

	constructor(node: FieldNode, icon: IconDefinition) {
		this.node = node;
		this.icon = icon;
	}

	public render(field: FieldCanvas, context: CanvasRenderingContext2D): void {
		context.fillStyle = this.node.style.fg;
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.font = (this.tileSize * this.icon.size) + 'px Ionicons';
		context.fillText(this.icon.character, this.canvasCoords.x, this.canvasCoords.y);
	}

	public updateCoords(field: FieldCanvas): void {
		this.gridCoords = this.node.getIconLocation();
		this.canvasCoords = field.gridPositionToCanvas(this.gridCoords.x, this.gridCoords.y);

		var tileSize = field.getTileSize();
		this.tileSize = Math.min(tileSize.x, tileSize.y);
	}
}

interface IFieldEffect {
	new (node: FieldNode): FieldEffect;
}

class FieldEffect implements FieldObject {
	public finished = false;
	public node: FieldNode;
	public gridCoords: Point2d;
	public canvasCoords: Point2d;
	public tileSize: number;

	public onRepaintNeeded: Function = () => undefined;

	get secondsElapsed() {
		return (Date.now() - this.creationTime) / 1000;
	}

	private creationTime: number;

	constructor(node: FieldNode) {
		this.node = node;
		this.creationTime = Date.now();
	}

	public render(field: FieldCanvas, context: CanvasRenderingContext2D): void {
	}

	public updateCoords(field: FieldCanvas): void {
		this.gridCoords = this.node.getIconLocation();
		this.canvasCoords = field.gridPositionToCanvas(this.gridCoords.x, this.gridCoords.y);

		var tileSize = field.getTileSize();
		this.tileSize = Math.min(tileSize.x, tileSize.y);
	}
}

class TimerEffect extends FieldEffect {
	static START_ANGLE = Math.PI * 1.5;
	static CIRCLE_WIDTH = 2;
	static CIRCLE_OUTLINE_WIDTH = 5;

	private duration: number;
	private circleScale: number;
	private textScale: number;

	private textSize: number;
	private textOutline: number;
	private circleSize: number;

	constructor(node: FieldNode, duration: number, textScale: number, circleScale: number) {
		super(node);
		this.duration = duration;
		this.circleScale = circleScale;
		this.textScale = textScale;
	}

	public render(field: FieldCanvas, context: CanvasRenderingContext2D): void {
		var elapsed = this.secondsElapsed;
		var secondsRemaining = Math.ceil(this.duration - elapsed);

		if (secondsRemaining <= 0) {
			this.finished = true;
			return;
		}

		var timeFraction = elapsed % 1;
		var endAngle = TimerEffect.START_ANGLE - (timeFraction * Math.PI * 2);

		// blank area around ring
		context.globalAlpha = 1;
		context.fillStyle = this.node.style.bg;
		context.beginPath();
		context.arc(this.canvasCoords.x, this.canvasCoords.y, this.circleSize + TimerEffect.CIRCLE_OUTLINE_WIDTH, 0, Math.PI * 2, true);
		context.fill();

		// render ring
		context.strokeStyle = this.node.style.fg;
		context.lineWidth = TimerEffect.CIRCLE_WIDTH;

		context.globalAlpha = 0.3;
		context.beginPath();
		context.arc(this.canvasCoords.x, this.canvasCoords.y, this.circleSize, TimerEffect.START_ANGLE, endAngle, true);
		context.stroke();

		context.globalAlpha = 0.8;
		context.beginPath();
		context.arc(this.canvasCoords.x, this.canvasCoords.y, this.circleSize, TimerEffect.START_ANGLE, endAngle, false);
		context.stroke();

		// render text
		context.globalAlpha = 1;
		context.fillStyle = this.node.style.fg;
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.font = this.textSize + 'px "Open Sans"';
		context.fillText(secondsRemaining.toString(), this.canvasCoords.x, this.canvasCoords.y);
	}

	public updateCoords(field: FieldCanvas): void {
		super.updateCoords(field);

		this.textSize = Math.round(this.tileSize * this.textScale);
		this.circleSize = Math.round(this.tileSize * this.circleScale / 2);
	}
}

class FieldScoreWarning extends TimerEffect {
	static WARNING_TIME = 3;
	static CIRCLE_SCALE = 0.7;
	static TEXT_SCALE = 0.55;

	constructor(node: FieldNode) {
		super(node, FieldScoreWarning.WARNING_TIME, FieldScoreWarning.TEXT_SCALE, FieldScoreWarning.CIRCLE_SCALE);
	}
}

class RampSwitchWarning extends TimerEffect {
	static WARNING_TIME = 15;
	static CIRCLE_SCALE = 0.7;
	static TEXT_SCALE = 0.45;

	constructor(node: FieldNode) {
		super(node, RampSwitchWarning.WARNING_TIME, RampSwitchWarning.TEXT_SCALE, RampSwitchWarning.CIRCLE_SCALE);
	}
}

interface FadingTextEffectConfig {
	duration: number;
	textScale: number;
	outlineScale: number;
	xShift: number;
	yShift: number;
}

class FadingTextEffect extends FieldEffect {
	private duration: number;
	private textScale: number;
	private outlineScale: number;
	private xShift: number;
	private yShift: number;
	private text: string;

	constructor(node: FieldNode, config: FadingTextEffectConfig, text: string) {
		super(node);
		this.duration = config.duration;
		this.textScale = config.textScale;
		this.outlineScale = config.outlineScale;
		this.xShift = config.xShift;
		this.yShift = config.yShift;
		this.text = text;
	}

	private textSize: number;
	private textOutline: number;
	private xShiftDistance: number;
	private yShiftDistance: number;

	public render(field: FieldCanvas, context: CanvasRenderingContext2D): void {
		var elapsed = this.secondsElapsed;

		if (elapsed > this.duration) {
			this.finished = true;
			return;
		}

		var xShift = this.easeInQuad(elapsed, 0, this.xShiftDistance, this.duration);
		var yShift = this.easeInQuad(elapsed, 0, this.yShiftDistance, this.duration);

		context.globalAlpha = this.easeInQuad(elapsed, 1, -1, this.duration);
		context.fillStyle = this.node.style.fg;
		context.strokeStyle = this.node.style.bg;
		context.lineWidth = this.textOutline;
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.font = this.textSize + 'px "Open Sans"';

		context.strokeText(this.text, this.canvasCoords.x + xShift, this.canvasCoords.y + yShift);
		context.fillText(this.text, this.canvasCoords.x + xShift, this.canvasCoords.y + yShift);
	}

	public updateCoords(field: FieldCanvas): void {
		super.updateCoords(field);

		this.textSize = Math.round(this.tileSize * this.textScale);
		this.textOutline = Math.round(this.tileSize * this.outlineScale);
		this.xShiftDistance = Math.round(this.tileSize * this.xShift);
		this.yShiftDistance = Math.round(this.tileSize * this.yShift)
	}

	private easeInQuad(time: number, start: number, change: number, duration: number) {
		time /= duration;
		return change * time * time + start;
	}
}

class FieldScoreNumber extends FadingTextEffect {
	static CONFIG: FadingTextEffectConfig = {
		duration: 3,
		textScale: 0.55,
		outlineScale: 0.1,
		xShift: 0,
		yShift: -0.5,
	};

	constructor(node: FieldNode) {
		var text;

		if (node.id < 60) {
			text = '+1';
		} else if (node.id < 70) {
			text = '+3';
		} else {
			text = '+5';
		}

		super(node, FieldScoreNumber.CONFIG, text);
	}
}

class GameoverFieldScoreNumber extends FadingTextEffect {
	static CONFIG: FadingTextEffectConfig = {
		duration: 10,
		textScale: 0.5,
		outlineScale: 0.1,
		xShift: 0,
		yShift: 0,
	};

	constructor(node: FieldNode) {
		var text;

		if (node.id < 60) {
			text = '+10';
		} else if (node.id < 70) {
			text = '+30';
		} else {
			text = '+50';
		}

		super(node, GameoverFieldScoreNumber.CONFIG, text);
	}
}

/* == Polyfills == */

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
// MIT license

(function () {
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
		|| window[vendors[x] + 'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame)
		window.requestAnimationFrame = function (callback) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function () { callback(currTime + timeToCall); },
				timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};

	if (!window.cancelAnimationFrame)
		window.cancelAnimationFrame = function (id) {
			clearTimeout(id);
		};
} ());