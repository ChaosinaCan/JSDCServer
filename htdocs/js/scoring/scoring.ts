﻿/// <reference path="../admin/base.ts" />
/// <reference path="../admin/field-renderer.ts" />

module scoring {
	// Public Variables
	export var colors: Color[];
	export var actions: Action[];
	export var fouls: Foul[];

	export var team: Team;
	export var match: Match;

	export var colorsById: ColorMap;
	export var actionsById: ActionMap;
	export var foulsById: FoulMap;

	export var field: FieldListener;
	export var touchListener: FieldTouchListener;

	export var actionIds = {
		action: 1,
		takeTerritory: 2,
	}

	// Public Methods
	export function init(): void {
		colors = jsdc.color.parse(colors);
		team = jsdc.team.parseOne(team);
		match = jsdc.match.parseOne(match);

		colorsById = <any>colors.indexByProperty('colorId');
		actionsById = <any>actions.indexByProperty('actionId');
		foulsById = <any>fouls.indexByProperty('foulId');

		jsdc.clock.connect(onconnect);

		scoring.field = new FieldListener(scoring.colors, scoring.match.teams, false);
		touchListener = null;

		scoring.field.addEventListener('game status', (e) => {
			scoring.onGameStatus(e.detail);
		});
		scoring.field.addEventListener('load', () => {
			touchListener = new FieldTouchListener(scoring.field.field);
			touchListener.addEventListener('click', (e) => {
				territoryDialog(e.detail);
			});

			var container = $('#field');
			var size = container.width();

			scoring.field.field.setSize(size, size);
			scoring.field.field.repaint();
			container.append(scoring.field.field.field);
			// so many fields!
		});

		$('#action').click($.single(actionHandler));
		$('#ramp').click($.single(rampHandler));
		$('#foul-personal').click(foulDialog.bind(null, 1));
		$('#foul-technical').click(foulDialog.bind(null, 2));
		$('#foul-flagrant').click(foulDialog.bind(null, 3));
		$('#emergency').click(confirmEmergency);
		$('#disabled').click(confirmDisabled);

		$(window).resize(() => {
			var size = $('#field').width();
			field.field.setSize(size, size);
			field.field.repaint();
		});

		touch.init();
	}

	export function onconnect(error: string) {
		if (error) {
			Modal.error('Failed to connect', 'Could not connect to the clock server. Please check that it is running.');
			return;
		}

		var clock = jsdc.clock;
		clock.join('game', 'scoring');
		clock.on('match changed', scoring.onMatchChange);
		clock.on('game status', onGameStatus);
		clock.on('game event', onGameEvent);
	}

	export function onMatchChange(): void {
		Modal.confirm('Match changed',
			'The current match has changed and this scoring page is no longer valid. ' +
			'Would you like to load the new match?',
			{ yes: 'Load new match', no: 'Cancel' },
			(result) => {
				if (result) {
					location.assign('/scoring/teamselect/');
				}
			});
	}

	export function onGameStatus(status: GameStatus): void {
	}

	export function onGameEvent(event): void {
		switch (event.event) {
		}
	}

	export function getColor(id: number) {
		return scoring.colorsById[id.toString()] || null;
	}

	export function getColorName(id: number) {
		var color = getColor(id);
		return color ? color.name : 'unknown';
	}

	export function getTeam(id: number) {
		for (var i = 0; i < scoring.match.teams.length; i++) {
			if (scoring.match.teams[i].teamId === id) {
				return scoring.match.teams[i];
			}
		}
		return null;
	}

	export function getAction(id: number) {
		return scoring.actionsById[id.toString()] || null;
	}

	export function getFoul(id: number) {
		return scoring.foulsById[id.toString()] || null;
	}

	export function getFieldStatus(territoryId: number) {
		var statuses = scoring.field.currentStatus.field;
		for (var i = 0; i < statuses.length; i++) {
			if (statuses[i].id === territoryId) {
				return statuses[i];
			}
		}
		return null;
	}

	export function canTakeTerritory(territoryId: number) {
		var status = getFieldStatus(territoryId);

		// Can't take if this isn't capturable
		if (status === null || status.id < 10) {
			return false;
		}

		// Can't take if already owned by us
		if (status.owner === scoring.team.teamId) {
			return false;
		}

		// Can take if a neighboring territory is powered by us
		var neighbors = scoring.field.getNeighbors(territoryId);
		for (var i = 0; i < neighbors.length; i++) {
			var status = getFieldStatus(neighbors[i]);
			if (status.owner === scoring.team.teamId && status.powered) {
				return true;
			}
		}
		return false;
	}

