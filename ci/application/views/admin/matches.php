
<script>
	$(function() {
		matches.maxRounds = <?= $max_rounds ?>;
		matches.maxMatches = <?= $max_matches ?>;
		matches.maxTeams = <?= $max_teams ?>;
		matches.colors = <?= json_encode($colors) ?>;
		matches.teams = <?= json_encode($teams) ?>;
		matches.init();
		matches.loadMatches(<?= json_encode($matches) ?>);
	});
</script>

<section>
	<p id="filters">
		<label>
			Filter By Round
			<select id="filter-round">
				<option value="0"></option>
			</select>
		</label>
		
		<label>
			Filter By Status
			<select id="filter-status">
				<option value=""></option>
				<option value="pending">Pending matches</option>
				<option value="current">Current matches</option>
				<option value="finished">Finished matches</option>
			</select>
		</label>
		
	</p>
	
	<div id="table-wrap">
		<table id="matches">
			<thead>
				<tr></tr>
			</thead>
			<tbody></tbody>
		</table>
	</div>
	
	<p id="buttons">
		<button id="new-match">New Match</button>
		<button id="save">Save Changes</button>
	</p>
	
</section>
