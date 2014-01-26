<script>
	$(function() {
		game.maxRounds = <?= $max_rounds ?>;
		game.maxMatches = <?= $max_matches ?>;
		game.maxTeams = <?= $max_teams ?>;
		game.colors = <?= json_encode($colors) ?>;
		game.actions = <?= json_encode($actions) ?>;
		game.fouls = <?= json_encode($fouls) ?>;

		game.init();
	});
</script>

<section class="column teams">
	<h2 class="xx-large light no-match">
		<span class="match-loaded">
		Round <span class="round">0</span>, Match <span class="match">0</span>
		</span>
		<span class="no-match">No match loaded.</span>
	</h2>
	<ul id="teams">
	</ul>
</section>

<section class="column controls">
	<div id="clock" class="xx-large">
		<time>00:00</time>
	</div>
	<div id="controls" class="unstarted">
		<p>
			<button id="start" disabled>Start match</button>
			<button id="pause">Pause match</button>
			<button id="resume">Resume match</button>
		</p>
		<p>
			<button id="stop" disabled>End match</button>
		</p>
	</div>
	<div id="controls-2">
		<h2>Match Controls</h2>
		<p>
			<button id="load-match">Load match</button>
			<button id="refresh-scores">Refresh scores</button>
			<button id="emergency">Emergency</button>
			<button id="reset-field">Reset field</button>
		</p>
	</div>
	<div id="display">
		<h2>Display Controls</h2>
		<p>
			<button id="show-video">Show a video</button>
		</p>
	</div>
	<div id="connection">
		<h2>Clock Server</h2>
		<div class="status spinner"></div>
	</div>
</section>

<section class="column history">
	<h2 class="xx-large light">Score History</h2>
	<div id="history-wrap">
	</div>
</section>