<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<title>JSDC Admin</title>
	<?php echo link_tag('css/admin/base.css') ?>
	<?php echo link_tag('css/admin/index.css') ?>
	<?php echo link_tag('css/common/ionicons.css') ?>
	<?php echo link_tag('favicon.png', 'icon', 'image/png') ?>
</head>
<body class="columns">
	<header id="branding">
		<h1>JSDC Admin</h1>
	</header>
	<div id="content">
		<section class="column">
			<nav>
				<a href="game" class="wide">Game Control</a>
				<a href="matches">Matches</a>
				<a href="scores">Scores</a>
				<a href="teams">Teams</a>
				<a href="users">Users</a>
				<a href="rules">Rules</a>
				<a href="results">Results</a>
			</nav>
		</section>

		<section class="column">
			<nav>
				<a href="scoreboard" class="wide">Scoreboard</a>
				<a href="schedule" class="wide">Schedule</a>
				<a href="audio">Audio</a>
				<a href="debug">Debug</a>
				<a href="../install">Setup</a>
				<a href="about">About</a>
			</nav>
		</section>
	</div>
</body>
</html>