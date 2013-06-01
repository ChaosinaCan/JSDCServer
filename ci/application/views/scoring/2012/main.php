<!doctype html>
<html>
<head>
	<meta charset="utf-8">
	<title>JSDC Scoring</title>
	
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="viewport" content="width=device-width, user-scalable=no">
	
	<?php echo link_tag("style/scoring.css") ?>
	<?php echo link_tag('favicon.png', 'icon', 'image/png') ?>
	
	<script src="<?= site_url("script/jquery.js") ?>"></script>
	<script src="<?= site_url("script/jsdc.js") ?>"></script>
	<script src="<?= site_url("script/scoring-common.js") ?>"></script>
	<script src="<?= site_url("script/scoring-main.js") ?>"></script>
	<script>
		jsdc.baseurl = '<?= site_url() ?>';
		game.colors = <?= json_encode($colors) ?>;
		game.teamId = parseInt(<?= $team ?>);
		game.init(<?= json_encode($match) ?>);
		game.fouls = parseInt(<?= $fouls ?>);
	</script>
</head>
<body class="main <?= $color ?>">
	<div id="infobar">
		<a id="back" class="hidetext" href="teamselect/">Back</a>
		<span id="info"></span>
		<button id="undo" disabled>Undo</button>
	</div>

	<div id="main">
		<h3>Score</h3>
		<section id="score">
			<button id="color1" class="tile colored">x1</button>
			<button id="color2" class="tile colored">x1.5</button>
			<button id="color3" class="tile colored">x3</button>
			<button id="color4" class="tile colored">x4</button>
			<button id="bocce" class="tile">B</button>
			<button id="pong1" class="tile pong">x1</button>
			<button id="pong2" class="tile pong">x2</button>
			<button id="action" class="tile wide">Action</button>
			<button id="king" class="tile hidetext">King</button>
		</section>

		<h3>Remove</h3>
		<section>
			<button id="rem-color" class="tile remove">C</button>
			<button id="rem-pong" class="tile remove">P</button>
			<button id="rem-bocce" class="tile remove">B</button>
		</section>

		<h3>Foul (<span id="fouls"><?= $fouls ?></span>)</h3>
		<section>
			<button id="foul-personal" class="tile wide foul">Personal</button>
			<button id="foul-technical" class="tile wide foul">Technical</button>
			<button id="foul-flagrant" class="tile wide foul">Flagrant</button>
			<button id="disable" class="tile wide emergency">Disable</button>
			<button id="kill-bridge" class="tile wide emergency">Kill Bridge</button>
			<button id="emergency" class="tile wide emergency">Emergency</button>
		</section>
		
	</div>
	
	<div id="overlay" class="hidden">
		<section id="colorselect">
			<h1>Select a Color</h1>
			<ul class="colorselect">
			</ul>
			<p class="buttons">
				<button class="cancel tile wide">Cancel</button>
			</p>
		</section>
		
		<section id="confirm-disable">
			<h1>Disable</h1>
			<p>Are you sure you want to declare your robot disabled?</p>
			<p class="buttons">
				<button class="yes tile wide emergency">Yes</button>
				<button class="cancel tile wide">No</button>
			</p>
		</section>
		
		<section id="confirm-kill-bridge">
			<h1>Kill Bridge</h1>
			<p>
				Are you sure you want to disable raising and lowering the bridges?
				This should only be done if a robot is stuck under the bridge.
				This can only be undone from the admin desk.
			</p>
			<p class="buttons">
				<button class="yes tile wide emergency">Yes</button>
				<button class="cancel tile wide">No</button>
			</p>
		</section>
		
		<section id="confirm-emergency">
			<h1>Emergency</h1>
			<p>
				Are you sure you want to perform an emergency stop?
				This will pause the current match and can only be undone
				from the admin desk.
			</p>
			<p class="buttons">
				<button class="yes tile wide emergency">Yes</button>
				<button class="cancel tile wide">No</button>
			</p>
		</section>
		
		<section id="scoring-closed">
			<h1>Scoring Closed</h1>
			<p>
				Scoring is disabled for the current match.
				This may happen if the match has not yet started or your device is
				out of sync from the server. Try refreshing the page.
			</p>
			<p class="buttons">
				<button class="cancel tile wide">OK</button>
			</p>
		</section>
	</div>
	
	<div id="errors" class="hidden">
		
	</div>
</body>
</html>