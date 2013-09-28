<script>
	$(function() {
		game.teams = <?= json_encode($teams)?>;
		teams.init();
	});
</script>

<section>
	
	<table id="teams" class="x-large">
		<thead>
			<tr>
				<th class="name">Team Name</th>
				<th class="uni">University</th>
				<th class="buttons"></th>
			</tr>
		</thead>
		<tbody>
			
		</tbody>
	</table>
	
	<p>
		<button id="new">Create new team</button>
	</p>
</section>
