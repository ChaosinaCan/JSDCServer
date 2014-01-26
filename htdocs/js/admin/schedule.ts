/// <reference path="base.ts" />

module schedule {
	// Public Variables
	export var maxTeams: number;

	export var colors: Color[];
	export var colorsById: ColorMap = {};

	// Private Variables
	var _template: JQuery;

	// Public Methods
	export function onconnect(error: string) {
		if (error) {
			Modal.error('Cannot connect to clock server', error);
		} else {
			var clock = jsdc.clock;
			clock.join('game', 'admin');
			clock.on('match changed', onMatchChanged);
		}
	}

	export function init(): void {
		colors = jsdc.color.parse(colors);
		colorsById = <ColorMap><any>colors.indexByProperty('colorId');
		jsdc.clock.connect(onconnect);

		var header = $('#match-header tr');
		header.append(
			$('<td class=round colspan=2>').text('Match'),
			schedule.colors.map((color) =>
				$('<td class=team>').text(color.name.capitalize()).addClass(color.name)
			)
		);

		_template = $('<tr>').append(
			$('<td class=round>'),
			$('<td class=match>'),
			schedule.colors.map((color) =>
				$('<td class=team>').addClass(color.name)
			)
		);

		$('#refresh').click(loadMatches);

		loadMatches();
	}

	export function onMatchChanged(): void {
		markCurrentMatch();
	}

	function getTeamByColor(match: Match, color: Color): Team {
		for (var i = 0; i < match.teams.length; i++) {
			var team = match.teams[i];
			if (team.colorId === color.colorId) {
				return team;
			}
		}

		return null;
	}

	export function loadMatches(): void {
		jsdc.match.getAll((err, matches) => {
			if (err) {
				Modal.apiError(err, 'Failed to get match list');
				return;
			}

			var rows: JQuery[] = matches.map((match) => {
				var row = _template.clone();
				row.data('match', match);
				row.find('.round').text(match.roundNum.toString());
				row.find('.match').text(match.matchNum.toString());

				match.teams.forEach((team) => {
					var color = schedule.colorsById[team.colorId.toString()];
					row.find('.' + color.name).text(team.name);
				});

				return row;
			});

			// add round breaks
			for (var i = 0; i < rows.length - 1; i++) {
				var row = rows[i];
				var match: Match = row.data('match');
				var nextMatch: Match = rows[i + 1].data('match');

				if (match.roundNum !== nextMatch.roundNum) {
					row.addClass('round-break');
				}
			}

			// merge round numbers
			var firstRow: JQuery = null;
			var firstMatch: Match = null;
			var rowsInRound = 0;
			for (var i = 0; i < rows.length; i++) {
				if (!firstRow) {
					firstRow = rows[i];
					firstMatch = firstRow.data('match');
					rowsInRound = 1;
				} else {
					if (rows[i].data('match').roundNum === firstMatch.roundNum) {
						rowsInRound += 1;
						rows[i].find('.round').remove();
						if (rows[i].hasClass('round-break')) {
							firstRow.find('.round').addClass('round-break');
						}
					} else {
						firstRow.find('.round').attr('rowspan', rowsInRound);
						firstRow = rows[i];
						firstMatch = firstRow.data('match');
						rowsInRound = 1;
					}
				}
			}
			if (rowsInRound > 1) {
				firstRow.find('.round').attr('rowspan', rowsInRound);
			}

			$('#matches').empty().append(rows);
			markCurrentMatch();
		});
	}

	export function markCurrentMatch(): void {
		jsdc.match.getCurrent((err, current) => {
			if (err) {
				Modal.apiError(err, 'Failed to get current match');
				return;
			}

			$('#matches').find('tr.old').removeClass('old');
			$('#matches').find('td.current').removeClass('current');
			$('#matches').find('td.next').removeClass('next');

			var nextMatch = null;

			var currentRound = 0;
			var roundRows: JQuery[] = [];
			var roundFinished = false;
			$('#matches tr').each((i, elem) => {
				var row = $(elem);
				var match: Match = row.data('match');

				// hide rounds whose matches are all finished
				if (match.roundNum !== currentRound) {
					if (roundFinished) {
						roundRows.forEach((row) => row.addClass('old'));
					}
					currentRound = match.roundNum;
					roundRows = [];
					roundFinished = true;
				}

				if (match.roundNum === currentRound) {
					if (match.status !== 'finished') {
						roundFinished = false;
					} else {
						roundRows.push(row);
					}
				}

				// mark the current and next match if it exists
				if (current && match.roundNum === current.roundNum) {
					row.find('.round').addClass('current');

					if (match.matchNum === current.matchNum) {
						row.find('.match').addClass('current');
						row.next().find('.match').addClass('next');

						nextMatch = row.next().data('match');
					}
				}
			});

			if (roundFinished) {
				roundRows.forEach((row) => row.addClass('old'));
			}

			setMatchHeaders(current, nextMatch);
		});
	}

	export function setMatchHeaders(current: Match, next: Match): void {
		console.log(current, next);

		[
			{ match: current, id: '#current' },
			{ match: next, id: '#next' },
		].forEach((info) => {
			var match: Match = info.match;
			var elem = $(info.id);

			elem.find('ul').empty();

			if (match) {
				elem.removeClass('no-match');
				elem.find('.round').text(match.roundNum.toString());
				elem.find('.match').text(match.matchNum.toString());

				match.teams.sort((a, b) => a.colorId - b.colorId);

				elem.find('ul').append(
					match.teams.map((team) =>
						$('<li>').text(team.name).addClass(schedule.colorsById[team.colorId.toString()].name)
					)
				);
			} else {
				elem.addClass('no-match');
			}
		});
	}
}