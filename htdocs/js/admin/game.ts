/// <reference path="base.ts" />
/// <reference path="../spin.d.ts" />
/// <reference path="score-listener.ts" />

module game {
	export var maxRounds: number;
	export var maxMatches: number;
	export var maxTeams: number;
	
	export var colors: Color[];
	export var actions: Action[];
	export var fouls: Foul[];

	export var colorsById: ColorMap = {};
	export var actionsById: ActionMap = {};
	export var foulsById: FoulMap = {};

	export var match: Match;
	export var clock: jsdc.clock.Timer;
	export var scores: ScoreListener;

	export function init(): void {
		jsdc.clock.connect(onconnect);

		colors = jsdc.color.parse(colors);
		actions = jsdc.action.parse(actions);
		fouls = jsdc.foul.parse(fouls);

		colorsById = <ColorMap><any>colors.indexByProperty('colorId');
		actionsById = <ActionMap><any>actions.indexByProperty('actionId');
		foulsById = <FoulMap><any>fouls.indexByProperty('foulId');

		jsdc.match.getCurrent((err, match) => {
			if (err)
				Modal.apiError(err, 'Failed to get the current match');
			else
				setMatchData(match);
		});

		$('.spinner').spin(jsdc.spinners.dark);

		$('#start').click(startMatch);
		$('#pause').click(pauseMatch);
		$('#resume').click(resumeMatch);
		$('#stop').click(confirmAbortMatch);
		$('#clock').click(changeMatchTimeDialog);

		var matchControl = $('#start, #pause, #resume');
		matchControl.click(() => {
			matchControl.prop('disabled', true);
			setTimeout(() => matchControl.prop('disabled', false), 500);
		});

		$('#load-match').click(openMatchChangeDialog);
		$('#refresh-scores').click($.single(refreshScores));
		$('#emergency').click(confirmEmergency);
		$('#reset-field').click(confirmResetField);

		display.updateHistoryHeight();
		$(window).resize(display.updateHistoryHeight);
	}

	export function onconnect(err: string): void {
		var status = $('#connection .status');
		status.spin(false).removeClass('spinner');
		if (err) {
			status.empty().append(
				'Failed to connect.',
				$('<br>'), err
			);

			Modal.info('Failed to connect to the clock server', err);
		} else {
			status.text('Connected.');
			jsdc.clock.on('disconnect', () => {
				status.text('Connection lost.')
			});

			jsdc.clock.on('reconnect', () => {
				status.text('Connected.')
			});

			jsdc.clock.join('game', 'match', 'scoring');
			jsdc.clock.on('gameover', onGameover);

			clock = new jsdc.clock.Timer(onTimerUpdate, onTimerStatusChange);
			scores = new ScoreListener(null, actions, fouls);
			scores.addEventListener('score', onScoreChange);
			scores.addEventListener('resultchanged', onResultChange);
			scores.addEventListener('matchchanged', onMatchChange);

			scores.match = game.match;

			$('#history-wrap').append(new ScoreList(scores, game.colors, true));
		}
	}
	
	function onScoreChange(e: CustomEvent) {
		//console.log('game score change', e.detail);
	}

	function onResultChange(e: CustomEvent) {
		//console.log('game result change', e.detail);
		display.update(<any>e.detail);
	}

	function onMatchChange(e: CustomEvent) {
		//console.log('game match change', e.detail)
	}

	function onGameover() {
		jsdc.match.update({
			id: match.matchId,
			status: 'finished',
			open: true,
		}, Modal.makeErrorHandler('Failed to stop the match'));
	}

	function onTimerUpdate(timer: jsdc.clock.Timer): void {
		$('#clock time').text(timer.toString());
	}

	function onTimerStatusChange(timer: jsdc.clock.Timer): void {
		$('#controls').removeClass('unstarted running paused finished');
		if (!timer.lastStatus) {
			$('#controls').addClass('unstarted');
			$('#stop').prop('disabled', true);
			$('#load-match').prop('disabled', false);
		} else if (timer.lastStatus.running) {
			$('#controls').addClass('running');
			$('#stop').prop('disabled', false);
			$('#load-match').prop('disabled', true);
		} else if (timer.lastStatus.paused) {
			$('#controls').addClass('paused');
			$('#stop').prop('disabled', false);
			$('#load-match').prop('disabled', true);
		} else if (timer.lastStatus.finished) {
			$('#controls').addClass('finished');
			$('#stop').prop('disabled', true);
			$('#load-match').prop('disabled', false);
		} else {
			$('#controls').addClass('unstarted');
			$('#stop').prop('disabled', true);
			$('#load-match').prop('disabled', false);
		}

		//if (timer.lastStatus && timer.lastStatus.match !== match.matchId) {
		//	Modal.confirm('Servers out of sync',
		//		'The clock server has the wrong current match. ' +
		//		'You should synchronize the servers. If a match is currently running, it will be stopped.',
		//		{ yes: 'Resync Matches', no: 'Do Nothing' },
		//		(result) => {

		//		});
		//}
	}

