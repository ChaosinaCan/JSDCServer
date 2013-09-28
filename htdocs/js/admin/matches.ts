/// <reference path="base.ts" />

module game {
	export var maxRounds: number;
	export var maxMatches: number;
	export var maxTeams: number;
	export var colors: Color[];
	export var teams: Team[];

	export var colorsById: { [key: string]: Color; } = {};
	export var teamsById: { [key: string]: Team; } = {};
}

module matches {

	export var statuses: { [key: string]: { status: string; open: bool; }; } = {
		pending: { status: 'none', open: false },
		ready: { status: 'ready', open: false },
		running: { status: 'running', open: true },
		paused: { status: 'paused', open: true },
		review: { status: 'finished', open: true },
		finished: { status: 'finished', open: false },
	};

	var _template: JQuery;
	var _columnsByColor: { [key: string]: number; } = {};

	export function init(): void {
		game.colors = jsdc.color.parse(game.colors);
		game.teams = jsdc.team.parse(game.teams);

		// limit the number of colors to the number of teams playing
		game.colors = game.colors.slice(0, game.maxTeams);

		game.colors.forEach((color, i) => {
			game.colorsById[color.colorId.toString()] = color;
			_columnsByColor[color.colorId.toString()] = i;
		});
		game.teams.forEach((team) => game.teamsById[team.teamId.toString()] = team);

		
		// enhance <select> inputs
		$('#filter-round').append(
			range(1, game.maxRounds).map((index) =>
				$('<option>').attr('value', index).text(index.toString()))
		);

		$('#filter-round, #filter-status')
			.addClass('allow-deselect')
			.chosen({
				disable_search: true,
				allow_single_deselect: true,
				placeholder_text: 'Show All',
			})
			.change(filterMatches);

		//$('select').chosen({ disable_search: true });		

		// build the table of matches
		var header = $('#matches thead tr');
		header.append(
			$('<td class=round>').text('Round'),
			$('<td class=match>').text('Match'),
			$('<td class=status>').text('Status'),
			game.colors.map((color) =>
				$('<td class=team>').text(color.name.capitalize()).addClass(color.name)
			),
			$('<td class=controls>')
		);

		// get a list of teams to add into each team <select>
		// append a "no team" entry to the beginning of the list
		var teams = game.teams;
		teams.unshift({
			teamId: 0,
			name: '',
			university: null,
			imageName: null,
		});

		// create a template for generating each row
		_template = $('<tr>').append(
			$('<td class=round>').append(
				$('<select>').append(
					range(1, game.maxRounds).map((index) => 
						$('<option>').attr('value', index).text(index.toString()))
				)
			),
			$('<td class=match>').append(
				$('<select>').append(
					range(1, game.maxMatches).map((index) => 
						$('<option>').attr('value', index).text(index.toString()))
				)
			),
			$('<td class=status>').append(
				$('<select>').append(
					keys(statuses).map((key) => 
						$('<option>').attr('value', statusToString(statuses[key]))
							.text(key.capitalize()))
				)
			),
			game.colors.map((color) =>
				$('<td class=team>').addClass(color.name).append(
					$('<select>').append(
						game.teams.map((team) =>
							$('<option>').attr('value', team.teamId).text(team.name)
						)
					)
				)
			),
			$('<td class=controls>').append(
				$('<button class=undo>').html('&#xe10e')
					.attr('title', 'Undo changes')
					.prop('disabled', true),
				$('<button class=delete>').html('&#xe106')
					.attr('title', 'Delete match'),
				$('<button class=undelete>').html('&#xe10b')
					.attr('title', 'Restore match')
			)
		);

		// attach event handlers to controls
		$('#new-match').click((e) => {
			addMatch();
		});

		$('#save').click($.single((e: SingleEventObject) => {
			saveChanges(() => e.complete());
		}));
	}



	function getStatusName(status: { status: string; open: bool; }) {
		for (var key in statuses) {
			if (statuses.hasOwnProperty(key)) {
				var test = statuses[key];
				if (status.status == test.status && status.open == test.open)
					return key;
			}
		}
		return 'unknown';
	}

