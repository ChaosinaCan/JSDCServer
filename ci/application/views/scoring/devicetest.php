<!doctype html>
<html>
<head>
	<meta charset="utf-8">
	<title>JSDC Scoring</title>

	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="viewport" content="width=device-width, user-scalable=no">

	<?= link_tag("css/scoring/base.css") ?>
	<?= link_tag("css/scoring/devicetest.css") ?>
	<?= link_tag('favicon.png', 'icon', 'image/png') ?>

	<script src="<?= site_url("js/jquery.js") ?>"></script>
	<script src="<?= site_url("js/jquery.single.js") ?>"></script>
	<script src="<?= site_url("js/jquery.simplemodal.min.js") ?>"></script>
	<script src="<?= site_url("js/admin/base.js") ?>"></script>
	<script src="<?= site_url("js/scoring/devicetest.js") ?>"></script>
	<script src="<?= $clock_address ?>socket.io/socket.io.js"></script>

	<script>
		jsdc.baseUrl = '<?= site_url() ?>';
		jsdc.clock.baseUrl = '<?= $clock_address ?>';
		jsdc.authenticate('JSDC4Life');
	</script>
</head>
<body class="test">
	<a href="<?= site_url('/scoring/') ?>" class="back-button xx-large">&#xe071;</a>
	<h1>Device Test</h1>

	<table id="tests" class="x-large">
		<thead>
			<tr>
				<th>Test</th>
				<th>Result</th>
			</tr>
		</thead>
		<tbody>
			<tr id="javascript" class="failed">
				<td>Basic JavaScript</td>
				<td>Failed</td>
			</tr>
			<tr id="jquery">
				<td>jQuery support</td>
				<td>Failed</td>
			</tr>
		</tbody>
	</table>

	<p>
		If all of the tests passed, your device should be capable of running
		the scoring application.
	</p>
</body>
</html>