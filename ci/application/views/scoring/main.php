<!doctype html>
<html>
<head>
	<meta charset="utf-8">
	<title>JSDC Scoring</title>

	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="viewport" content="initial-scale=1.0, user-scalable=no">

	<?php echo link_tag("css/scoring/base.css") ?>
	<?php echo link_tag("css/scoring/scoring.css") ?>
	<?php echo link_tag('favicon.png', 'icon', 'image/png') ?>

	<script src="<?= site_url("js/jquery.js") ?>"></script>
	<script src="<?= site_url("js/jquery.single.js") ?>"></script>
	<script src="<?= site_url("js/jquery.simplemodal.min.js") ?>"></script>
	<script src="<?= $clock_address ?>socket.io/socket.io.js"></script>

	<script src="<?= site_url("js/admin/base.js") ?>"></script>
	<script src="<?= site_url("js/admin/field-renderer.js") ?>"></script>
	<script src="<?= site_url("js/scoring/scoring.js") ?>"></script>

	<script>
		Modal.mobile = true;
		jsdc.baseUrl = '<?= site_url() ?>';
		jsdc.clock.baseUrl = '<?= $clock_address ?>';
		jsdc.authenticate('JSDC4Life');

		scoring.colors = <?= json_encode($colors) ?>;
		scoring.actions = <?= json_encode($actions) ?>;
		scoring.fouls = <?= json_encode($fouls) ?>;
		scoring.team = <?= json_encode($team) ?>;
		scoring.match = <?= json_encode($match) ?>;

		$(function() {
			scoring.init();
		})
	</script>
</head>
<body class="main <?= $color ?>">
	<a href="<?= site_url('/scoring/teamselect/') ?>" class="back-button xx-large"></a>
	<h1><?= $team->name ?></h1>
	<div id="field-container">
		<div id="field"></div>
	</div>

	<div id="buttons">
		<button class="x-large" id="disabled">Disabled</button>
		<button class="x-large" id="foul-personal">Personal foul</button>
		<!--<button class="x-large" id="foul-technical">Tech. foul</button>-->
		<button class="x-large" id="action">Action</button>

		<button class="x-large" id="emergency">Emergency</button>
		<button class="x-large" id="foul-flagrant">Flagrant foul</button>
		<button class="x-large" id="ramp">Ramp</button>
	</div>
</body>
</html>