/// <reference path="../admin/base.ts" />
/// <reference path="../admin/field-listener.ts" />

module game {
	export var colors: Color[];
	export var actions: Action[];
	export var fouls: Foul[];

	export var team: Team;
	export var match: Match;

	export var colorsById: ColorMap;
	export var actionsById: ActionMap;
	export var foulsById: FoulMap;

	export function init(): void {
		colors = jsdc.color.parse(colors);
		team = jsdc.team.parseOne(team);
		match = jsdc.match.parseOne(match);

		colorsById = <any>colors.indexByProperty('colorId');
		actionsById = <any>actions.indexByProperty('actionId');
		foulsById = <any>fouls.indexByProperty('foulId');
	}
}

module scoring {
	export var field: Field;
	export var fieldRotation = 0;
	export var claimingBattery = -1;

	export var actions = {
		action: 1,
		takeTerritory: 2,
	}

	export function init(): void {
		game.init();
		jsdc.clock.connect(onconnect);

		field = new Field(game.colors, game.match.teams);
		field.onload = onFieldLoaded;
		$('#field').append(field.field);

		$('#action').click($.single(actionHandler));
		$('#foul-personal').click(foulDialog.bind(null, 1));
		$('#foul-technical').click(foulDialog.bind(null, 2));
		$('#foul-flagrant').click(foulDialog.bind(null, 3));
		$('#emergency').click(confirmEmergency);
		$('#disabled').click(confirmDisabled);

		$('#battery-0').click(ownedBatteryDialog.bind(null, 0));
		$('#battery-1').click(ownedBatteryDialog.bind(null, 1));
		$('#battery-0-unclaimed').click(unclaimedBatteryDialog.bind(null, 0));
		$('#battery-1-unclaimed').click(unclaimedBatteryDialog.bind(null, 1));

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

	export function onFieldLoaded(): void {
		field.getCells().forEach((cell) => {
			var id: number = cell.data('id');
			var capturable: bool = cell.data('capturable');

			if (capturable) {
				cell.click(territoryDialog.bind(null, id));
			}
		});
	}

	export function onGameStatus(status: GameStatus): void {
		updateBatteries(status.batteries);
	}

	export function onGameEvent(event): void {
		switch (event.event) {
			case 'battery update':
				updateBatteries(event.data);
				break;
		}
	}

	export function updateBatteries(status: BatteryStatus[]) {
		console.log('battery update', status);
		status.forEach((battery, i) => {
			var ownedIndicator = $('#battery-' + i);
			var unclaimedIndicator = $('#battery-' + i + '-unclaimed');

			if (battery.owner === game.team.teamId) {
				ownedIndicator.addClass('owned');
			} else {
				ownedIndicator.removeClass('owned');
			}

			if (!battery.territory) {
				unclaimedIndicator.addClass('owned');
			} else {
				unclaimedIndicator.removeClass('owned');
				if (claimingBattery === battery.id) {
					claimingBattery = -1;
				}
			}
		});
	}

	export function getColor(id: number) {
		return game.colorsById[id.toString()] || null;
	}

	export function getColorName(id: number) {
		var color = getColor(id);
		return color ? color.name : 'unknown';
	}

	export function getTeam(id: number) {
		for (var i = 0; i < game.match.teams.length; i++) {
			if (game.match.teams[i].teamId === id) {
				return game.match.teams[i];
			}
		}
		return null;
	}
	
	export function getAction(id: number) {
		return game.actionsById[id.toString()] || null;
	}

	export function getFoul(id: number) {
		return game.foulsById[id.toString()] || null;
	}

	export function canTakeTerritory(territoryId: number) {
		var cell = field.getCell(territoryId);
		var status: TerritoryStatus = cell.data('status');
		
		// can't take if already owned
		if (status.owner === game.team.teamId) {
			return false;
		}

		var neighbors = field.getNeighbors(territoryId);
		for (var i = 0; i < neighbors.length; i++) {
			var status: TerritoryStatus = neighbors[i].data('status');
			if (status.owner === game.team.teamId && status.powered) {
				return true;
			}
		}
		return false;
	}

	export function canPlaceBattery(territoryId: number): bool[] {
		var cell = field.getCell(territoryId)
		if (cell.hasClass('battery')/* || cell.data('status').owner !== game.team.teamId*/) {
			return [false, false];
		}

		return field.currentStatus.batteries.map((battery) => {
			return battery.owner === game.team.teamId || battery.id === claimingBattery;
		});
	}

	export function sendAction(fromTeam: number, callback: (err: APIError) => any) {
		jsdc.score.create({
			match: game.match.matchId,
			action: scoring.actions.action,
			from: fromTeam,
			on: 0,
		}, callback);
	}

	export function sendFoul(foulId: number, fromTeam: number, onTeam: number, callback: (err: APIError) => any) {
		jsdc.score.create({
			match: game.match.matchId,
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
				team: game.team.teamId,
				territory: territoryId,
			}
		});
	}

