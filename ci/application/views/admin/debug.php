<section class="column">

	<div id="api-request">
		<h2>API Request</h2>

		<p id="request-type">
			<label>
				Datatype
				<select name="datatype" id="datatype">
					<option value="action">Action</option>
					<option value="color">Color</option>
					<option value="foul">Foul</option>
					<option value="match">Match</option>
					<option value="matchresult">Match Result</option>
					<option value="permissions">Permissions</option>
					<option value="score">Score</option>
					<option value="team">Team</option>
					<option value="user">User</option>
				</select>
			</label>

			<label>
				<input type="radio" name="method" id="method-get" value="get" checked>
				Get
			</label>
			<label>
				<input type="radio" name="method" id="method-post" value="post">
				Post
			</label>

			<label id="post-fields">
				Method
				<select name="post-method" id="post-method">
					<option value="create">Create</option>
					<option value="update">Update</option>
					<option value="delete">Delete</option>
					<option value="reset">Reset</option>
				</select>
			</label>
		</p>

		<label for="params">Request Parameters</label>
		<div class="autoexpand" id="params-container">
			<pre><span></span><br></pre>
			<textarea id="params" placeholder="param = JSON data (end multiline JSON objects with a semicolon)" spellcheck="false"></textarea>
		</div>

		<p>
			<button id="send" class="inline">Send</button>
		</p>

		<h3>Current Request</h3>
		<p>
			<output id="queryurl"></output><br>
			<output id="queryurl-encoded"></output>
		</p>
		<p><output><pre id="querybody"></pre></output></p>

		<h3>Response</h3>
		<p>
			<output><pre id="response">No Request Sent</pre></output>
		</p>
	</div>
</section>