	function statusToString(status: { status: string; open: bool; }) {
		return status.status + ' ' + status.open;
	}

	function stringToStatus(str: string) {
		var parts = str.partition(' ');
		return {
			status: parts.before,
			open: parseBool(parts.after),
		}
	}



	export function loadMatches(matches: Match[]) {
		matches = jsdc.match.parse(matches);
		var table = getTableBody().empty().hide();

		matches.forEach((match) => {
			buildRow(table, match);
		})

		table.show();
	}

	export function getMatches(): Match[] {
		var rows = getRows();
		var matches: Match[] = new Array(rows.length);
		rows.each((i, elem) => {
			matches[i] = getMatch($(elem))
		});
		return matches;
	}

	export function getTableBody(): JQuery {
		return $('#matches tbody');
	}
	
	export function getRows(): JQuery {
		return $('#matches tbody tr');
	}

	export function addMatch(): JQuery {
		var next = getNextMatchNumber();
		var match: Match = {
			matchId: null,
			roundNum: next.round,
			matchNum: next.match,
			status: 'none',
			open: false,
			teams: [],
		}

		return buildRow(getTableBody(), match);
	}

	function updateInputs(row: JQuery) {
		var match = getMatch(row);
		row.find('.round select').val(match.roundNum.toString());
		row.find('.match select').val(match.matchNum.toString());
		row.find('.status select').val(statusToString({
			status: match.status,
			open: match.open,
		}));

		match.teams.forEach((team) => {
			getTeamCell(row, team.colorId).find('select').val(team.teamId.toString());
		});
	}

	function buildRow(table: JQuery, match: Match) {
		var row = _template.clone();
		
		// attach match data to the row
		row.data('match', match);
		row.data('original', clone(match));
		row.data('teams-valid', true);
		row.data('match-valid', true);
		row.data('delete', false);

		// if the match is new (id is null), mark it as such
		row.data('is-new', match.matchId === null);
		if (row.data('is-new'))
			row.addClass('new');

		// set the initial values of each input
		updateInputs(row);

		// change handlers
		row.find('.round select').change((e) => {
			getMatch(row).roundNum = parseInt($(e.target).val());
			validateRowMatchNumbers();
			enableUndo(row);
		});

		row.find('.match select').change((e) => {
			getMatch(row).matchNum = parseInt($(e.target).val());
			validateRowMatchNumbers();
			enableUndo(row);
		});

		row.find('.status select').change((e) => {
			var data = getMatch(row);
			var status = stringToStatus($(e.target).val());
			data.status = status.status;
			data.open = status.open;
			enableUndo(row);
		});

		row.find('.team select').each((n, elem) => {
			var color = game.colors[n].colorId;
			$(elem).change((e) => {
				var data = getMatch(row);
				var newTeam = parseInt($(e.target).val());
				var teamData: Team;

				if (newTeam > 0) {
					teamData = <Team>clone(game.teamsById[newTeam.toString()]);
					teamData.colorId = color;
				}

				for (var i = 0; i < data.teams.length; i++) {
					// if team with this color exists, replace it
					if (data.teams[i].colorId == color) {
						if (newTeam > 0) {
							data.teams[i] = teamData;
						} else {
							data.teams.splice(i, 1);
							console.log('team removed', data.teams);
						}

						validateRowTeams(row);
						enableUndo(row);
						return;
					}
				}
				// if no team with this color exists, add it
				data.teams.push(teamData);
				validateRowTeams(row);
				enableUndo(row);
			});
		});

		// button handlers
		row.find('button.undo').click((e) => {
			resetRow(row);
		});

		row.find('button.delete').click((e) => {
			deleteRow(row);
		});

		row.find('button.undelete').click((e) => {
			undeleteRow(row);
		});

		// if the match is running or finished, disallow changes
		enableControls(row);

		// enhance <select> inputs
		row.hide();
		table.append(row);
		row.find('.round select, .match select, .status select').chosen({
			disable_search: true,
		});

		row.find('.team select').chosen({
			allow_single_deselect: true,
			placeholder_text: 'no team',
		});

		row.show();


		return row;
	}


	
	export function resetRow(row: JQuery) {
		if (row.data('delete')) 
			undeleteRow(row);

		row.data('match', clone(row.data('original')));
		updateInputs(row);
		row.find('select').trigger('chosen:update');
		validateRow(row);
		disableUndo(row);
	}