	function setMatchData(match: Match): void {
		game.match = match;

		if (scores) {
			scores.match = match;
		}

		if (match) {
			$('section.teams h2').removeClass('no-match');
			$('section.teams h2 .round').text(match.roundNum.toString());
			$('section.teams h2 .match').text(match.matchNum.toString());
			$('#start').prop('disabled', false);
		} else {
			$('section.teams h2').addClass('no-match');
			$('#start').prop('disabled', true);
		}

		display.init(match);
	}

	export function loadMatch(match: Match): void {
		if (game.match && game.match.matchId === match.matchId) {
			Modal.error('Match already loaded', 'The match you attempted to load was already loaded.');
			return;
		}

		if (game.match && game.match.matchId > 0) {
			jsdc.match.update({
				id: game.match.matchId,
				open: false,
				status: clock.lastStatus.finished ? 'finished' : 'none',
			}, Modal.makeErrorHandler('Failed to close current match'));
		}

		jsdc.match.update({
			id: match.matchId,
			open: false,
			status: 'ready',
		}, (err, result) => {
			if (err) {
				Modal.apiError(err, 'Failed to load new match');
			} else {
				setMatchData(result);
				jsdc.clock.emit('load match');
			}
		});
	}


	export function startMatch(): void {
		if (match) {
			jsdc.clock.emit('game start');
			jsdc.match.update({ 
				id: match.matchId,
				status: 'running',
				open: true,
			}, Modal.makeErrorHandler('Failed to start the match'));
		}
	}

	export function pauseMatch(): void {
		if (match) {
			jsdc.clock.emit('game pause');
			jsdc.match.update({
				id: match.matchId,
				status: 'paused',
				open: true,
			}, Modal.makeErrorHandler('Failed to pause the match'));
		}
	}

	export function resumeMatch(): void {
		if (match) {
			jsdc.clock.emit('game resume');
			jsdc.match.update({
				id: match.matchId,
				status: 'running',
				open: true,
			}, Modal.makeErrorHandler('Failed to resume the match'));
		}
	}

	export function abortMatch(): void {
		if (match) {
			jsdc.clock.emit('game stop');
			jsdc.match.update({
				id: match.matchId,
				status: 'finished',
				open: true,
			}, Modal.makeErrorHandler('Failed to stop the match'));
		}
	}

	export function confirmAbortMatch(): void {
		Modal.confirm('Abort match',
			'Are you sure you want to abort the match? Once aborted, a match cannot be resumed.',
			{ yes: 'Abort', no: 'Cancel' },
			(result) => {
				if (result) {
					abortMatch();
				}
			});
	}

	export function changeMatchTimeDialog(): void {
	
		if (game.clock.running) {
			return;
		}
		
		var minutes: number = Math.floor(game.clock.time / 60);
		var seconds: number = Math.floor(game.clock.time % 60);

		console.log(minutes, seconds);

		function changeTime(): void {
			var time = <any>content.find('input[type=time]').prop('valueAsNumber') / 60000;
			minutes = Math.floor(time / 60);
			seconds = Math.floor(time % 60);
			console.log(time, minutes, seconds);
		}

		function setTime(): void {
			console.log('set time', minutes, seconds);
			jsdc.clock.emit('set time', minutes * 60 + seconds);
		}

		var content = $('<p class=x-large>').append(
			$('<input type=time class=x-large>')
				.val(minutes.toString().pad(2, '0') + ':' + seconds.toString().pad(2, '0'))
				.change(changeTime)
		)

		Modal.dialog({
			title: 'Change match time',
			body: content,
			buttons: [
				{ text: 'Change time', action: setTime }, 
				{ text: 'Cancel' }
			],
			options: Modal.CancellableOptions(),
		});
	}

