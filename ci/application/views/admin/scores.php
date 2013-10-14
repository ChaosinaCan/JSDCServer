
<script>
	$(document).ready(function() {
		scores.colors = <?= json_encode($colors) ?>;
		scores.actions = <?= json_encode($actions) ?>;
		scores.fouls = <?= json_encode($fouls) ?>;
		
		scores.init();
	});
</script>

<section class="column controls">
	<div>
		<h2 class="no-match">
			<span class="match-loaded">
				Round <span class="round">0</span>, 
				Match <span class="match">0</span>
			</span>
			<span class="no-match">No match loaded.</span>
		</h2>

		<p>
			<label class="block">Allow scoring changes for this match</label>
			<input type="checkbox" id="open" class="toggle yesno">
		</p>
	</div>
	
	<div>
		<div class="x-large" id="match-status">&nbsp;</div>
		<div id="score-buttons">
			<button id="load">Change match</button>
			<button id="load-current">Load current match</button>
			<button id="refresh">Refresh scores</button>
			<button id="clear-all">Delete all scores</button>
		</div>
	</div>
	
	<p id="state-warning" class="error" style="display: none">
		This match is in a non-standard state. Make sure to disallow scoring
		changes when you are done modifying scores.
	</p>
	
	<div id="new-score">
		<h2>New score entry</h2>
		<div class="twocol">
			
			<p>
				<label class="block">Action</label>
				<select id="action">
					<option value="0"></option>
				</select>
			</p>
			<p>
				<label class="block">Foul</label>
				<select id="foul">
					<option value="0"></option>
				</select>
			</p>
			<p>
				<label class="block">From team</label>
				<select id="from-team">
					<option value="0"></option>
				</select>
			</p>
			<p>
				<label class="block">On team</label>
				<select id="on-team">
					<option value="0"></option>
				</select>
			</p>
			<p>
				<label class="block">Disable (from-team)</label>
				<input type="checkbox" class="toggle yesno" id="disable">
			</p>
			<p>
				<label class="block">Disqualify (from-team)</label>
				<input type="checkbox" class="toggle yesno" id="disqualify">
			</p>
		</div>
		<p id="new-score-buttons">
			<button id="reset">Reset form</button>
			<button id="create">Create score entry</button>
		</p>
	</div>
	
</section>

<section class="column results">
	<h2>Results</h2>
	<ul id="results">
		
	</ul>
</section>

<section class="column history">
	<h2>Score history</h2>
	<div id="history-wrap">
		
	</div>
</section>