	export function deleteRow(row: JQuery) {
		if (row.data('is-new')) {
			row.remove();
			validateRowMatchNumbers();
		} else {
			row.data('delete', true);
			row.addClass('deleted');
			enableControls(row);
			validateRow(row);
		}
		
	}

	export function undeleteRow(row: JQuery) {
		row.data('delete', false);
		row.removeClass('deleted');
		enableControls(row);
		validateRow(row);
	}



	export function validateRow(row: JQuery): bool {
		validateRowTeams(row);
		validateRowMatchNumbers();
		return isRowValid(row);
	}

	export function isRowValid(row: JQuery): bool {
		return row.data('teams-valid') && row.data('match-valid');
	}

	function validateRowTeams(row: JQuery): void {
		var valid = true;
		var match = getMatch(row);
		var cells = row.find('.team').removeClass('invalid');

		if (row.data('delete'))
			return;

		for (var i = 0; i < match.teams.length; i++) {
			for (var j = i + 1; j < match.teams.length; j++) {
				var teamA = match.teams[i];
				var teamB = match.teams[j];

				if (teamA.teamId === teamB.teamId) {
					var columnA = _columnsByColor[teamA.colorId.toString()];
					var columnB = _columnsByColor[teamB.colorId.toString()];
					$(cells.get(columnA)).addClass('invalid');
					$(cells.get(columnB)).addClass('invalid');
					valid = false;
				}
			}
		}

		row.data('teams-valid', valid);
	}

	function validateRowMatchNumbers(): void {
		var rows = getRows();
		rows.each((i, elem) => {
			$(elem).data('match-valid', true);
		});

		rows.find('.round, .match').removeClass('invalid');

		for (var i = 0; i < rows.length; i++) {
			var rowA = $(rows.get(i));
			if (rowA.data('delete'))
				continue;

			var matchA = getMatch(rowA);
			for (var j = i + 1; j < rows.length; j++) {
				var rowB = $(rows.get(j));
				if (rowB.data('delete'))
					continue;

				var matchB = getMatch(rowB);

				if (matchA.roundNum === matchB.roundNum && matchA.matchNum === matchB.matchNum) {
					rowA.find('.round, .match').addClass('invalid');
					rowB.find('.round, .match').addClass('invalid');
					rowA.data('match-valid', false);
					rowB.data('match-valid', false);
				}
			}
		}
	}



	function enableUndo(row: JQuery): void {
		row.find('button.undo').prop('disabled', false);
	}

	function disableUndo(row: JQuery): void {
		row.find('button.undo').prop('disabled', true);
	}

	function enableControls(row: JQuery): void {
		if (row.data('delete')) {
			// if the match is deleted, disallow any changes
			row.find('select').prop('disabled', true);
		} else {
			// if the match is running or finished, disallow changes
			// to everything but the status
			var match = getMatch(row);
			if (match.status !== statuses['pending'].status) {
				row.find(':not(.status) select').prop('disabled', true);
				row.find('.status select').prop('disabled', false);
				row.find('button.delete').prop('disabled', true);
			} else {
				row.find('select').prop('disabled', false);
				row.find('button.delete').prop('disabled', false);
			}
		}
		row.find('select').trigger('chosen:update');
	}



	export function getMatch(row: JQuery): Match {
		return row.data('match');
	}

	export function getTeamCell(row: JQuery, colorId: number): JQuery {
		var cells = row.find('.team');
		return $(cells.get(_columnsByColor[colorId.toString()]));
	}

