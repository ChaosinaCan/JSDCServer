/// <reference path="base.ts" />
/// <reference path="score-listener.ts" />
/// <reference path="field-listener.ts" />

module scoreboard {
	// Public Variables
	export var maxTeams: number;
	
	export var colors: Color[];
	export var actions: Action[];
	export var fouls: Foul[];
	export var maxRounds: number;

	export var colorsById: ColorMap = {};
	export var actionsById: ActionMap = {};
	export var foulsById: FoulMap = {};

	export var match: Match;
	export var clock: jsdc.clock.Timer;
	export var scores: ScoreListener;

	export var field: Field;
	export var fieldScores: FieldScoringListener;


	// Public Methods
	export function init(): void {
		
		colors = jsdc.color.parse(colors);
		actions = jsdc.action.parse(actions);
		fouls = jsdc.foul.parse(fouls);

		colorsById = <ColorMap><any>colors.indexByProperty('colorId');
		actionsById = <ActionMap><any>actions.indexByProperty('actionId');
		foulsById = <FoulMap><any>fouls.indexByProperty('foulId');

		jsdc.clock.connect(onconnect);

		field = new Field(scoreboard.colors, []);
		fieldScores = new FieldScoringListener(field);

		field.addEventListener('territory update', onTerritoryUpdate);
		field.addEventListener('battery update', onBatteryUpdate);
		field.addEventListener('game status', onGameStatus);
		$('#field').append(field.field);

		$('#change-view-pregame').click(changeView.bind(null, 'pregame'));
		$('#change-view-scoreboard').click(changeView.bind(null, 'scoreboard'));
		$('#change-view-videos').click(changeView.bind(null, 'videos'));
		$('#refresh').click(refreshScores);

		$('#res768').click(() => $('body').addClass('res768').removeClass('res1080'));
		$('#res900').click(() => $('body').removeClass('res768 res1080'));
		$('#res1080').click(() => $('body').addClass('res1080').removeClass('res768'));

		$('.view:not(.current)').hide();

		$(document).on('viewchange', (e, view) => {
			console.log('view change', e, view);
			if (view === 'videos') {
				var videos = [
					'/video/Darth Vader vs Japanese Police.webm',
					'/video/Talor Mali - Teachers.webm',
					'/video/Talor Mali - Conviction.webm',
					'/video/Talor Mali - On Girls Lending Pens.webm',
				];

				VideoPlayer.initPlaylist(videos);
			}
		});

		// load initial match
		onMatchChanged();
	}

	export function changeView(view: string) {
		var current = $('.view.current').attr('id').partition('-').after;
		if (view === current)
			return;

		$('.view.current').removeClass('current').fadeOut(500);
		$('#view-' + view).addClass('current').fadeIn(500);
		$(document).trigger('viewchange', view);
	}

	export function setMatchNumber(name: string);
	export function setMatchNumber(round: number, match: number);
	export function setMatchNumber(round: any, match?: number) {
		if (arguments.length == 2) {
			$('.normal-match').show();
			$('.special-match').hide();
			$('.round').text(round.toString());
			$('.match').text(match.toString());
		} else {
			$('.normal-match').hide();
			$('.special-match').show().text(arguments[0]);
		}
	}

	export function setMatch(match: Match) {
		scoreboard.match = match;
		if (match) {
			if (match.roundNum === scoreboard.maxRounds) {
				if (match.matchNum === 1) {
					setMatchNumber('Final match');
				} else {
					setMatchNumber('Demolition round');
				}
			} else if (match.roundNum === scoreboard.maxRounds - 1) {
				setMatchNumber('Semifinal match ' + match.matchNum);
			} else if (match.roundNum === scoreboard.maxRounds - 2) {
				setMatchNumber('Quaterfinal match ' + match.matchNum);
			} else if (match.roundNum === scoreboard.maxRounds - 3) {
				setMatchNumber('Elimation match ' + match.matchNum);
			} else {
				setMatchNumber(match.roundNum, match.matchNum);
			}

			scheduleDisplay.init(match);

			if (match.status === 'ready') {
				changeView('pregame');
			} else {
				changeView('scoreboard');
			}

			field.changeTeams(match.teams);
		} else {
			setMatchNumber('No match loaded');
			scheduleDisplay.init(null);

			changeView('scoreboard');
		}

		if (scoreboard.scores) {
			scoreboard.scores.match = match;
		}

		jsdc.clock.emit('game status');
	}


	// Private Methods
	function onconnect(error: string) {
		if (error) {
			Modal.error('Cannot connect to clock server', error);
		} else {
			var clock = jsdc.clock;
			clock.join('game', 'scoring', 'admin');
			clock.on('match changed', onMatchChanged);
			clock.on('game start', onGameStart);

			scoreboard.clock = new jsdc.clock.Timer(onTimerUpdate, onTimerStatusChange);
			scoreboard.scores = new ScoreListener(scoreboard.match, scoreboard.actions, scoreboard.fouls);

			scoreboard.scores.addEventListener('resultchanged', onResultChange);
		}
	}

	function onMatchChanged(): void {
		jsdc.match.getCurrent((err, match) => {
			if (err) {
				Modal.apiError(err, 'Failed to get the current match');
			} else {
				setMatch(match);
			}
		});
	}

	function onGameStart(): void {
		changeView('scoreboard');
	}

	function onGameStatus(e: CustomEvent): void {
		updateAllGameStatuses();
	}

	function onTimerUpdate(timer: jsdc.clock.Timer) {
		$('#clock').text(timer.toString());
	}

