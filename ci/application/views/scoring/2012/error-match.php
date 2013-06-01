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
</head>
<body class="teamselect">
	<h1>Error</h1>
	<p>
		There is no match currently in progress.
		Please wait until the administrator has loaded a match, 
		then refresh the page.
	</p>
	<p>
		<button id="refresh">Refresh</button>
	</p>
	
	<script>
		$('#refresh').click(function() {
			window.location.reload();
		});
	</script>
</body>
</html>
