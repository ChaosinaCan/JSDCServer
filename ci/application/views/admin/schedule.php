<script>
	$(function() {
		game.maxTeams = <?= $max_teams ?>;
		game.colors = <?= json_encode($colors) ?>;
		
		schedule.init();
	});
</script>

<section class="top">
	<div class="match no-match" id="current">
		<h2>Current:
			<span class="match-loaded">
				Round <span class="round"></span>,
				Match <span class="match"></span>
			</span>
			<span class="no-match">No Match</span>
		</h2>
		<ul class="x-large">
		</ul>
	</div>
	<div class="match no-match" id="next">
		<h2>Up next:
			<span class="match-loaded">
				Round <span class="round"></span>,
				Match <span class="match"></span>
			</span>
			<span class="no-match">No Match</span>
		</h2>
		<ul class="x-large">
		</ul>
	</div>
</section>

<section class="bottom x-large">
	
	<table id="match-header">
		<tr></tr>
	</table>
	<div id="match-scroller">
		<table id="matches"></table>
	</div>
</section>


<div id="toolbar">
	<div class="appbar">
		<button id="start-scroll" class="command" title="Start Scrolling">&#xe102;</button>
		<button id="stop-scroll" class="command" title="Stop Scrolling">&#xe103;</button>
		<button id="settings" class="command" title="Settings">&#xe115;</button>
		<button id="refresh" class="command" title="Refresh">&#xe149;</button>
		<button id="fullscreen" class="command" title="Fullscreen">&#xe1d9;</button>
		<button id="restore" class="command" title="Restore">&#xe1d8;</button>
	</div>
</div>