	export function getNextMatchNumber(): { round: number; match: number; } {
		var round, match;

		var rows = getRows();
		var lastRound = 1;
		var lastMatch = 1;

		rows.each((i, elem) => {
			var m = getMatch($(elem));
			if (m.roundNum > lastRound) {
				lastRound = m.roundNum;
				lastMatch = m.matchNum;
			} else if (m.roundNum == lastRound && m.matchNum > lastMatch) {
				lastMatch = m.matchNum;
			}
		});

		if (lastMatch < game.maxMatches) {
			round = lastRound;
			match = lastMatch + 1;
		} else if (lastRound < game.maxRounds) {
			round = lastRound + 1;
			match = 1;
		} else {
			round = game.maxRounds;
			match = game.maxMatches;
		}

		return { round: round, match: match };
	}



	export function saveChanges(oncomplete?: Function): void {
		var cancel = false;
		var content: JQuery = null;
		var newMatches: Match[] = [];
		var deleteMatches: Match[] = [];
		var updateMatches: Match[] = [];
		var errors: APIError[] = [];
		var errorMessages: string[] = [];
		var item = 0;

		// Asks for confirmation before saving if any matches have changed status
		function warnStatusChanges(callback: Function): void {
			var changedRows = [];
			getRows().each((i, elem) => {
				var row = $(elem);
				if (getMatch(row).status != row.data('original').status)
					changedRows.push(row);
			});

			if (changedRows.length === 0) {
				callback();
			} else {
				var content = $().add(
					$('<p>').html('Manually changing the status of a match is not recommended. '
						+ 'This is normally handled by the Game page.<br>'
						+ 'The following matches were changed:')
				).add(
					$('<ul>').append(
						changedRows.map((row) => {
							var match = getMatch(row);
							var original = row.data('original');
							var newStatus = getStatusName(match).capitalize();
							var oldStatus = getStatusName(original).capitalize();
							return $('<li>').text('Match ' 
								+ match.roundNum.toString() + '–' + match.matchNum.toString() 
								+ ': ' + oldStatus + ' → ' + newStatus);
						})
					)
				);

				Modal.confirm('Changing the status of one or more matches',
					content, {
						yes: 'I Know What I\'m Doing',
						no: 'Cancel',
					}, (result) => {
						if (result)
							callback();
						else if (oncomplete)
							oncomplete();
					});
			}
		}

		// Builds the progress dialog and determines which matches need to be changed
		// Returns false if nothing needs to be changed
		function setupSave(): bool {
			// validate rows first
			var valid = true;
			validateRowMatchNumbers();
			getRows().each((i, elem) => validateRowTeams($(elem)))
				.each((i, elem) => {
					var row = $(elem);
					if (row.data('delete'))
						return;

					var match = getMatch(row);
					if (!row.data('teams-valid')) {
						Modal.error('Duplicate team entry',
							'A team is entered more than once in match '
							+ match.roundNum.toString() + '–' + match.matchNum.toString() + '.');
						return valid = false;
					}

					if (!row.data('match-valid')) {
						Modal.error('Duplicate match entry',
							'Match ' + match.roundNum.toString() + '–' + match.matchNum.toString()
							+ ' is entered more than once in the schedule');
						return valid = false;
					}
				});

			if (!valid)
				return false;

			// build the progress dialog
			content = $().add(
				$('<p class=create>').append(
					'Creating match ',
					$('<span class=progress>').text('0'),
					' of ',
					$('<span class=max>'),
					'.'
				)
			).add(
				$('<p class=delete>').append(
					'Deleting match ',
					$('<span class=progress>').text('0'),
					' of ',
					$('<span class=max>'),
					'.'
				)
			).add(
				$('<p class=update>').append(
					'Updating match ',
					$('<span class=progress>').text('0'),
					' of ',
					$('<span class=max>'),
					'.'
				)
			);

			getRows().each((i, elem) => {
				var row = $(elem);
				var match = getMatch(row);
				if (row.data('is-new')) {
					// match needs to be created
					newMatches.push(match);
				} else if (row.data('delete')) {
					// match needs to be deleted
					deleteMatches.push(match);
				} else if (!deepEquals(match, row.data('original'))) {
					// match needs to be updated
					updateMatches.push(match);
				}
			});

			if (newMatches.length === 0 && deleteMatches.length === 0 && updateMatches.length === 0) {
				Modal.info('Nothing to Save', 'There are no changes to the match schedule. Nothing has been updated.');
				return false;
			}

			if (newMatches.length === 0)
				content.filter('.create').hide();
			else
				content.filter('.create').find('.max').text(newMatches.length.toString());

			if (deleteMatches.length === 0)
				content.filter('.delete').hide();
			else
				content.filter('.delete').find('.max').text(deleteMatches.length.toString());

			if (updateMatches.length === 0)
				content.filter('.update').hide();
			else
				content.filter('.update').find('.max').text(updateMatches.length.toString());

			Modal.dialog({
				title: 'Saving Changes',
				body: content,
				buttons: [{
					text: 'Cancel',
					action: (e) => {
						cancel = true;
						showErrors();
						if (oncomplete)
							oncomplete();
					}
				}],
			});

			return true;
		}

		// creates each match in newMatches. Continues to deleteMatch() when done
		function createMatch(): void {
			if (cancel) {
				reloadMatches();
				return;
			}

			var params = newMatches.pop();
			if (!params) {
				item = 0;
				deleteMatch();
				return;
			}

			item++;
			content.filter('.create').find('.progress').text(item.toString());

			jsdc.match.create(jsdc.match.toCreateParams(params), (err, id) => {
				if (err) {
					errorMessages.push('Failed to create match ' + params.roundNum.toString() + '–' + params.matchNum.toString() + '.');
					errors.push(err);
				}
				
				createMatch();
			});
		}

		// deletes each match in deleteMatches. Continues to updateMatch() when done
		function deleteMatch(): void {
			if (cancel) {
				reloadMatches();
				return;
			}

			var params = deleteMatches.pop();
			if (!params) {
				item = 0;
				updateMatch();
				return;
			}

			item++;
			content.filter('.delete').find('.progress').text(item.toString());

			jsdc.match.remove(params.matchId, (err) => {
				if (err) {
					errorMessages.push('Failed to delete match ' + params.roundNum.toString() + '–' + params.matchNum.toString() 
						+ ', id: ' + params.matchId.toString() + '.');
					errors.push(err);
				}
				
				deleteMatch();
			});
		}

		// Updates each match in updateMatches. Continues to reloadMatches() when done.
		function updateMatch(): void {
			if (cancel) {
				reloadMatches();
				return;
			}

			var params = updateMatches.pop();
			if (!params) {
				reloadMatches();
				return;
			}

			item++;
			content.filter('.update').find('.progress').text(item.toString());

			jsdc.match.update(jsdc.match.toUpdateParams(params), (err, match) => {
				if (err) {
					errorMessages.push('Failed to update match ' + params.roundNum.toString() + '–' + params.matchNum.toString() + '.');
					errors.push(err);
				}

				updateMatch();
			});
		}

		// Reloads the match list. Closes the dialog when done.
		function reloadMatches(): void {
			jsdc.match.getAll((err, matches) => {
				if (err) {
					errorMessages.push('Failed to reload the match list.');
					errors.push(err);
				} else {
					loadMatches(matches);
				}
				$.modal.close();
				showErrors();
				if (oncomplete)
					oncomplete();
			});
		}

		function showErrors(): void {
			if (errors.length > 0) {
				Modal.multiApiError(errors, errorMessages);
			}
		}

		// execute the process
		warnStatusChanges(() => {
			if (setupSave())
				createMatch();
			else if (oncomplete)
				oncomplete();
		});
	}

	export function filterMatches(): void {
		var round: number = parseInt($('#filter-round').val());
		var status: string = $('#filter-status').val();

		getRows().each((i, elem) => {
			var row = $(elem);
			var match = getMatch(row);

			if (round > 0 && match.roundNum !== round) {
				// filter by round
				row.addClass('hidden');
			} else if (status !== 'all' && (
				// filter by status
				(status === 'pending' && match.status !== statuses['pending'].status) ||
				(status === 'finished' && [statuses['review'].status, statuses['finished'].status].indexOf(match.status) < 0) ||
				(status === 'current' && [statuses['ready'].status, statuses['running'].status, statuses['paused'].status].indexOf(match.status) < 0)
			)) {
				row.addClass('hidden');
			} else {
				row.removeClass('hidden');
			}
		});
	}
}


