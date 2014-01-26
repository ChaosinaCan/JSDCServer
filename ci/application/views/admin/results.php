<script>
	$(function() {
		matchresults.init(<?= json_encode($teams)?>);
	});
</script>

<section class="column">
	<table class="x-large">
		<thead>
			<tr>
				<td></td><td>Team</td><td>Score</td>
			</tr>
		</thead>
		<tbody></tbody>
	</table>
</section>

<section class="column">
	<h2>High score</h2>
	<div class="x-large">
		<span id="highscore-team"></span> <span id="highscore-score"></span>
	</div>
</section>