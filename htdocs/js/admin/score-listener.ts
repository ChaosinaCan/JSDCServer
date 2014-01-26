/// <reference path="base.ts" />

interface ScoreInfo {
	team: Team;
	score: number;
	fouls: number;
	disabled: boolean;
	disqualified: boolean;
}

/**
 * Listens to score change events on the clock server and keeps track of the current match score
 * Events:
 *		score: Score -- Fired when a new score is received
 *		loadscores: Score[] -- Fired when the score list for a match is loaded
 *		resultchanged: ScoreInfo -- Fired when the score info for a team changes
 *		scoredeleted: score ID -- Fired when a score entry is deleted
 *		matchchanged: Match -- Fired when the ScoreListener's match changes
 */
class ScoreListener implements EventTarget {
	private _match: Match;
	private _scores: Score[] = [];
	private _actionsById: ActionMap = {};
	private _foulsById: FoulMap = {};
	private _teamsById: TeamMap = {};
	private _scoresByTeam: { [key: string]: ScoreInfo; } = {};
	private _listeners: { [key: string]: EventListener[]; } = {};

	get match() { return this._match }
	set match(item: Match) { this._setMatch(item) }

	constructor (match?: Match, actions?: Action[], fouls?: Foul[]) {
		var clock = jsdc.clock;
		bindMemberFunctions(this);

		this.match = match || null;

		clock.connect((err) => {
			console.log(clock);
			clock.join('scoring');
			clock.on('new score', this._onScore);
			clock.on('score deleted', this._onScoreDeleted);
			clock.on('results changed', this._onResultsChanged);
		});

		if (actions) {
			this._actionsById = <ActionMap><any>actions.indexByProperty('actionId');
		} else {
			jsdc.action.getAll((err, actions) => {
				if (err) {
					Modal.apiError(err, 'Failed to get the list of actions');
				} else {
					this._actionsById = <ActionMap><any>actions.indexByProperty('actionId');
				}
			});
		}

		if (fouls) {
			this._foulsById = <FoulMap><any>fouls.indexByProperty('foulId');
		} else {
			jsdc.foul.getAll((err, fouls) => {
				if (err) {
					Modal.apiError(err, 'Failed to get the list of fouls');
				} else {
					this._foulsById = <FoulMap><any>fouls.indexByProperty('foulId');
				}
			});
		}
	}

	reload(): void {
		this._setMatch(this.match);
	}

	private _setMatch(match: Match) {
		this._match = match;
		this._scores = [];
		this._teamsById = {};
		this._scoresByTeam = {};

		if (match) {
			jsdc.score.getByMatch(this.match.matchId, (err, scores) => {
				if (err) {
					Modal.apiError(err, 'Failed to get match scores');
				} else {
					this._scores = scores;
					this._event('loadscores', this._scores);
				}
			});

			this._teamsById = <TeamMap><any>match.teams.indexByProperty('teamId');
			match.teams.forEach((team) => {
				this._scoresByTeam[team.teamId.toString()] = {
					team: team,
					score: 0,
					fouls: 0,
					disabled: false,
					disqualified: false,
				}
			});

			this._onMatchChanged();
		}
		this._refresh();
	}

	private _addScore(score: Score) {
		if (score.matchId !== this.match.matchId) {
			console.log('Entry ignored. current match: ' + this.match.matchId + ', score match: ' + score.matchId);
			return;
		}

		this._scores.push(score);

		if (score.actionId > 0) {
			var action = this.getAction(score.actionId);
			var fromInfo = this.getInfo(score.fromTeamId);
			var onInfo = this.getInfo(score.onTeamId);
			if (fromInfo) {
				fromInfo.score += action.fromValue;
			}
			if (onInfo) {
				onInfo.score += action.onValue;
			}
		}

		if (score.foulId > 0) {
			var foul = this.getFoul(score.foulId);
			var info = this.getInfo(score.fromTeamId);
			info.score += foul.value;
			info.fouls += 1;
		}

		if (score.disabled) {
			this.getInfo(score.fromTeamId).disabled = true;
		}

		if (score.disqualified) {
			this.getInfo(score.fromTeamId).disqualified = true;
		}

		if (score.fromTeamId > 0) {
			this._event('resultchanged', this.getInfo(score.fromTeamId));
		}
		if (score.onTeamId > 0) {
			this._event('resultchanged', this.getInfo(score.onTeamId));
		}
	}

	private _refresh() {
		if (this.match) {
			jsdc.matchresult.getByMatch(this.match.matchId, (err, results) => {
				if (err) {
					Modal.apiError(err, 'Failed to get match results');
				} else {
					results.forEach((result) => {
						this._setInfo(result.teamId, result);
					});
				}
			});
		}
	}

	getAction(id: number) {
		return this._actionsById[id.toString()] || null;
	}

	getFoul(id: number) {
		return this._foulsById[id.toString()] || null;
	}

	getTeam(id: number) {
		return this._teamsById[id.toString()] || null;
	}

	getInfo(team: number) {
		return this._scoresByTeam[team.toString()];
	}

	private _setInfo(team: number, result: MatchResult) {
		this._scoresByTeam[team.toString()] = {
			team: this.getTeam(team),
			score: result.score,
			fouls: result.fouls,
			disabled: result.disabled,
			disqualified: result.disqualified,
		}

		this._event('resultchanged', this.getInfo(team));
	}

	private _onScore(data) {
		console.log('new score', data);

		var score = jsdc.score.parseOne(data);
		this._addScore(score);
		this._event('score', score);
	}