	export function sendAction(fromTeam: number, callback: (err: APIError) => any) {
		jsdc.score.create({
			match: scoring.match.matchId,
			action: scoring.actionIds.action,
			from: fromTeam,
			on: 0,
		}, callback);
	}

	export function sendFoul(foulId: number, fromTeam: number, onTeam: number, callback: (err: APIError) => any) {
		jsdc.score.create({
			match: scoring.match.matchId,
			foul: foulId,
			from: fromTeam,
			on: onTeam,
			disqualified: foulId === 3 // disqualify on flagrant fouls
		}, callback);
	}

	export function takeTerritory(territoryId: number) {
		jsdc.clock.emit('game event', {
			event: 'take territory',
			data: {
				team: scoring.team.teamId,
				territory: territoryId,
			}
		});
	}

	export function toggleRamp() {
		jsdc.clock.emit('game event', {
			event: 'toggle ramp',
			data: {
				team: scoring.team.teamId
			}
		});
	}

	export function rotateFieldCW(): void {
		scoring.field.rotateCW();
	}

	export function rotateFieldCCW(): void {
		scoring.field.rotateCCW();
	}

	// Private Methods}
	function confirmEmergency(): void {
		Modal.confirm('Emergency stop',
			'Are you sure you want to perform an emergency stop? This will pause the match and sound an alarm.',
			{ yes: 'Emergency stop', no: 'Cancel' },
			(result) => {
				if (result) {
					jsdc.clock.emit('emergency');
				}
			});
	}

	function confirmDisabled(): void {
		Modal.confirm('Disable robot',
			'Are you sure you want to declare your robot disabled?',
			{ yes: 'Disable robot', no: 'Cancel' },
			(result) => {
				if (result) {
					jsdc.score.create({
						match: scoring.match.matchId,
						from: scoring.team.teamId,
						on: 0,
						action: 0,
						foul: 0,
						disabled: true,
					}, Modal.makeErrorHandler('Failed to disable robot'));
				}
			});
	}

	function actionHandler(e: SingleEventObject) {
		Modal.dialog({
			title: 'Action',
			className: 'action',
			buttons: [],
			body: 'Sending...',
		});

		sendAction(scoring.team.teamId, (err) => {
			if (err) {
				Modal.apiError(err, 'Failed to send action');
			}
			$.modal.close();
			e.complete();
		});
	}

	function rampHandler(e: SingleEventObject) {
		Modal.dialog({
			title: 'Ramp',
			className: 'action',
			buttons: [],
			body: 'Toggling ramp...',
		});

		try {
			toggleRamp();
			setTimeout(() => {
				$.modal.close();
				e.complete();
			}, 2000);
		} catch (e) {
			Modal.error('Failed', e.toString());
			e.complete();
		}
	}

	function foulDialog(foulId: number): void {
		var body: JQuery = $('<ul class=colorselect>').append(
			scoring.match.teams.filter((team) => team.teamId !== scoring.team.teamId)
				.concat([{
					teamId: 0,
					colorId: 0,
					name: 'Unknown',
					imageName: null,
					university: null,
				}]).map((team) => {
					return $('<li>').append(
						$('<a>').addClass(getColorName(team.colorId))
							.text(team.name)
							.click(() => {
								// display a message while the foul is being sent
								body.replaceWith(
									$('<p>').text('Sending...')
									);
								sendFoul(foulId, scoring.team.teamId, team.teamId, (err) => {
									if (err) {
										Modal.apiError(err, 'Failed to send foul');
									}
									$.modal.close();
								});
							})
						)
				}
				));

		Modal.dialog({
			title: getFoul(foulId).name.capitalize() + ' foul against',
			className: 'foul',
			buttons: Modal.CancelButton,
			body: body,
			options: Modal.CancellableOptions(),
		});
	}

	function territoryDialog(territoryId: number): void {
		var canTake = canTakeTerritory(territoryId);

		if (!canTake) {
			return;
		}

		var body = $('<ul class=actionselect>');

		if (canTake) {
			body.append($('<li>').append($('<a class=take>')
				.text('Take territory')
				.click(takeTerritory.bind(null, territoryId))
				.click($.modal.close)
				))
		}

		Modal.dialog({
			title: 'Territory action',
			className: 'action',
			buttons: Modal.CancelButton,
			body: body,
			options: Modal.CancellableOptions(),
		})
	}
}

/** Handles touch events on BlackBerry Playbook tablets */
module touch {
	export var SCROLL_THRESHOLD = 15;
	export var GESTURE_ANGLE_THRESHOLD = 25;

