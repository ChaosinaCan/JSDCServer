<?php
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

	<?php echo link_tag("css/scoring/base.css") ?>
	<?php echo link_tag('favicon.png', 'icon', 'image/png') ?>

	<script src="<?= site_url("js/jquery.js") ?>"></script>
	<script src="<?= site_url("js/jquery.single.js") ?>"></script>
	<script src="<?= site_url("js/jquery.simplemodal.min.js") ?>"></script>
	<script src="<?= $clock_address ?>socket.io/socket.io.js"></script>
	<script src="<?= site_url("js/admin/base.js") ?>"></script>
	<script src="<?= site_url("js/scoring/teamselect.js") ?>"></script>

	<script>
		jsdc.baseUrl = '<?= site_url() ?>';
		jsdc.clock.baseUrl = '<?= $clock_address ?>';
		jsdc.clock.connect(teamselect.onconnect);

		// prevent a silly scrolling glitch when the page is redirected here
		window.addEventListener('load', function() {
			setTimeout(function() {
				window.scroll(0, document.body.scrollY);
			}, 100)

		}, false);
	</script>
</head>
<body class="teamselect">
	<header id="branding">
		<h1>Select Your Team</h1>
	</header>

	<h2>
		Round <span id="round"><?= $m_round ?></span>, Match <span id="match"><?= $m_match ?></span>
	</h2>

	<ul id="teams" class="colorselect x-large">
	<?php foreach ($match->teams as $team) : ?>
		<li>
			<a href="<?= site_url('scoring/') ?>?team=<?= $team->teamId ?>" class="<?= $colors[$team->colorId]->name ?>">
				<?= $team->name ?>
			</a>
		</li>
	<?php endforeach; ?>
	</ul>

	<div id="toolbar">
		<div class="appbar">
			<button id="logout" class="command" title="Log Out">&#xe125;</button>
			<button id="devicetest" class="command" title="Test Device">&#xe10b;</button>
			<button id="refresh" class="command" title="Refresh">&#xe149</button>
		</div>
	</div>

	<script>
		$('#logout').click(function() {
			window.location.assign('logout');
		})

		$('#devicetest').click(function() {
			window.location.assign('devicetest');
		})

		$('#refresh').click(function() {
			window.location.reload();
		})
	</script>
</body>
</html>