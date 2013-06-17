﻿/// <reference path="base.ts" />
/// <reference path="score-listener.ts" />

module game {
	export var colors: Color[];
	export var actions: Action[];
	export var fouls: Foul[];

	export var colorsById: ColorMap = {};
	export var actionsById: ActionMap = {};
	export var foulsById: FoulMap = {};

	export var match: Match;
	export var scores: ScoreListener;

	export function init(): void {
		colors = jsdc.color.parse(colors);
		actions = jsdc.action.parse(actions);
		fouls = jsdc.foul.parse(fouls);

		colorsById = <ColorMap><any>colors.indexByProperty('colorId');
		actionsById = <ActionMap><any>actions.indexByProperty('actionId');
		foulsById = <FoulMap><any>fouls.indexByProperty('foulId');
	}

	export var statuses: { [key: string]: { status: string; open: bool; }; } = {
		pending: { status: 'none', open: false },
		ready: { status: 'ready', open: false },
		running: { status: 'running', open: true },
		paused: { status: 'paused', open: true },
		review: { status: 'finished', open: true },
		finished: { status: 'finished', open: false },
	};

	export function getStatusName(status: { status: string; open: bool; }) {
		for (var key in statuses) {
			if (statuses.hasOwnProperty(key)) {
				var test = statuses[key];
				if (status.status == test.status && status.open == test.open)
					return key;
			}
		}
		return 'unknown';
	}
}

module scores {
	export function onconnect(error): void {
		if (error) {
			Modal.error('Cannot connect to clock server', error);
		} else {
			var clock = jsdc.clock;
			clock.join('scoring');

			game.scores = new ScoreListener(game.match, game.actions, game.fouls);
			game.scores.addEventListener('resultchanged', onResultChange);

			$('#history-wrap').append(new ScoreList(game.scores, game.colors, true));
		}
	}

	export function init(): void {
		game.init();
		jsdc.clock.connect(onconnect);

		$('#action').append(
			game.actions.map((action) => $('<option>').attr('value', action.actionId).text(action.name.capitalize()))
		);

		$('#foul').append(
			game.fouls.map((foul) => $('<option>').attr('value', foul.foulId).text(foul.name.capitalize()))
		);

		$('#from-team, #on-team').chosen({
			allow_single_deselect: true,
			placeholder_text: 'no team',
		})

		$('#action, #foul').chosen({
			allow_single_deselect: true,
			placeholder_text: 'none',
			disable_search: true,
		})

		
		$('#open').change(changeMatchOpen);
		$('#action').change(deselectFoul);
		$('#foul').change(deselectAction);
		$('#from-team, #on-team').change(updateTeamSelectClass);
		$('#from-team, #on-team, #disable, #disqualify').change(validateScoreEntry);

		$('#load').click(openMatchChangeDialog);
		$('#load-current').click($.single(loadCurrentMatch));
		$('#refresh').click($.single(refreshScores));
		$('#reset').click(resetForm);
		$('#clear-all').click(confirmDeleteScores);
		$('#create').click($.single(createScoreEntry));

		loadMatch(null);
		display.updateHistoryHeight();
		$(window).resize(display.updateHistoryHeight);

		loadCurrentMatch();
	}

	function changeMatchOpen(): void {
		var open: bool = <any>$('#open').prop('checked');
		jsdc.match.update({
			id: game.match.matchId,
			open: open
		}, (err, match) => {
			if (err) {
				Modal.apiError(err, 'Failed to ' + (open ? 'open' : 'close') + ' scoring');
			} else {
				loadMatch(match);
			}
		});
	}

	function deselectFoul(): void {
		if ($('#action').val() != '0') {
			$('#foul').val('0').trigger('liszt:updated');
		}
		validateScoreEntry();
	}

	function deselectAction(): void {
		if ($('#foul').val() != '0') {
			$('#action').val('0').trigger('liszt:updated');
		}
		validateScoreEntry();
	}

	function updateTeamSelectClass(e: JQueryEventObject): void {
		var select = $(this);
		var chznSpan = select.siblings('.chzn-container').find('.chzn-single span');
		
		chznSpan.removeClass();
		if (select.val() != 0) {
			chznSpan.addClass(getColor(select.val()));
		}
	}

	export function getColor(id: number) {
		return game.colorsById[id.toString()].name;
	}

	function onResultChange(e): void {
		display.update(<any>e.detail);
	}

	function fillTeamSelects(match): void {
		$('#from-team, #on-team').empty().append(
			$('<option value=0>')
		)

		if (match) {
			$('#from-team, #on-team').append(
				match.teams.map((team) => 
					$('<option>').attr('value', team.teamId).text(team.name).addClass(getColor(team.colorId))
				)
			)
		}

		$('#from-team, #on-team').trigger('liszt:updated');	
	}