	var field: Element = null;

	var mode = 0;
	var touchTarget = null;
	var initialTouch: TouchPoint = null;
	var scrollPoint = { x: 0, y: 0 };
	var scrollActive = false;

	var gestureStartAngle = 0;
	var gestureActive = false;

	export function init(): void {
		window.addEventListener('touchstart', touchstart, false);
		window.addEventListener('touchmove', touchmove, false);
		window.addEventListener('touchend', touchend, false);
		field = document.querySelector('#field');
	}

	function touchstart(e: TouchEvent): void {
		e.preventDefault();

		if (mode !== e.touches.length) {
			var press = mode === 0 && e.touches.length === 1;

			mode = e.touches.length;
			if (mode === 1) {
				initScroll(e, press);
			} else if (mode === 2) {
				initGesture(e);
			}
		}

		//console.log('start', e.touches.length);
	}

	function touchend(e: TouchEvent): void {
		if (mode === 1 && !scrollActive) {
			click(touchTarget);
			mouseup(touchTarget);
		}
		touchstart(e);
	}

	function touchmove(e: TouchEvent): void {
		//console.log('move', e.touches.length);
		if (mode === 1) {
			handleScroll(e);
		} else if (mode === 2) {
			handleGesture(e);
		}
	}

	function initScroll(e: TouchEvent, press: boolean): void {
		var point = e.touches[0];
		scrollPoint.x = point.clientX;
		scrollPoint.y = point.clientY;
		scrollActive = !press;
		touchTarget = e.target;
		initialTouch = point;

		// send mousedown to allow hover effects
		mousedown(touchTarget);
	}

	function handleScroll(e: TouchEvent): void {
		var point = e.touches[0];
		var dx = point.clientX - scrollPoint.x;
		var dy = point.clientY - scrollPoint.y;

		if (scrollActive || Math.sqrt(dx * dx + dy * dy) > SCROLL_THRESHOLD) {
			scrollActive = true;
			//window.scroll(document.body.scrollLeft - dx, document.body.scrollTop - dy);
			if (!Modal.isOpen()) {
				document.body.scrollTop -= dy;
				field.scrollLeft -= dx;
			}

			scrollPoint.x += dx;
			scrollPoint.y += dy;
		}
	}

	function initGesture(e: TouchEvent): void {
		var p1 = e.touches[0];
		var p2 = e.touches[1];

		gestureActive = true;
		gestureStartAngle = Math.atan2(p1.clientY - p2.clientY, p1.clientX - p2.clientX);
	}

	function handleGesture(e: TouchEvent): void {
		if (!gestureActive) {
			return;
		}

		var p1 = e.touches[0];
		var p2 = e.touches[1];

		var gestureAngle = Math.atan2(p1.clientY - p2.clientY, p1.clientX - p2.clientX);

		// run the gesture if the angle changes past the threshold
		var dangle = (gestureAngle - gestureStartAngle) * 180 / Math.PI;
		//console.log(dangle);
		if (dangle >= GESTURE_ANGLE_THRESHOLD) {
			scoring.rotateFieldCCW();
			gestureActive = false;
		} else if (dangle <= -GESTURE_ANGLE_THRESHOLD) {
			scoring.rotateFieldCW();
			gestureActive = false;
		}
	}

	function mouseevent(type: string, target) {
		var e: MouseEvent = <any>document.createEvent('MouseEvents');
		e.initMouseEvent(type, true, true, window, 0,
			initialTouch.screenX, initialTouch.screenY,
			initialTouch.clientX, initialTouch.clientY,
			false, false, false, false, 0, document.body.parentNode);

		target.dispatchEvent(e);
	}

	function click(target): void {
		mouseevent('click', target);
	}

	function mousedown(target): void {
		mouseevent('mousedown', target);
	}

	function mouseup(target): void {
		mouseevent('mouseup', target);
	}
}

interface TouchPoint {
	clientX: number;
	clientY: number;
	force: number;
	identifier: number;
	pageX: number;
	pageY: number;
	radiusX: number;
	radiusY: number;
	rotationAngle: number;
	screenX: number;
	screenY: number;
	target: number;
}

interface TouchList {
	length: number;
	[key: number]: TouchPoint;

	identifiedPoint(identifier: number): TouchPoint;
	item(index: number): TouchPoint;
}

interface TouchEvent extends UIEvent {
	changedTouches: TouchList;
	targetTouches: TouchList;
	touches: TouchList;
}