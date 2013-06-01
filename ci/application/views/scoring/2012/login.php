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
<body class="login">
	<h1>JSDC Scoring</h1>
	<h3>Please log in</h3>
	<form action="teamselect">
		<p>
			<input type="text" name="username" placeholder="Username">
		</p>
		<p>
			<input type="password" name="password" placeholder="Password">
		</p>
		<p>
			<input type="submit" value="Login">
		</p>
	</form>

	<p>
		<a href="<?= site_url('/scoring/devicetest/') ?>">Is my device supported?</a>
	</p>
</body>
</html>