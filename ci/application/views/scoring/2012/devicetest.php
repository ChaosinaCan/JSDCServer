<!doctype html>
<html>
<head>
	<meta charset="utf-8">
	<title>JSDC Scoring</title>

	<meta name="HandheldFriendly" content="true">
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="viewport" content="width=device-width">

	<?php echo link_tag("style/scoring.css") ?>
	<?php echo link_tag("style/scoring-test.css") ?>
	<?php echo link_tag('favicon.png', 'icon', 'image/png') ?>

	<script src="<?= site_url("script/jquery.js") ?>"></script>
	<script src="<?= site_url("script/jsdc.js") ?>"></script>
	<script src="<?= site_url("script/scoring-common.js") ?>"></script>
	<script src="<?= site_url("script/scoring-test.js") ?>"></script>
	<script>
		jsdc.baseurl = '<?= site_url() ?>';
	</script>
</head>
<body class="test">
	<a href="<?= site_url('/scoring/') ?>" class="button">Back</a>

	<table id="tests">
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