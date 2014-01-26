<!doctype html>
<html>
<head>
	<meta charset="utf-8">
	<title>JSDC Scoring</title>

	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="viewport" content="width=device-width, user-scalable=no">

	<?= link_tag("css/scoring/base.css") ?>
	<?= link_tag('favicon.png', 'icon', 'image/png') ?>

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