	function validateScoreEntry(): void {
		var valid = true;
		if (!game.match || !game.match.open) {
			valid = false;
		}

		if ($('#from-team').val() == 0 && $('#on-team').val() == 0) {
			valid = false;
		}

		if ($('#action').val() == 0 && $('#foul').val() == 0 
			&& !$('#disable').prop('checked') && !$('#disqualify').prop('checked')) {
			valid = false;
		}

		$('#create').prop('disabled', !valid);
	}

	export function resetForm(): void {
		$('#from-team, #on-team, #action, #foul').val('0').trigger('liszt:updated');
		$('#disable, #disqualify').prop('checked', false);
	}

	export function createScoreEntry(e?: SingleEventObject): void {
		if (!game.match) {
			Modal.error('No match selected', 'A new score entry cannot be created because no match is loaded. Load a match first.');
			return;
		}

		jsdc.score.create({
			match: game.match.matchId,
			from: parseInt($('#from-team').val()),
			on: parseInt($('#on-team').val()),
			action: parseInt($('#action').val()),
			foul: parseInt($('#foul').val()),
			disabled: <any>$('#disable').prop('checked'),
			disqualified: <any>$('#disqualify').prop('checked'),
		}, (err, scoreId) => {
			if (err) {
				Modal.apiError(err, 'Failed to create score entry');
				if (e) {
					e.complete();
				}
			} else {
				refreshScores(e);
			}
		});
	}

	export function refreshScores(e?: SingleEventObject): void {
		if (!game.match) {
			Modal.error('No match selected', 'Scores cannot be refreshed because no match is loaded. Load a match first.');
			return;
		}

		jsdc.matchresult.update({
			match: game.match.matchId,
		}, (err, results) => {
			if (err) {
				Modal.apiError(err, 'Failed to update match results');
			} else {
				game.scores.reload();
			}

			if (e) {
				e.complete();
			}
		});
	}

	export function confirmDeleteScores(): void {
		if (!game.match) {
			Modal.error('No match selected', 'Scores cannot be deleted because no match is loaded. Load a match first.');
			return;
		}

		Modal.confirm('Delete all scores for this match?',
			'Are you sure you want to delete all score entries for this match? This operation cannot be undone.',
			{ yes: 'Delete all scores', no: 'Cancel' },
			(result) => {
				jsdc.score.reset(game.match.matchId, (err) => {
					if (err) {
						Modal.apiError(err, 'Failed to delete all score entries');
					} else {
						refreshScores();
						Modal.info('Scores deleted', 'All score entries for round ' + game.match.roundNum + ', match ' + game.match.matchNum +
							' were successfully deleted.');
					}
				})
			});
	}

	export function loadMatch(match: Match): void {
		
		if (!game.match || !match || game.match.matchId !== match.matchId) {
			fillTeamSelects(match);
			display.init(match);

			if (game.scores) {
				game.scores.match = match;
			}
		}

		game.match = match;

		if (match) {
			$('section.controls h2').removeClass('no-match');
			$('section.controls h2 .round').text(match.roundNum.toString());
			$('section.controls h2 .match').text(match.matchNum.toString());
			$('#match-status').text('Status: ' + game.getStatusName(match));
			$('#refresh, #clear-all').prop('disabled', false);
			$('#open').prop('checked', match.open).prop('disabled', false);
			$('#new-score').find('input, select, button')
				.prop('disabled', !match.open)
				.trigger('liszt:updated');

			if (match.open && ['none', 'ready'].contains(match.status)) {
				$('#state-warning').show();
			} else {
				$('#state-warning').hide();
			}

			if (match.open && ['running', 'paused'].contains(match.status)) {
				$('#open').prop('disabled', true);
			}

		} else {
			$('section.controls h2').addClass('no-match');
			$('#match-status').html('&nbsp;');
			$('#refresh, #clear-all').prop('disabled', true);
			$('#state-warning').hide();
			$('#open').prop('checked', false).prop('disabled', true);
			$('#new-score').find('input, select, button')
				.prop('disabled', true)
				.trigger('liszt:updated');
		}

		validateScoreEntry();
	}

	export function loadCurrentMatch(e?: SingleEventObject): void {
		jsdc.match.getCurrent((err, match) => {
			if (err) {
				Modal.apiError(err, 'Failed to load current match');
			} else {
				if (match) {
					loadMatch(match);
				} else if (e) {
					Modal.info('No current match', 'No match is currently in progress.');
				}
			}

			if (e) {
				e.complete();
			}
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
						$('<li>').text('Match ' + match.matchNum.toString())
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
		var list = $('#results').empty();
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