	export function placeBattery(territoryId: number, batteryId: number) {
		jsdc.clock.emit('game event', {
			event: 'place battery',
			data: {
				team: game.team.teamId,
				battery: batteryId,
				territory: territoryId,
			}
		});

		if (claimingBattery === batteryId) {
			claimingBattery = -1;
		}
	}

	export function dropBattery(batteryId: number) {
		jsdc.clock.emit('game event', {
			event: 'place battery',
			data: {
				team: game.team.teamId,
				battery: batteryId,
				territory: 0
			}
		});
	}

	export function claimBattery(batteryId: number) {
		claimingBattery = batteryId;
	}

	export function rotateFieldCW(): void {
		fieldRotation -= 90;
		updateFieldRotation();
	}

	export function rotateFieldCCW(): void {
		fieldRotation += 90;
		updateFieldRotation();
	}

	function updateFieldRotation(): void {
		$('table.field').css('-webkit-transform', 'rotate(' + fieldRotation + 'deg)');
	}

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
						match: game.match.matchId,
						from: game.team.teamId,
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

		sendAction(game.team.teamId, (err) => {
			if (err) {
				Modal.apiError(err, 'Failed to send action');
			}
			$.modal.close();
			e.complete();
		});
	}
	
	function foulDialog(foulId: number): void {
		var body: JQuery = $('<ul class=colorselect>').append(
			game.match.teams.filter((team) => team.teamId !== game.team.teamId)
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
								sendFoul(foulId, game.team.teamId, team.teamId, (err) => {
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
			title: getFoul(foulId).name.capitalize() + ' foul',
			className: 'foul',
			buttons: Modal.CancelButton,
			body: body,
			options: Modal.CancellableOptions(),
		});
	}

	function territoryDialog(territoryId: number): void {
		var canTake = canTakeTerritory(territoryId);
		var canPlace = canPlaceBattery(territoryId);

		if (!canTake && !canPlace.contains(true)) {
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

		canPlace.forEach((canPlace, i) => {
			if (canPlace) {
				var text = (i === claimingBattery) ? 'Claim and place battery ' : 'Place battery ';

				body.append($('<li>').append($('<a class=battery>')
					.text(text + String.fromCharCode(65 + i))
					.click(placeBattery.bind(null, territoryId, i))
					.click($.modal.close)
				))
			}
		});

		Modal.dialog({
			title: 'Territory action',
			className: 'action',
			buttons: Modal.CancelButton,
			body: body,
			options: Modal.CancellableOptions(),
		})
	}

	function ownedBatteryDialog(batteryId: number): void {
		if (field.currentStatus.batteries[batteryId].owner !== game.team.teamId) {
			return;
		}

		var body = $('<ul class=actionselect>').append(
			$('<li>').append($('<a class=drop>')
				.text('Drop battery ' + String.fromCharCode(65 + batteryId))
				.click(dropBattery.bind(null, batteryId))
				.click($.modal.close)
			)
		)

		Modal.dialog({
			title: 'Battery action',
			className: 'battery',
			buttons: Modal.CancelButton,
			body: body,
			options: Modal.CancellableOptions(),
		})
	}

	function unclaimedBatteryDialog(batteryId: number): void {
		if (field.currentStatus.batteries[batteryId].owner !== 0) {
			return;
		}

		var body = $('<ul class=actionselect>').append(
			$('<li>').append($('<a class=drop>')
				.text('Take battery ' + String.fromCharCode(65 + batteryId))
				.click(claimBattery.bind(null, batteryId))
				.click($.modal.close)
			)
		).add(
			$('<p>').text('After claiming a battery, you must place it on a territory before your team owns it.')
		);

		Modal.dialog({
			title: 'Battery action',
			className: 'battery',
			buttons: Modal.CancelButton,
			body: body,
			options: Modal.CancellableOptions(),
		});
	}
}






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

	function initScroll(e: TouchEvent, press: bool): void {
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