	function onTimerStatusChange(timer: jsdc.clock.Timer) {
		if (timer.lastStatus.paused) {
			$('#clock').addClass('paused');
		} else {
			$('#clock').removeClass('paused');
		}

		if (timer.lastStatus.aborted) {
			$('#clock').text('Aborted').addClass('text');
		} else if (timer.lastStatus.finished) {
			$('#clock').text('Game Over').addClass('text');
		} else {
			$('#clock').removeClass('text');
		}
	}

	function onResultChange(e: CustomEvent) {
		scheduleDisplay.update(<any>e.detail)
	}

	function onTerritoryUpdate(e: CustomEvent) {
		updateAllGameStatuses();
	}

	function onBatteryUpdate(e: CustomEvent) {
		updateAllGameStatuses();
	}

	function updateAllGameStatuses(): void {
		field.currentStatus.teams.forEach(scheduleDisplay.updateGameStatus);
	}

	function refreshScores(): void {
		jsdc.matchresult.update({
			match: scoreboard.match.matchId
		}, (err, result) => {
			scoreboard.scores.reload();
		});
	}
}


module scheduleDisplay {
	var template = $('<li>').append(
		$('<div class=primary>').append(
			$('<span class=team>'),
			$('<span class=score>').text('0')
		),
		$('<div class=secondary>').append(
			$('<span class=territories>').text('0'),
			$('<span class=points>').text('0'),
			$('<span class=batteries>').append(
				$('<span class="battery battery-0">').text('⚡'),
				$('<span class="battery battery-1">').text('⚡')
			),
			$('<span class=status>')
		)
	);

	var pregameTemplate = $('<div class=teamcard>').append(
		$('<header>').append(
			$('<h1 class=thin>'),
			$('<h2>')	
		),
		$('<img>')
	);

	var rowsByTeamId: { [key: string]: JQuery; } = {};

	export function init(match: Match) {
		var list = $('#teams ul').empty();
		var cards = $('#teamcards').empty();
		rowsByTeamId = {};
		
		if (match) {
			match.teams.forEach((team, i) => {
				var row = createStatus(team);
				list.append(row);
				rowsByTeamId[team.teamId.toString()] = row;

				var card = createCard(team);
				cards.append(card);
			});
		}
	}

	function createCard(team: Team) {
		var card = pregameTemplate.clone(true);
		card.addClass(scoreboard.colorsById[team.colorId.toString()].name);
		card.find('h1').text(team.name);
		card.find('h2').text(team.university);
		card.find('img').attr('src', jsdc.getTeamImage(team.imageName) || '/img/default-team.svg');
		return card;
	}

	function createStatus(team: Team) {
		var item = template.clone(true);
		item.addClass(scoreboard.colorsById[team.colorId.toString()].name);
		item.find('.team').text(team.name);
		return item;
	}

	function updateStatus(item: JQuery, result: ScoreInfo) {
		item.find('.score').text(Math.max(0, result.score).toString());
		
		var status = '';
		if (result.disqualified) {
			status = 'disqualified';
		} else if (result.disabled) {
			status = 'disabled';
		} else if (result.fouls > 0) {
			status = result.fouls.toString() + ((result.fouls === 1) ? ' foul' : ' fouls');
		}
		item.find('.status').text(status);
	}
	
	export function update(result: ScoreInfo) {
		var row = rowsByTeamId[result.team.teamId.toString()];
		if (row) {
			updateStatus(row, result);
		}
	}

	export function updateGameStatus(status: TeamStatus) {
		var row = rowsByTeamId[status.team.teamId.toString()];
		if (row) {
			row.find('.territories').text(status.territories.toString());
			row.find('.points').text(status.controlPoints.toString());

			if (status.batteries[0]) {
				row.find('.battery-0').addClass('held');
			} else {
				row.find('.battery-0').removeClass('held');
			}

			if (status.batteries[1]) {
				row.find('.battery-1').addClass('held');
			} else {
				row.find('.battery-1').removeClass('held');
			}
		}
	}
}



module VideoPlayer {
	export var thumbnailWidth = 100;
	export var thumbnailHeight = 64;

	export function initPlaylist(videos: string[]) {
		$('#video-list').empty();
		videos.forEach((url: string) => {
			var thumbnail = generateThumbnail(url, 10);
			$('#video-list').append(
				$('<li>').append(thumbnail)
					.click(changeVideo.bind(null, url))
			);
		});
	}
	
	export function changeVideo(url: string) {
		$('#video').attr('src', url);
	}

	export function generateThumbnail(url: string, seek?: number) {
		seek = seek || 0;
		var canvas: HTMLCanvasElement = $('<canvas>')
			.attr('width', thumbnailWidth)
			.attr('height', thumbnailHeight)
			.addClass('loading')
			.get(0);
		var video: HTMLVideoElement = $('<video>')
			.attr('src', url)
			.attr('preload', 'metadata')
			.get(0);

		var ctx = canvas.getContext('2d');
		
		function draw() {
			// preserve aspect ratio
			var aspect = video.videoWidth / video.videoHeight;
			var canvasAspect = canvas.width / canvas.height;

			var x = 0, y = 0, w = canvas.width, h = canvas.height;
			if (aspect > canvasAspect) {
				w = canvas.height * aspect;
				x = -(w - canvas.width) / 2;
			} else if (aspect < canvasAspect) {
				h = canvas.width / aspect;
				y = -(h - canvas.height) / 2;
			}

			// wait a little bit to make sure a frame is loaded
			setTimeout(() => {
				ctx.drawImage(video, x, y, w, h);
				$(canvas).removeClass('loading');
			}, 200);
		}

		video.addEventListener('seeked', draw, false);
		video.addEventListener('loadedmetadata', function () {
			video.currentTime = seek;
		}, false);
		
		return canvas;
	}
}