	private _onScoreDeleted(data) {
		console.log('score deleted', data);

		var id = parseInt(data.id);
		this._refresh();
		this._event('scoredeleted', id);
	}

	private _onResultsChanged(data) {
		data = toArray(data);
		console.log('results changed', data);

		var results = jsdc.matchresult.parse(data);
		results.forEach((result) => {
			if (result.matchId === this.match.matchId) {
				this._setInfo(result.teamId, result);
			}
		});
	}

	private _onMatchChanged() {
		this._event('matchchanged', this.match);
	}

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

	dispatchEvent(evt: Event): boolean {
		if (evt.type in this._listeners) {
			this._listeners[evt.type].forEach((listener) => {
				listener.apply(this, [evt]);
			});
		}
		return true;
	}
}

class ScoreList {
	private _scores: ScoreListener = null;
	private _colorsById: ColorMap = {};
	private _rowsByScoreId: { [key: string]: JQuery; } = {};
	private _allowDelete: boolean = false;
	private _table: JQuery;
	private _template: JQuery;

	get table() { return this._table }

	constructor (scores: ScoreListener, colors: Color[], allowDelete?: boolean) {
		bindMemberFunctions(this);
		this._scores = scores;
		this._allowDelete = allowDelete;

		scores.addEventListener('matchchanged', this._onMatchChange);
		scores.addEventListener('loadscores', this._onLoadScores);
		scores.addEventListener('score', this._onNewScore);
		scores.addEventListener('scoredeleted', this._onScoreDeleted);

		this._colorsById = <ColorMap><any>colors.indexByProperty('colorId');

		this._table = $('<table class=score-list>');
		this._template = $('<tr>').append(
			$('<td class=name>'),
			$('<td class=from>'),
			$('<td class=on>'),
			$('<td class=status>')
		);

		if (allowDelete) {
			console.log('allow delete');
			this._template.find('.name').append(
				$('<button class=delete>').html('&#xe106')
			);
			console.log(this._template);
		}
	}

	getColor(id: number): string {
		var color = this._colorsById[id.toString()];
		return color ? color.name : null;
	}

	private _onMatchChange(e: CustomEvent) {
		this._table.empty();
		this._rowsByScoreId = {};
	}

	private _onLoadScores(e: CustomEvent) {
		//console.log('loadscores', e.detail);
		this._table.hide();
		var loading = $('<p class=x-large>').text('Loading...').insertBefore(this._table);

		var scores: Score[] = <any>e.detail;
		scores.forEach(this._addScore);
		this._table.show();
		loading.remove();
	}

	private _onNewScore(e: CustomEvent) {
		//console.log('score', e.detail);
		var score: Score = <any>e.detail;
		this._addScore(score);
	}

	private _onScoreDeleted(e: CustomEvent) {
		//console.log('scoredeleted', e.detail);
		var id: number = <any>e.detail;
		this._removeScore(id);
	}

	private _addScore(score: Score) {
		var name = '';
		var fromValue = 0;
		var onValue = 0;
		var fromColorId = score.fromTeamId > 0 ? this._scores.getTeam(score.fromTeamId).colorId : 0;
		var onColorId = score.onTeamId > 0 ? this._scores.getTeam(score.onTeamId).colorId : 0;
		var fromColor = this.getColor(fromColorId);
		var onColor = this.getColor(onColorId);

		if (score.actionId > 0) {
			var action = this._scores.getAction(score.actionId);
			if (action) {
				name = action.name.capitalize();
				fromValue = action.fromValue;
				onValue = action.onValue;
			} else {
				name = 'unknown action';
			}
		}

		if (score.foulId > 0) {
			var foul = this._scores.getFoul(score.foulId);
			if (foul) {
				name = foul.name.capitalize() + ' foul';
				fromValue = foul.value;
				onValue = 0;
			} else {
				name = 'unknown foul';
			}
		}

		if (name === '') {
			if (score.disabled) {
				name = 'disable';
			} else if (score.disqualified) {
				name = 'disqualify';
			}
		}

		var row = this._template.clone(true);
		row.find('.name').append(name);

		if (this._allowDelete) {
			row.find('button.delete').click(this._deleteScore.bind(null, score.id));
		}

		if (fromColor) {
			var span = $('<span>').addClass(fromColor);
			row.find('.from').append(span);
			if (fromValue !== 0) {
				span.text((fromValue > 0 ? '+' : '−') + Math.abs(fromValue));
			}
		}

		if (onColor) {
			var span = $('<span>').addClass(onColor);
			row.find('.on').append(span);
			if (onValue !== 0) {
				span.text((onValue > 0 ? '+' : '−') + Math.abs(onValue));
			}
		}

		if (score.disabled) {
			row.find('.status').append($('<span>').addClass(fromColor).text('disable'));
		}

		if (score.disqualified) {
			row.find('.status').append($('<span>').addClass(fromColor).text('disqual'));
		}

		this._rowsByScoreId[score.id.toString()] = row;
		var firstRow = this._table.find('tr').first();
		if (firstRow.length > 0) {
			firstRow.before(row);
		} else {
			this._table.append(row);
		}
	}

	private _removeScore(id: number) {
		this._rowsByScoreId[id.toString()].remove();
	}

	private _deleteScore(id: number) {
		this._rowsByScoreId[id.toString()].addClass('deleted')
			.find('button.delete').prop('disabled', true);

		jsdc.score.remove(id, (err) => {
			if (err) {
				Modal.apiError(err, 'Failed to delete score entry');
			} else {
				this._removeScore(id);
			}
		});
	}
}