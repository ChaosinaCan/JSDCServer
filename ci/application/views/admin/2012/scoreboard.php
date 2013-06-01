<script>
	clockAddress = '<?= $clock_address ?>';
	jsdc.baseurl = '<?= site_url() ?>';
	
	$(document).ready(function() {
		game.maxTeams = <?= $max_teams ?>;
		game.colors = <?= json_encode($colors) ?>;
		game.actions = <?= json_encode($actions) ?>;
		game.fouls = <?= json_encode($fouls) ?>;

		scoreboard.init();
	});
</script>

<section class="status">
	<div id="period"></div>
	<div id="time">10:00</div>
	<div id="match">
		<span class="round"></span>
		<span class="match"></span>
	</div>
</section>

<section class="scores" style="display:block">
	
</section>

<section class="matchup" style="display:none">
	<div class="team red" style="background-image: url('/uploads/test1.png')">
		<div class="info">
			<span class="name">Dancing Bears</span>
			<span class="uni">University of Illinois at Urbana-Champaign</span>
		</div>
	</div>
	<div class="team green" style="background-image: url('/uploads/test2.png')">
		<div class="info">
			<span class="name">EDT Pazuzu</span>
			<span class="uni">University of Illinois at Chicago</span>
		</div>
	</div>
	<div class="team yellow" style="background-image: url('/uploads/test3.png')">
		<div class="info">
			<span class="name">EDT Raijin</span>
			<span class="uni">University of Illinois at Chicago</span>
		</div>
	</div>
	<div class="team blue">
		<div class="info">
			<span class="name">EDT Sephiroth</span>
			<span class="uni">University of Illinois at Chicago</span>
		</div>
	</div>
</section>

<!-- because webkit goes black when using the fullscreen API -->
<div id="webkit-hack"></div>

<div id="tools">
	<div class="container">
		<button id="fullscreen" title="Fullscreen"></button>
		<button id="ratio" title="Change aspect ratio"></button>
		<button id="refresh" titl="Refresh"></button>
	</div>
</div>
