<script>
	$(document).ready(function() {
		teams.init(<?= json_encode(index_by_prop($teams, 'teamId'))?>);
	});
</script>

<section>
	
	<ul id="teams" class="med">
		<?php foreach ($teams as $team) : ?>
		<li data-id="<?= $team->teamId ?>">
			<div class="info">
				<span class="name"><?= $team->name ?></span>
				<span class="uni"><?= $team->university ?></span>
			</div>
		</li>
		<?php endforeach; ?>
	</ul>
	
	<p>
		<button id="new" class="med">Create New Team</button>
	</p>
</section>


<div id="edit">
	<div class="left">
		<p>
			<label for="team">Team</label><input id="team" type="text" class="med" required>
		</p>
		<p>
			<label for="university">University</label><input id="university" type="text" class="med" required>
		</p>
		<p>
			<label for="bio">Bio</label><textarea id="bio" class="med"></textarea>
		</p>
	</div>

	<div class="right">
		<p>
			<label for="abbr">Abbr</label><input id="abbr" type="text" maxlength="5" class="med">
		</p>
		<form id="image-form">
		<p>
			<label for="image">Image</label><input id="image" type="file" class="med">
		</p>
		</form>
		<p>
			<img id="image-thumb">
		</p>
	</div>

	<p class="buttons">
		<button id="delete" class="med">Delete</button>
		<button id="save" class="med">Save</button>
		<button id="cancel" class="med">Cancel</button>
	</p>
</div>