	export function openMatchChangeDialog(): void {
		var content = $('<div class=content>');
		var spinner = $('<div class=spinner>');
		var loading = true;

		var options: Modal.ModalOptions = {
			title: 'Select a Match',
			body: spinner.add(content),
			className: 'match-select',
			buttons: [
				{ text: 'Cancel' }
			],
			options: {
				close: true,
				escClose: true,
				overlayClose: true,
				onOpen: (dialog) => {
					if (loading)
						spinner.spin(jsdc.spinners.light);
					else
						spinner.find('.spinner').remove();
				}
			}
		}

		Modal.dialog(options);

		jsdc.match.getAll((err, matches) => {
			spinner.spin(false);
			spinner.remove();

			loading = false;
			if (err)
				Modal.apiError(err, 'Failed to load matches');
			else {
				var currentRound = 0;
				var currentList = null;
				matches.forEach((match) => {
					if (match.roundNum !== currentRound) {
						currentRound = match.roundNum;
						content.append($('<h2>').text('Round ' + match.roundNum.toString()));
						currentList = $('<ul>').appendTo(content);
					}
					currentList.append(
						$('<li>').text('Match ' + match.matchNum.toString() + (match.status === 'finished' ? ' ✓' : ''))
							.addClass(match.status === 'finished' ? 'finished' : '')
							.addClass((game.match && match.matchId === game.match.matchId) ? 'current' : '')
							.click(() => {
								if (!game.match || match.matchId !== game.match.matchId) {
									loadMatch(match);
									$.modal.close();
								}
							})
					);
				})
			}
		});
	}

	export function refreshScores(e: SingleEventObject): void {
		jsdc.matchresult.update({
			match: game.match.matchId,
		}, (err, results) => {
			e.complete();
			if (err)
				Modal.apiError(err, 'Failed to refresh scores');
		});
	}

	export function emergencyStop(): void {
		jsdc.clock.emit('emergency');
	}

	export function confirmEmergency(): void {
		Modal.confirm('Emergency stop',
			'Are you sure you want to perform an emergency stop? This will pause the match and sound an alarm.',
			{ yes: 'Emergency stop', no: 'Cancel' },
			(result) => {
				if (result) {
					emergencyStop();
				}
			});
	}

	export function resetField(): void {
		jsdc.clock.emit('reset field');
	}

	export function confirmResetField(): void {
		Modal.confirm('Resetting the field',
			'Make sure people on the field are clear of any moving parts before continuing.',
			{ yes: 'Reset the field', no: 'Cancel' },
			(result) => {
				if (result) {
					resetField();
				}
			});
	}
}


module display {

	var template = $('<li>').append(
		$('<div class=primary>').append(
			$('<span class=team>'),
			$('<span class=score>')
		),
		$('<div class=secondary>').append(
			$('<span class=fouls>'),
			$('<span class=status>')
		)
	);

	var rowsByTeamId: { [key: string]: JQuery; } = {};

	export function init(match: Match) {
		var list = $('#teams').empty();
		rowsByTeamId = {};
		
		if (match) {
			match.teams.forEach((team, i) => {
				var row = createStatus(team);
				list.append(row);
				rowsByTeamId[team.teamId.toString()] = row;
			});
		}
	}


	function createStatus(team: Team) {
		var item = template.clone(true);
		item.addClass(game.colorsById[team.colorId.toString()].name);
		item.find('.team').text(team.name);
		item.find('.score').text('0');
		return item;
	}

	function updateStatus(item: JQuery, result: ScoreInfo) {
		item.find('.score').text(Math.max(0, result.score).toString());
		var foulText = (result.fouls === 1) ? 'foul' : 'fouls';
		item.find('.fouls').text(result.fouls.toString() + ' ' + foulText);
		var status = '';
		if (result.disqualified) {
			status = 'disqualified';
		} else if (result.disabled) {
			status = 'disabled';
		}
		item.find('.status').text(status);
	}


	
	export function update(result: ScoreInfo) {
		var row = rowsByTeamId[result.team.teamId.toString()];
		if (row) {
			updateStatus(row, result);
		}
	}

	export function updateHistoryHeight(): void {
		var list = $('#history-wrap');
		if (window.innerWidth >= 1357) {
			var top = list.position().top;
			var height = window.innerHeight - 40 - top;
			list.css('max-height', height + 'px');
		} else {
			list.css('max-height', 'auto');
		}
	}
}