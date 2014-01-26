<?php
if (!isset($installed)) {
	$installed = false;
}

$title = $installed ? 'Database Already Configured' : 'Ready to Configure Database';
$button = $installed ? 'Repair' : 'Configure';
$action = $installed ? 'repair_database' : 'create_database';
?>
<!doctype html>
<html>
	<head>
		<title>Database Setup</title>
	</head>
	<body>
		<h1><?= $title ?></h1>

		<form method="post">
			<p>
				<input type="hidden" name="<?= $action ?>" value="true">
				<input type="submit" value="<?= $button ?>" class="big">
			</p>
		</form>
	</body>
</html>