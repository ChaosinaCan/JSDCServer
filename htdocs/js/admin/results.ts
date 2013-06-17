/// <reference path="base.ts" />

interface ScoreTotal {
	team: Team;
	score: number;
	fouls: number;
}

module matchresults {
	export var totals: ScoreTotal[];
	export var highscore: ScoreTotal;
	var totalsByTeam: { [key: string]: ScoreTotal; } = {};

	export function init(teams: Team[]) {
		teams = jsdc.team.parse(teams);
		highscore = {
			team: null,
			score: 0,
			fouls: 0,
		}

		totals = teams.map((team) => {
			var total = {
				team: team,
				score: 0,
				fouls: 0,
			}

			totalsByTeam[team.teamId.toString()] = total;

			return total;
		});

		jsdc.matchresult.getAll((err, results) => {
			results.forEach((result) => {
				var total = totalsByTeam[result.teamId.toString()];
				total.score += result.score;
				total.fouls += result.fouls;

				if (result.score > highscore.score) {
					highscore.team = total.team;
					highscore.score = result.score;
				}
			});

			totals.sort((a, b) => b.score - a.score);

			$('table tbody').append(
				totals.map((total, i) => {
					return $('<tr>').append(
						$('<td>').text((i + 1).toString()),
						$('<td>').text(total.team.name),
						$('<td>').text(total.score.toString())
					);
				})
			);

			$('#highscore-team').text(highscore.team.name);
			$('#highscore-score').text(highscore.score.toString());
		});
	}
}