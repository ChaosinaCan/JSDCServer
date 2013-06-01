<?php
	//print_r($match);
	//print_r($colors);
	$m_round = $match->roundNum;
	$m_match = $match->matchNum;
?>
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
	<script>
		jsdc.baseurl = '<?= site_url() ?>';
	</script>
</head>
<body class="teamselect">
	<h1>Select Your Team</h1>
	<p id="matchinfo">
		Round <span id="round"><?= $m_round ?></span> &ndash; Match <span id="match"><?= $m_match ?></span>
	</p>

	<ul id="teams" class="colorselect">
	<?php foreach ($match->teams as $team) : ?>
		<li>
			<a href="<?= site_url('scoring/') ?>?team=<?= $team->teamId ?>">
				<span class="color <?= $colors[$team->colorId]->name ?>"></span>
				<span class="name"><?= $team->name ?></span>
			</a>
		</li>
	<?php endforeach; ?>
	</ul>

	<p>
		<button id="logout">Logout</button>
	</p>
	
	<script>
		$('#logout').click(function() {
			window.location.assign('logout');
		})
	</script>
</body>
</html>