<section class="column">
	<div id="doc">
		<div id="get-action">
			<h2>GET Action</h2>
			<dl>
				<dt>all</dt>
				<dd>Gets all actions</dd>
				<dt>id = number</dt>
				<dd>Filters to the action with the specified ID</dd>
			</dl>
		</div>

		<div id="post-action">
			<h2>POST Action</h2>
			<h3>Create</h3>
			<dl>
				<dt>name = string</dt>
				<dd>The action's name</dd>
				<dt>fromvalue = number</dt>
				<dd>Score change for the acting team</dd>
				<dt>onvalue = number</dt>
				<dd>Score change for the acted-upon team</dd>
				<dt class="resp">Response</dt>
				<dd>The actionId of the new action</dd>
			</dl>
			<h3>Update</h3>
			<dl>
				<dt>id = number</dt>
				<dd>The ID of the action to update</dd>
				<dt>newid = number</dt>
				<dd>The new ID</dd>
				<dt>name = string</dt>
				<dd>The new name</dd>
				<dt>fromvalue = number</dt>
				<dd>The new score change for the acting team</dd>
				<dt>onvalue = number</dt>
				<dd>The new score change for the acted-upon team</dd>
				<dt class="resp">Response</dt>
				<dd>The data of the updated match</dd>
			</dl>
			<h3>Delete</h3>
			<dl>
				<dt>id = number</dt>
				<dd>The ID of the action to delete</dd>
			</dl>
		</div>

		<div id="get-color">
			<h2>GET Color</h2>
			<dl>
				<dt>all</dt>
				<dd>Gets all colors</dd>
				<dt>id = number</dt>
				<dd>Filters to the color with the specified ID</dd>
			</dl>
		</div>

		<div id="post-color">
			<h2>POST Color</h2>
			<h3>Create</h3>
			<dl>
				<dt>name = string</dt>
				<dd>The color's name</dd>
				<dt class="resp">Response</dt>
				<dd>The colorId of the new color</dd>
			</dl>
			<h3>Update</h3>
			<dl>
				<dt>id = number</dt>
				<dd>The ID of the color to update</dd>
				<dt>newid = number</dt>
				<dd>The new ID</dd>
				<dt>name = string</dt>
				<dd>The new name</dd>
				<dt class="resp">Response</dt>
				<dd>The data of the updated color</dd>
			</dl>
			<h3>Delete</h3>
			<dl>
				<dt>id = number</dt>
				<dd>The ID of the color to delete</dd>
			</dl>
		</div>

		<div id="get-foul">
			<h2>GET Foul</h2>
			<dl>
				<dt>all</dt>
				<dd>Gets all fouls</dd>
				<dt>id = number</dt>
				<dd>Filters to the foul with the specified ID</dd>
			</dl>
		</div>

		<div id="post-foul">
			<h2>POST Foul</h2>
			<h3>Create</h3>
			<dl>
				<dt>name = string</dt>
				<dd>The foul's name</dd>
				<dt>value = number</dt>
				<dd>Score change for the fouling team</dd>
				<dt class="resp">Response</dt>
				<dd>The foulId of the new foul</dd>
			</dl>
			<h3>Update</h3>
			<dl>
				<dt>id = number</dt>
				<dd>The ID of the foul to update</dd>
				<dt>newid = number</dt>
				<dd>The new ID</dd>
				<dt>name = string</dt>
				<dd>The new name</dd>
				<dt>value = number</dt>
				<dd>The new score change for the fouling team</dd>
				<dt class="resp">Response</dt>
				<dd>The data of the updated foul</dd>
			</dl>
			<h3>Delete</h3>
			<dl>
				<dt>id = number</dt>
				<dd>The ID of the foul to delete</dd>
			</dl>
		</div>

		<div id="get-match">
			<h2>GET Match</h2>
			<dl>
				<dt>all</dt>
				<dd>Gets all matches</dd>
				<dt>current</dt>
				<dd>Filters to in-progress matches</dd>
				<dt>id = number</dt>
				<dd>Filters to the match with the specified ID</dd>
				<dt>open = bool</dt>
				<dd>Filters to matches which are open or closed for scoring</dd>
				<dt>status = string</dt>
				<dd>Filters to matches with the given status</dd>
				<dd>
					<dl>
						<dt>none</dt>
						<dd>The match has not started</dd>
						<dt>ready</dt>
						<dd>The match is loaded but not started</dd>
						<dt>running</dt>
						<dd>The match is in progress</dd>
						<dt>paused</dt>
						<dd>The match is paused</dd>
						<dt>finished</dt>
						<dd>The match has already been run</dd>
					</dl>
				</dd>
				<dt>round = number</dt>
				<dd>Filters to matches with the given round number</dd>
				<dt>match = number</dt>
				<dd>Filters to matches with the given match number</dd>
				<dt>results</dt>
				<dd>Returns the results of each match in the response</dd>
			</dl>
		</div>

		<div id="post-match">
			<h2>POST Match</h2>
			<h3>Create</h3>
			<dl>
				<dt>open = bool</dt>
				<dd>Whether the match's score can be changed (default: false)</dd>
				<dt>status = string</dt>
				<dd>The match's status (default: none)</dd>
				<dt>round = number</dt>
				<dd>The match's round number</dd>
				<dt>match = number</dt>
				<dd>The match's match number</dd>
				<dt>teams = array</dt>
				<dd>The teams playing in the match and their colors. Each array element
					is an object with the following format:</dd>
				<dd>
					<dl>
						<dt>teamId = number</dt>
						<dd>The ID of a team</dd>
						<dt>colorId = number</dt>
						<dd>The ID of a color</dd>
					</dl>
				</dd>
				<dt class="resp">Response</dt>
				<dd>The matchId of the new match</dd>
			</dl>
			<h3>Update</h3>
			<dl>
				<dt>id = number</dt>
				<dd>The ID of the match to update</dd>
				<dt>open = bool</dt>
				<dd>Whether the match's score can be changed</dd>
				<dt>status = string</dt>
				<dd>The new status</dd>
				<dt>round = number</dt>
				<dd>The new round number</dd>
				<dt>match = number</dt>
				<dd>The new match number</dd>
				<dt>teams = array</dt>
				<dd>The new teams playing in the match and their colors.
					The format is the same as above</dd>
				<dt class="resp">Response</dt>
				<dd>The data of the updated match</dd>
			</dl>
			<h3>Delete</h3>
			<dl>
				<dt>id = number</dt>
				<dd>The ID of the match to delete</dd>
			</dl>
		</div>

		<div id="get-matchresult">
			<h2>GET Match Results</h2>
			<dl>
				<dt>all</dt>
				<dd>Gets results for all matches</dd>
				<dt>current</dt>
				<dd>Filters to the results of in-progress matches</dd>
				<dt>match = number</dt>
				<dd>Filters to the results of the match with the specified ID</dd>
				<dt>team = number</dt>
				<dd>Filters to the results of matches in which the team with the
					specified ID plays</dd>
			</dl>
		</div>

		<div id="post-matchresult">
			<h2>POST Match</h2>
			<h3>Update</h3>
			<dl>
				<dt>match = number</dt>
				<dd>The ID of the match for which results should be updated</dd>
				<dt>team = number</dt>
				<dd>The ID of the team for which results should be updated.
					If no team is given, results will be updated for all teams in the match.</dd>
				<dt class="resp">Response</dt>
				<dd>The data of the updated match results</dd>
			</dl>
			<h3>Reset</h3>
			<dl>
				<dt>match = number</dt>
				<dd>The ID of the match for which results should be reset</dd>
				<dt>update</dt>
				<dd>Updates the results of the match after resetting them</dd>
				<dt class="resp">Response</dt>
				<dd>The data of the reset match results</dd>
			</dl>
		</div>

		<div id="get-score">
			<h2>GET Score</h2>
			<dl>
				<dt>all</dt>
				<dd>Gets all score records</dd>
				<dt>current</dt>
				<dd>Filters to score records from the current match</dd>
				<dt>match = number</dt>
				<dd>Filters to score records for the match with the specified ID</dd>
				<dt>team = number</dt>
				<dd>Filters to score records for the team with the specified ID</dd>
			</dl>
		</div>

		<div id="post-score">
			<h2>POST Match</h2>
			<h3>Create</h3>
			<dl>
				<dt>match = number</dt>
				<dd>The ID of the score record's match</dd>
				<dt>from = number</dt>
				<dd>The ID of the team executing an action or foul</dd>
				<dt>on = number</dt>
				<dd>The ID of the team upon which the action or foul was executed</dd>
				<dt>action = number</dt>
				<dd>The ID of the executed action (default: 0)</dd>
				<dt>foul = number</dt>
				<dd>The ID of the executed foul (default: 0)</dd>
				<dt>disabled = bool</dt>
				<dd>Whether the from-team was disabled</dd>
				<dt>disqualified = bool</dt>
				<dd>Whether the from-team was disqualified</dd>
				<dt>apikey</dt>
				<dd>The scorer's API key</dd>
				<dt class="resp">Response</dt>
				<dd>The ID of the new score record</dd>
			</dl>
			<h3>Update</h3>
			<dl>
				<dt>id = number</dt>
				<dd>The ID of the score record to update</dd>
				<dt>match = number</dt>
				<dd>The ID of the new match</dd>
				<dt>from = number</dt>
				<dd>The ID of the new acting team</dd>
				<dt>on = number</dt>
				<dd>The ID of the new acted-upon team</dd>
				<dt>action = number</dt>
				<dd>The ID of the new action</dd>
				<dt>foul = number</dt>
				<dd>The ID of the new foul</dd>
				<dt>datetime = string</dt>
				<dd>The new time of entry</dd>
				<dt class="resp">Response</dt>
				<dd>The data of the updated score record</dd>
			</dl>
			<h3>Delete</h3>
			<dl>
				<dt>id = number</dt>
				<dd>The ID of the score record to delete</dd>
			</dl>
			<h3>Reset</h3>
			<dl>
				<dt>match = number</dt>
				<dd>The ID of the match for which all scores should be deleted</dd>
			</dl>
		</div>

		<div id="get-permissions">
			<h2>GET Permissions</h2>
			<dl>
				<dt>all</dt>
				<dd>Gets all permissions objects</dd>
				<dt>id = number</dt>
				<dd>Filters to the permissions object with the specified ID</dd>
			</dl>
		</div>

		<div id="post-permissions">
			<h2>POST Permissions</h2>
		</div>

		<div id="get-team">
			<h2>GET Team</h2>
			<dl>
				<dt>all</dt>
				<dd>Gets all teams</dd>
				<dt>id = number</dt>
				<dd>Filters to the team with the specified ID</dd>
			</dl>
		</div>

		<div id="post-team">
			<h2>POST Team</h2>
			<h3>Create</h3>
			<dl>
				<dt>name = string</dt>
				<dd>The name of the team</dd>
				<dt>abbr = string</dt>
				<dd>An abbreviation (max 5 characters) for the team name</dd>
				<dt>bio = string</dt>
				<dd>A description of the team</dd>
				<dt>university</dt>
				<dd>The name of the team's home university</dd>
				<dt>imagename</dt>
				<dd>The filename of the team's image</dd>
				<dt>imagedata</dt>
				<dd>A base 64 encoded data URI containing an image to upload</dd>
			</dl>
			<h3>Update</h3>
			<dl>
				<dt>id = number</dt>
				<dd>The ID of the team to update</dd>
				<dt class="resp">Response</dt>
				<dd>The data of the updated team</dd>
			</dl>
			<h3>Delete</h3>
			<dl>
				<dt>id = number</dt>
				<dd>The ID of the team to delete</dd>
			</dl>
		</div>

		<div id="get-user">
			<h2>GET User</h2>
			<dl>
				<dt>all</dt>
				<dd>Gets all users</dd>
				<dt>id = number</dt>
				<dd>Filters to the user with the specified ID</dd>
				<dt>username = string</dt>
				<dd>Filters to the user with the specified username</dd>
				<dt>email = string</dt>
				<dd>Filters to the user with the specified email address</dd>
				<dt>expand</dt>
				<dd>Returns the user's permissions and API objects with the response</dd>
			</dl>
		</div>

		<div id="post-user">
			<h2>POST Match</h2>
			<h3>Create</h3>
			<dl>
			</dl>
			<h3>Update</h3>
				<dt>id = number</dt>
				<dd>The ID of the user to update</dd>
				<dt class="resp">Response</dt>
				<dd>The data of the updated user</dd>
			<dl>
			</dl>
			<h3>Delete</h3>
			<dl>
				<dt>id = number</dt>
				<dd>The ID of the user to delete</dd>
			</dl>
		</div>
	</div>
</section>