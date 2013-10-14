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

	<dl id="legend" class="x-large">
		<dt class="color">◼</dt>
		<dd>Powered Territory</dd>
		<dt class="color">◻</dt>
		<dd>Unpowered Territory</dd>
		<dt>✦</dt>
		<dd>Control Point</dd>
		<dt>⚡</dt>
		<dd>Power Source</dd>
	</dl>
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
		<button id="change-view-pregame" class="command" title="Pre-game">&#xe154;</button>
		<button id="change-view-scoreboard" class="command" title="Scoreboard">&#xe121;</button>
		<button id="change-view-videos" class="command" title="Videos">&#xe116;</button>
		
		<hr class="split">
		
		<button id="res768" class="command" title="1366 × 768">&#xe1e4</button>
		<button id="res900" class="command" title="1600 × 900">&#xe1e4</button>
		<button id="res1080" class="command" title="1080 × 920">&#xe1e4</button>
		<button id="refresh" class="command" title="Refresh">&#xe149;</button>
		<button id="fullscreen" class="command" title="Fullscreen">&#xe1d9;</button>
		<button id="restore" class="command" title="Restore">&#xe1d8;</button>
	</div>
</div>
