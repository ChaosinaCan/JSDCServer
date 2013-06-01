<?php if ($invalid_credentials): ?>
	<p>Could not connect to MySQL. Check that the MYSQL server is running and your credentials are correct, then try again.</p>
<?php else: ?>
	<p>Please enter your MYSQL credentials.</p>
<?php endif; ?>

<form method="post">
	<p>
		<label for="username">Username</label>
		<input type="text" name="username" id="username" value="root">
		<label for="password">Password</label>
		<input type="password" name="password" id="password">
	</p>
	
	<p>
		<input type="submit" value="Connect to MYSQL">
	</p>
</form>
