<script>
	$(function() {
		scoreboard.maxTeams = <?= $max_teams ?>;
		scoreboard.maxRounds = <?= $max_rounds ?>;
		scoreboard.colors = <?= json_encode($colors) ?>;
		scoreboard.actions = <?= json_encode($actions) ?>;
		scoreboard.fouls = <?= json_encode($fouls) ?>;
		scoreboard.init();
	});
</script>

<div id="view-scoreboard" class="view current">
	<div id="main">
		<div id="field">
			<time id="clock" class="xx-large">7:00</time>
			<!-- generated field goes here -->
		</div>

		<div id="teams">
			<h2 class="xx-large light">
				<span class="normal-match">Round <span class="round">0</span>, Match <span class="match">0</span></span>
				<span class="special-match"></span>
			</h2>
			<ul></ul>
		</div>
	</div>

	<ul id="legend" class="x-large">
		<li><span class="ion-ios7-browsers"></span> Powered Territories</li>
		<li><span class="ion-ios7-browsers-outline"></span> Unpowered Territories</li>
		<li><span class="ramp ion-android-arrow-up-right"></span> Ramp</li>
		<li><span class="ion-flash"></span> Power Source</li>
	</ul>
</div><!-- #view-scoreboard -->

<div id="view-pregame" class="view">
	<h1 class="x-large center light">
		Up next:
		<span class="normal-match">Round <span class="round">1</span>, Match <span class="match">1</span></span>
		<span class="special-match"></span>
	</h1>
	<div id="teamcards"></div>
</div>

<div id="view-videos" class="view">
	<div id="video-background">
		<video id="video" autoplay>Cannot display video.</video>
	</div>
	<ul id="video-list"></ul>
</div>

<div id="toolbar">
	<div class="appbar">
		<button id="change-view-pregame" class="command" title="Pre-game">&#xf302;</button>
		<button id="change-view-scoreboard" class="command" title="Scoreboard">&#xf2d6;</button>
		<button id="change-view-videos" class="command" title="Videos">&#xf18e;</button>

		<hr class="split">

		<button id="refresh" class="command" title="Refresh">&#xf21c;</button>
		<button id="fullscreen" class="command" title="Fullscreen">&#xf25e;</button>
		<button id="restore" class="command" title="Restore">&#xf267;</button>
	</div>
</div>