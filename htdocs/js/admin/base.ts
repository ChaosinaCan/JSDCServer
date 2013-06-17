/// <reference path="../lib.d.ts" />
/// <reference path="../spin.d.ts" />
/// <reference path="../jquery.d.ts" />
/// <reference path="../jsdc-api.d.ts" />
/// <reference path="../bigscreen.d.ts" />
/// <reference path="../jquery.single.d.ts" />
/// <reference path="../jquery.chosen.d.ts" />
/// <reference path="../socket.io-client.d.ts" />
/// <reference path="../jquery.simplemodal.d.ts" />

/** Enables or disabled fullscreen */
function toggleFullscreen() {
	if (BigScreen.enabled) 
		BigScreen.toggle();
}


$(function () {

	if (typeof BigScreen !== 'undefined') {
		// toggle fullscreen on F11
		window.addEventListener('keydown', (e: KeyboardEvent) => {
			if (e.which === 122) {
				e.preventDefault();
				e.stopPropagation();
				toggleFullscreen();
			}
		}, true);

		$('button#fullscreen').click(toggleFullscreen);
		$('button#restore').click(toggleFullscreen);
	}

	// create command buttons
	$('button.command').each((i, elem: HTMLButtonElement) => {
		var label = elem.title;
		var icon = elem.textContent;

		$(elem).removeAttr('title')
			.empty()
			.append(
				$('<span class="commandicon commandring">').append(
					$('<span class=commandimage>').text(icon)
				),
				$('<span class=label>').text(label)
			);
	});

	$('input[type=checkbox].toggle').each((i, elem: HTMLInputElement) => {
		var replacement = $('<span>').click((e) => { 
			if (!$(elem).prop('disabled')) {
				$(elem).click()
			}
		});

		$(elem).hide().after(replacement);

	});
});




/** Provides methods for communicating with the REST and clock servers */
module jsdc {
	/** The root REST server endpoint */
	export var baseUrl: string = '/';
	var apikey: string = '';

	/** 
	 * Sets the API key for authentication with the REST server
	 * @param key The API key
	 */
	export function authenticate(key: string) {
		apikey = key;
	}

	/**
	 * Gets the URL for accessing the REST server
	 * @param method The method or datatype to access
	 * @param params Parameters to send with a GET request
	 *		Either a string or a dictionary of key-value pairs
	 */
	export function apiUrl(method: string, params?: any): string {
		method = method.replace(/^\/+|\/$/g, '');
		if (typeof params !== 'undefined')
			return baseUrl + 'api/' + method + '/?' + serialize(params);
		else
			return baseUrl + 'api/' + method + '/';
	} 

	/**
	 * Sends a GET request to the REST server
	 * @param method The datatype to get
	 * @param params Parameters to with the request
	 *		Either a string or a dictionary of key-value pairs
	 */
	export function get(method: string, params?: any): JQueryPromise {
		return $.ajax(apiUrl(method, params), {
			type: 'GET',
			dataType: 'json',
			headers: {
				'X-API-KEY': apikey,
			}
		});
	}

	/**
	 * Sends a POST request to the REST server
	 * @param method The method or datatype to access
	 * @param data Any JSON-serializable data to send
	 */
	export function post(method: string, data: any): JQueryPromise {
		return $.ajax(apiUrl(method), {
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify(data),
			dataType: 'json',
			headers: {
				'X-API-KEY': apikey
			}
		});
	}

	/* == Individual Datatype Functions == */

	function getError(xhr: JQueryXHR): APIError {
		return {
			status: xhr.status,
			statusText: xhr.statusText,
			message: xhr.responseText,
		}
	}

	function handleResponse(call: JQueryPromise, parser: (response: any[]) => any[], callback: (error: APIError, data: any[]) => any) {
		call.then(
			(res) => callback.call(null, null, parser(res)),
			(xhr) => callback.call(null, getError(xhr), null)
		);
	}

	function handleRawResponse(call: JQueryPromise, callback: (error: APIError, id: number) => any) {
		call.then(
			(res) => callback.call(null, null, res),
			(xhr) => callback.call(null, getError(xhr), null)
		);
	}

	function handleSingleResponse(call: JQueryPromise, parser: (response: any[]) => any[], callback: (error: APIError, data: any) => any) {
		function toSingle(items: any[]): any {
			items = parser(items);
			if (!Array.isArray(items))
				return items;

			return items.length > 0 ? items[0] : null;
		}
		handleResponse(call, toSingle, callback);
	}

	/** Converts boolean properties to 1 or 0 */
	function fixbool(object: any) {
		for (var key in object) {
			if (object.hasOwnProperty(key) && typeof object[key] === 'boolean') {
				object[key] = object[key] ? 1 : 0;
			}
		}
		return object;
	}

	/** Accesses action definitions */
	export module action {
		/** Converts an array of JSON objects to Actions */
		export function parse(response: any[]): Action[] {
			return response.map((item) => {
				item.actionId = parseInt(item.actionId);
				item.fromValue = parseInt(item.fromValue);
				item.onValue = parseInt(item.onValue);
				return item;
			});
		}

		/** Converts a single JSON object to an Action */
		export function parseOne(response: any): Action {
			return parse([response])[0];
		}

		/** Gets all actions */
		export function getAll(callback: (error: APIError, actions: Action[]) => any) {
			handleResponse(get('action', 'all'), parse, callback);
		}

		/**
		 * Gets the action with a specific ID
		 * @param id The ID of the action to find
		 */
		export function getById(id: number, callback: (error: APIError, action: Action) => any) {
			handleSingleResponse(get('action', { id: id }), parse, callback);
		}

		/**
		 * Creates an action
		 * @param params Information about the action to create
		 */
		export function create(params: ActionCreateParams, callback: (error: APIError, actionId: number) => any) {
			(<any>params).method = 'create';
			handleRawResponse(post('action', params), callback);
		}

		/**
		 * Changes the parameters of an existing action
		 * @param params Information about the action to update
		 */
		export function update(params: ActionUpdateParams, callback: (error: APIError, action: Action) => any) {
			(<any>params).method = 'update';
			handleSingleResponse(post('action', params), parse, callback);
		}

		/**
		 * Deletes an action
		 * @param id The ID of the action to delete
		 */
		export function remove(id: number, callback: (error: APIError) => any) {
			handleRawResponse(post('action', {
				method: 'delete',
				id: id,
			}), callback);
		}

		/** Converts an Action object to the parameters necessary to create an action */
		export function toCreateParams(action: Action): ActionCreateParams {
			return {
				name: action.name,
				fromvalue: action.fromValue,
				onvalue: action.onValue,
			}
		}

		/** Converts an Action object to the parameters necessary to update that action */
		export function toUpdateParams(action: Action): ActionUpdateParams {
			return {
				id: action.actionId,
				name: action.name,
				fromvalue: action.fromValue,
				onvalue: action.onValue,
			}
		}
	}

	/** Accesses color definitions */
	export module color {
		/** Converts an array of JSON objects to Colors */
		export function parse(response: any[]): Color[] {
			return response.map((item) => {
				item.colorId = parseInt(item.colorId);
				return item;
			});
		}

		/** Converts a single JSON object to a Color */
		export function parseOne(response: any): Color {
			return parse([response])[0];
		}

		/** Gets all colors */
		export function getAll(callback: (error: APIError, colors: Color[]) => any) {
			handleResponse(get('color', 'all'), parse, callback);
		}

		/**
		 * Gets the color with a specific ID
		 * @param id The ID of the color to find
		 */
		export function getById(id: number, callback: (error: APIError, color: Color) => any) {
			handleSingleResponse(get('color', { id: id }), parse, callback);
		}

		/**
		 * Creates a new color
		 * @param name The name of the new color
		 */
		export function create(name: string, callback: (error: APIError, colorId: number) => any) {
			handleRawResponse(post('color', {
				method: 'create',
				name: name
			}), callback);
		}

		/**
		 * Changes the parameters of an existing color
		 * @param params Information about the color to update
		 */
		export function update(params: ColorUpdateParams, callback: (error: APIError, color: Color) => any) {
			(<any>params).method = 'update';
			handleSingleResponse(post('color', params), parse, callback);
		}

		/**
		 * Deletes a color
		 * @param id The ID of the color to delete
		 */
		export function remove(id: number, callback: (error: APIError) => any) {
			handleRawResponse(post('color', {
				method: 'delete',
				id: id,
			}), callback);
		}

		/** Converts a Color object to the parameters necessary to update that color */
		export function toUpdateParams(color: Color): ColorUpdateParams {
			return {
				id: color.colorId,
				name: color.name,
			}
		}
	}

	/** Accesses foul definitions */
	export module foul {
		/** Converts an array of JSON objects to Fouls */
		export function parse(response: any[]): Foul[] {
			return response.map((item) => {
				item.foulId = parseInt(item.foulId);
				item.value = parseInt(item.value);
				return item;
			});
		}

		/** Converts a single JSON object to a Foul */
		export function parseOne(response: any): Foul {
			return parse([response])[0];
		}

		/** Gets all colors */
		export function getAll(callback: (error: APIError, fouls: Foul[]) => any) {
			handleResponse(get('foul', 'all'), parse, callback);
		}

		/**
		 * Gets the foul with a specific ID
		 * @param id The ID of the foul to find
		 */
		export function getById(id: number, callback: (error: APIError, foul: Foul) => any) {
			handleSingleResponse(get('foul', { id: id }), parse, callback);
		}

		/**
		 * Creates a foul
		 * @param params Information about the foul to create
		 */
		export function create(params: FoulCreateParams, callback: (error: APIError, foulId: number) => any) {
			(<any>params).method = 'create';
			handleRawResponse(post('foul', params), callback);
		}

		/**
		 * Changes the parameters of an existing foul
		 * @param params Information about the foul to update
		 */
		export function update(params: FoulUpdateParams, callback: (error: APIError, foul: Foul) => any) {
			(<any>params).method = 'update';
			handleSingleResponse(post('foul', params), parse, callback);
		}

		/**
		 * Deletes a foul
		 * @param id The ID of the foul to delete
		 */
		export function remove(id: number, callback: (error: APIError) => any) {
			handleRawResponse(post('foul', {
				method: 'delete',
				id: id,
			}), callback);
		}

		/** Converts a Foul object to the parameters necessary to create a foul */
		export function toCreateParams(foul: Foul): FoulCreateParams {
			return {
				name: foul.name,
				value: foul.value,
			}
		}

		/** Converts a Foul object to the parameters necessary to update that foul */
		export function toUpdateParams(foul: Foul): FoulUpdateParams {
			return {
				id: foul.foulId,
				name: foul.name,
				value: foul.value,
			}
		}
	}

	/** Accesses match definitions */
	export module match {
		/** Converts an array of JSON objects to Matches */
		export function parse(response: any[]): Match[] {
			return response.map((item) => {
				item.matchId = parseInt(item.matchId);
				item.open = parseBool(item.open);
				item.roundNum = parseInt(item.roundNum);
				item.matchNum = parseInt(item.matchNum);
				if (item.teams !== undefined)
					item.teams = jsdc.team.parse(item.teams);

				return item;
			});
		}

		/** Converts a single JSON object to a Match */
		export function parseOne(response: any): Match {
			return parse([response])[0];
		}

		/** Gets all matches */
		export function getAll(callback: (error: APIError, matches: Match[]) => any) {
			handleResponse(get('match', 'all'), parse, callback);
		}

		/** Gets the currently loaded match, if any exists */
		export function getCurrent(callback: (error: APIError, match: Match) => any) {
			handleSingleResponse(get('match', 'current'), parse, callback);
		}

		/** Gets all unstarted matches */
		export function getUnstarted(callback: (error: APIError, matches: Match[]) => any) {
			handleResponse(get('match', { status: 'none' }), parse, callback);
		}

		/** Gets all finished matches */
		export function getFinished(callback: (error: APIError, matches: Match[]) => any) {
			handleResponse(get('match', { status: 'finished' }), parse, callback);
		}

		/**
		 * Gets the match with a specific ID
		 * @param id The ID of the match to find
		 */
		export function getById(id: number, callback: (error: APIError, match: Match) => any) {
			handleSingleResponse(get('match', { id: id }), parse, callback);
		}

		/**
		 * Gets all matches in a specific round
		 * @param round The round number to search for
		 */
		export function getByRound(round: number, callback: (error: APIError, matches: Match[]) => any) {
			handleResponse(get('match', { round: round }), parse, callback);
		}

		/**
		 * Gets the match with a specific round and match number, if any exists
		 * @param round The round number to search for
		 * @param match The match number to search for 
		 */
		export function getByMatch(round: number, match: number, callback: (error: APIError, match: Match) => any) {
			handleSingleResponse(get('match', {
				round: round,
				match: match,
			}), parse, callback);
		}

		/**
		 * Searches for matches with given properties
		 * @param query The properties to query for
		 */
		export function query(query: MatchQuery, callback: (error: APIError, matches: Match[]) => any) {
			handleResponse(get('match', fixbool(query)), parse, callback);
		}

		/**
		 * Creates a match
		 * @param params Information about the match to create
		 */
		export function create(params: MatchCreateParams, callback: (error: APIError, matchId: number) => any) {
			(<any>params).method = 'create';
			handleRawResponse(post('match', fixbool(params)), callback);
		}

		/**
		 * Changes the parameters of an existing match
		 * @param params Information about the match to update
		 */
		export function update(params: MatchUpdateParams, callback: (error: APIError, match: Match) => any) {
			(<any>params).method = 'update';
			handleSingleResponse(post('match', fixbool(params)), parse, callback);
		}

		/**
		 * Deletes a match
		 * @param id The ID of the match to delete
		 */
		export function remove(id: number, callback: (error: APIError) => any) {
			handleRawResponse(post('match', {
				method: 'delete', 
				id: id,
			}), callback);
		}

		/** Converts a list of Team objects to the parameters necessary to create or update a match */
		function teamsToTeamParams(teams: Team[]): MatchCreateTeamParams[] {
			if (teams) 
				return teams.map((team) => {
					return {
						teamId: team.teamId,
						colorId: team.colorId,
					}
				});
			else 
				return [];
		}

		/** Converts a Match object to the parameters necessary to create a match */
		export function toCreateParams(match: Match): MatchCreateParams {
			return {
				open: match.open,
				status: match.status,
				round: match.roundNum,
				match: match.matchNum,
				teams: teamsToTeamParams(match.teams),
			}
		}

		/** Converts a Match object to the parameters necessary to update that match */
		export function toUpdateParams(match: Match): MatchUpdateParams {
			return {
				id: match.matchId,
				open: match.open,
				status: match.status,
				round: match.roundNum,
				match: match.matchNum,
				teams: teamsToTeamParams(match.teams),
			}
		}
	}

	/** Accesses the results of matches */
	export module matchresult {
		export function parse(response: any[]): MatchResult[] {
			return response.map((item) => {
				item.id = parseInt(item.id);
				item.teamId = parseInt(item.teamId);
				item.matchId = parseInt(item.matchId);
				item.score = parseInt(item.score);
				item.fouls = parseInt(item.fouls);
				item.disabled = parseBool(item.disabled);
				item.disqualified = parseBool(item.disqualified);
				return item;
			});
		}

		export function parseOne(response: any): MatchResult {
			return parse([response])[0];
		}

		export function getAll(callback: (error: APIError, results: MatchResult[]) => any) {
			handleResponse(get('matchresult', 'all'), parse, callback);
		}

		export function getCurrent(callback: (error: APIError, results: MatchResult[]) => any) {
			handleResponse(get('matchresult', 'current'), parse, callback);
		}

		export function getByMatch(matchId: number, callback: (error: APIError, results: MatchResult[]) => any) {
			handleResponse(get('matchresult', { match: matchId }), parse, callback);
		}

		export function getByTeam(teamId: number, callback: (error: APIError, results: MatchResult[]) => any) {
			handleResponse(get('matchresult', { team: teamId }), parse, callback);
		}

		export function query(query: MatchResultQuery, callback: (error: APIError, results: MatchResult[]) => any) {
			handleResponse(get('matchresult', query), parse, callback);
		}

		export function update(params: MatchResultUpdateParams, callback: (error: APIError, results: MatchResult[]) => any) {
			(<any>params).method = 'update';
			handleResponse(post('matchresult', params), parse, callback);
		}

		export function reset(matchId: number, callback: (error: APIError, results: MatchResult[]) => any) {
			handleResponse(post('matchresult', { 
				method: 'reset',
				match: matchId ,
			}), parse, callback);
		}

		export function resetAndUpdate(matchId: number, callback: (error: APIError, results: MatchResult[]) => any) {
			handleResponse(post('matchresult', { 
				method: 'reset',
				match: matchId,
				update: true,
			}), parse, callback);
		}
	}

	/** Accesses score entries */
	export module score {
		export function parse(response: any[]): Score[] {
			return response.map((item) => {
				item.id = parseInt(item.id);
				item.matchId = parseInt(item.matchId);
				item.fromTeamId = parseInt(item.fromTeamId);
				item.onTeamId = parseInt(item.onTeamId);
				item.actionId = parseInt(item.actionId);
				item.foulId = parseInt(item.foulId);
				item.apiId = parseInt(item.apiId);
				item.disabled = parseBool(item.disabled);
				item.disqualified = parseBool(item.disqualified);
				return item;
			});
		}

		export function parseOne(response: any): Score {
			return parse([response])[0];
		}

		export function getAll(callback: (error: APIError, results: Score[]) => any) {
			handleResponse(get('score', 'all'), parse, callback);
		}

		export function getCurrent(callback: (error: APIError, results: Score[]) => any) {
			handleResponse(get('score', 'current'), parse, callback);
		}

		export function getByMatch(matchId: number, callback: (error: APIError, results: Score[]) => any) {
			handleResponse(get('score', { match: matchId }), parse, callback);
		}

		export function getByTeam(teamId: number, callback: (error: APIError, results: Score[]) => any) {
			handleResponse(get('score', { team: teamId }), parse, callback);
		}

		export function query(query: ScoreQuery, callback: (error: APIError, results: Score[]) => any) {
			handleResponse(get('score', query), parse, callback);
		}

		export function create(params: ScoreCreateParams, callback: (error: APIError, scoreId: number) => any) {
			(<any>params).method = 'create';
			handleRawResponse(post('score', fixbool(params)), callback);
		}

		export function update(params: ScoreUpdateParams, callback: (error: APIError, score: Score) => any) {
			(<any>params).method = 'update';
			handleSingleResponse(post('score', fixbool(params)), parse, callback);
		}

		export function remove(id: number, callback: (error: APIError) => any) {
			handleRawResponse(post('score', {
				method: 'delete', 
				id: id,
			}), callback);
		}

		export function reset(matchId: number, callback: (error: APIError) => any) {
			handleRawResponse(post('score', {
				method: 'reset',
				match: matchId,
			}), callback);
		}

		export function toCreateParams(score: Score): ScoreCreateParams {
			return {
				match: score.matchId,
				from: score.fromTeamId,
				on: score.onTeamId,
				action: score.actionId,
				foul: score.foulId,
				disqualified: score.disqualified,
				disabled: score.disabled,
			}
		}

		export function toUpdateParams(score: Score): ScoreUpdateParams {
			return {
				id: score.id,
				match: score.matchId,
				from: score.fromTeamId,
				on: score.onTeamId,
				action: score.actionId,
				foul: score.foulId,
				disqualified: score.disqualified,
				disabled: score.disabled,
			}
		}
	}

	/** Accesses team definitions */
	export module team {
		export function parse(response: any[]): Team[] {
			return response.map((item) => {
				item.teamId = parseInt(item.teamId);
				if (item.colorId !== undefined)
					item.colorId = parseInt(item.colorId);
				return item;
			});
		};

		export function parseOne(response: any): Team {
			return parse([response])[0];
		}

		export function getAll(callback: (error: APIError, teams: Team[]) => any) {
			handleResponse(get('team', 'all'), parse, callback);
		}

		export function getById(id: number, callback: (error: APIError, team: Team) => any) {
			handleSingleResponse(get('team', { id: id }), parse, callback);
		}

		export function create(params: TeamCreateParams, callback: (error: APIError, teamId: number) => any) {
			(<any>params).method = 'create';
			handleRawResponse(post('team', params), callback);
		}

		export function update(params: TeamUpdateParams, callback: (error: APIError, team: Team) => any) {
			(<any>params).method = 'update';
			handleSingleResponse(post('team', params), parse, callback);
		}

		export function remove(id: number, callback: (error: APIError) => any) {
			handleRawResponse(post('team', {
				method: 'delete', 
				id: id,
			}), callback);
		}

		export function toCreateParams(team: Team): TeamCreateParams {
			return {
				name: team.name,
				bio: team.bio,
				university: team.university,
				imagename: team.imageName,
			}
		}
	}

	/**
	 * Gets the URL of a team's image from the image name
	 * @param name The team's imageName property
	 * @param thumb Use "true" to get the thumbnail version of the image
	 */
	export function getTeamImage(name: string, thumb?: bool): string {
		if (name == null)
			return null;

		var parts = name.split('.');
		var filetype = '.' + parts.pop();
		name = parts.join('.');
		var filename = name.substr(0, name.length - filetype.length);
		return baseUrl + 'uploads/' + name + (thumb ? '_thumb' : '') + filetype;
	}

	/** Game status object sent by "game *" and "sync" events */
	export interface GameStatus {
		timestamp: number;
		match: number;
		running: bool;
		paused: bool;
		aborted: bool;
		finished: bool;
		emergency: bool;
		timeElapsed: number;
		timeRemaining: number;
	}

	/** Handles communication with the clock server */
	export module clock {
		var socket: SocketWrapper;
		/** The base URL of the clock server */
		export var baseUrl: string;
		/** Whether or not the page is connected to the clock server */
		export var connected: bool = false;

		export function _getSocket(): SocketWrapper {
			return socket;
		}

		/**
		 * Connects to the clock server
		 * @param url The URL of the clock server
		 */
		export function connect(callback?: (error: string) => any) {
			callback = callback || () => null;

			if (connected) {
				callback(null);
			} else if (typeof io !== 'undefined') {
				socket = io.connect(baseUrl);
				socket.on('connect', () => {
					connected = true;
					callback(null);
				});
				socket.on('connect_failed', () => {
					connected = false;
					callback('Failed to connect to ' + baseUrl);
				});
				socket.on('disconnect', () => {
					connected = false;
				});
				socket.on('reconnect', () => {
					connected = true;
				});
			} else {
				callback('Socket.IO is not loaded. The clock server is probably not running.');
			}
		}

		/**
		 * Joins one or more message channels
		 * @param channels A list of channels to join
		 *		game: General game events
		 *		scoring: Changes to match scores
		 *		audio: Requests to play audio files
		 *		admin: Commands sent between admin pages
		 */
		export function join(...channels: string[]) {
			socket.emit('join', slice(arguments));
		}

		/**
		 * Registers a callback to be called when a certain message type is received
		 * @param event The type of message to listen to
		 */
		export function on(event: string, callback: Function) {
			socket.on(event, callback);
		}

		/**
		 * Registers a callback to be called only once the next time a certain message type is received
		 * @param event The type of message to listen to
		 */
		export function once(event: string, callback: Function) {
			socket.once(event, callback);
		}

		/**
		 * Sends a message to the clock server
		 * @event The message type
		 * @data Any JSON serializable data to send with the message
		 */
		export function emit(event: string, data?: any) {
			socket.emit(event, data);
		}

		/** Synchronizes a local timer with the clock server's game timer */
		export class Timer {
			private _time: number;
			private _running: bool;
			private _connected: bool;

			private _lastTime: number;
			private _lastStatus: GameStatus;
			private _interval: number;
			private _onupdate: (timer: Timer) => any;
			private _onstatuschange: (timer: Timer) => any;

			/** The time remaining in seconds */
			get time() { return this._time; }
			/** Whether the clock is running */
			get running() { return this._running; }
			/** Whether this timer is connected to the clock server */
			get connected() { return this._connected; }
			/** The last GameStatus object received from the clock server */
			get lastStatus() { return this._lastStatus; }

			/**
			 * Creates a Timer
			 * @param updateCallback A function to be called whenever the timer changes
			 * @param statusChangeCallback A function to be called whenever the state of the match changes
			 */
			constructor(updateCallback?: (timer: Timer) => any, statusChangeCallback?: (timer: Timer) => any) {
				bindMemberFunctions(this);

				this._time = 0;
				this._running = false;
				this._connected = false;
				this._onupdate = updateCallback || () => null;
				this._onstatuschange = statusChangeCallback || () => null;

				var clock = jsdc.clock;
				clock.connect((err) => {
					if (!err) {
						this._connected = true;
						clock.join('game');
						['game start', 'game pause', 'game resume', 'game stop', 'game abort', 'sync'].forEach((event) => {
							clock.on(event, this.onSync);
						});
						clock.emit('sync');
					}
				});
			}

			private onUpdate() {
				this._onupdate(this);
			}

			private onStatusChange() {
				this._onstatuschange(this);
			}

			private onSync(status: GameStatus) {
				//console.log(status.running)
				if (status.running) {
					var delay = 0;//(Date.now() / 1000) - status.timestamp;
					this._time = status.timeRemaining - delay;
					//console.log(this._time, this._time + delay);
				} else {
					this._time = status.timeRemaining;
					//console.log(this._time);
				}

				if (status.running && !this.running) {
					//this.start(status.timestamp);
					this.start(Date.now() / 1000);
				} else if (!status.running && this.running) {
					this.stop();
				}

				this._lastStatus = status;
				this.onUpdate();
				this.onStatusChange();
			}

			private start(startTime: number) {
				clearInterval(this._interval);
				this._interval = setInterval(this.step, 1000);

				this._lastTime = startTime;
				this._running = true;
				this.onUpdate();
				this.onStatusChange();
			}

			private stop() {
				clearInterval(this._interval);
				this._running = false;
				this.onUpdate();
				this.onStatusChange();
			}

			private step() {
				var now = Date.now() / 1000;
				this._time -= (now - this._lastTime);
				this._lastTime = now;

				if (this._time < 0)
					this._time = 0;

				this.onUpdate();
			}

			/** Returns the current time remaining as a string */
			toString(): string {
				var minutes = Math.floor(this.time / 60).toString();
				var seconds = Math.floor(this.time % 60).toString();

				return minutes.pad(1, '0') + ':' + seconds.pad(2, '0');
			}
		}
	}

	/** Progress spinner options */
	export module spinners {
		var options: SpinnerOptions = {
			className: 'spinner-anim',
			lines: 13,
			length: 0,
			width: 4,
			radius: 16,
			corners: 1,
			//top: '0px',
			//left: '0px',
		}

		/** Options for creating a light-colored spinner */
		export var light: SpinnerOptions = clone(options);
		light.color = '#fff';

		/** Options for creating a dark-colored spinner */
		export var dark: SpinnerOptions = clone(options);
		dark.color = '#222';

		delete options;
	}
}


/** Displays modal dialogs */
module Modal {

	export var mobile = false;

	/** Defines a button on a modal dialog */
	export interface ModalButton {
		text: string;
		className?: string;
		action?: (event: JQueryEventObject) => any;
	}

	/** Defines a modal dialog */
	export interface ModalOptions {
		title?: string;
		body: any;
		className?: string;
		buttons?: ModalButton[];
		options?: SimpleModalOptions;
	}

	/** The text for the buttons on a confirmation dialog */
	export interface ConfirmButtons {
		yes: string;
		no: string;
	}

	/** A callback function for confirmation dialog results */
	export interface ConfirmCallback {
		(result: bool): any;
	}

	/** Default confirmation buttons */
	export var Buttons = {
		YesNo: { yes: 'Yes', no: 'No' },
		OkCancel: { yes: 'OK', no: 'Cancel' },
	}

	/** Single cancel button for generic dialogs */
	export var CancelButton: ModalButton[] = [{ text: 'Cancel' }];
	/** Options for a cancellable dialog */
	export function CancellableOptions(): SimpleModalOptions {
		return {
			close: true,
			overlayClose: true,
			escClose: true,
		}
	};

	var queue: ModalOptions[] = [];
	var dialogOpen = false;

	function queueDialog(options: ModalOptions) {
		queue.push(options);
	}

	function dequeueDialog(): ModalOptions {
		return queue.shift();
	}

	/** Returns "true" if a dialog is open */
	export function isOpen() {
		return dialogOpen;
	}

	/** Displays a modal dialog */
	export function dialog(options: ModalOptions) {
		if (dialogOpen) {
			queueDialog(options);
		} else {
			var content = $('<aside>');
			if (Modal.mobile) {
				content.addClass('x-large');
			}

			if (options.className) {
				content.addClass(options.className);
			}

			if (options.title) {
				var className = Modal.mobile ? '' : 'x-large semilight';
				content.append($('<h1 class="' + className + '">').text(options.title));
			}

			if (typeof options.body === 'string') {
				content.append($('<p>').text(options.body));
			} else {
				content.append(options.body);
			}

			if (options.buttons && options.buttons.length > 0) {
				var buttons = $('<footer>').append(
					options.buttons.map((item) => {
						var button = $('<button>').text(item.text);
						if (Modal.mobile) {
							button.addClass('x-large');
						}
						if (item.className) {
							button.addClass(item.className);
						}
						if (item.action) {
							button.click(function (e) {
								$.modal.close();
								item.action.apply(this, slice(arguments));
							});
						} else {
							button.addClass('simplemodal-close');
						}
						return button;
					})
				);
				content.append(buttons);
			}

			options.options = options.options || {};
			options.options.modal = true;
			options.options.opacity = 80;
			options.options.closeHTML = '';

			var _onOpen = options.options.onOpen;
			options.options.onOpen = (dialog) => {
				var _this = this;
				var _args = slice(arguments);

				dialogOpen = true;
				dialog.overlay.fadeIn(300, () => {
					if (_onOpen)
						_onOpen.apply(_this, _args);
				});
				dialog.container.css({
						left: '-100%',
						opacity: 0,
					})
					.animate({ 
						left: '0%',
						opacity: 1,
					}, 250, 'easeOutQuint')
					.show();
				dialog.data.show();
				setTimeout(() => $(dialog.data).find('button').last().focus(), 50);
			}

			var _onClose = options.options.onClose;
			options.options.onClose = (dialog) => {
				var _this = this;
				var _args = slice(arguments);

				dialog.container.animate({ 
						left: '100%',
						opacity: 0,
					}, 250, 'easeInQuint');
				
				dialog.overlay.fadeOut(300, () => {
					$.modal.close();
					dialogOpen = false;

					if (_onClose)
						_onClose.apply(_this, _args);

					var queued;
					if (queued = dequeueDialog()) {
						Modal.dialog(queued);
					}
				});
			}

			$.modal(content, options.options);
		}
	}

	/** 
	 * Displays an informational dialog 
	 * @param title The title of the dialog
	 * @param message The content of the dialog
	 * @param onclose A function to call when the dialog is closed
	 */
	export function info(title: string, message: JQuery, onclose?: SimpleModalCallback);
	/** 
	 * Displays an informational dialog 
	 * @param title The title of the dialog
	 * @param message The content of the dialog
	 * @param onclose A function to call when the dialog is closed
	 */
	export function info(title: string, message: string, onclose?: SimpleModalCallback); 
	export function info(title: string, message: any, onclose?: SimpleModalCallback) {
		var options: ModalOptions = {
			title: title,
			body: message,
			className: 'info',
			buttons: [
				{ text: 'OK' },
			],
			options: {
				close: true,
				overlayClose: true,
				escClose: true,
			}
		};

		if (typeof onclose !== 'undefined')
			options.options = { onClose: onclose };

		dialog(options);
	}

	/**
	 * Displays a question and waits for the user to respond
	 * @param title The title of the dialog
	 * @param message The content of the dialog
	 * @param callback A function to call with the user's response
	 */
	export function confirm(title: string, message: string, callback: ConfirmCallback);
	/**
	 * Displays a question and waits for the user to respond
	 * @param title The title of the dialog
	 * @param message The content of the dialog
	 * @param callback A function to call with the user's response
	 */
	export function confirm(title: string, message: JQuery, callback: ConfirmCallback);
	/**
	 * Displays a question and waits for the user to respond
	 * @param title The title of the dialog
	 * @param message The content of the dialog
	 * @param buttons The text of the yes/no buttons
	 * @param callback A function to call with the user's response
	 */
	export function confirm(title: string, message: string, buttons: ConfirmButtons, callback: ConfirmCallback);
	/**
	 * Displays a question and waits for the user to respond
	 * @param title The title of the dialog
	 * @param message The content of the dialog
	 * @param buttons The text of the yes/no buttons
	 * @param callback A function to call with the user's response
	 */
	export function confirm(title: string, message: JQuery, buttons: ConfirmButtons, callback: ConfirmCallback);
	export function confirm(title: string, message: any, buttons: any) {
		if (arguments.length >= 4) {
			var callback: ConfirmCallback = arguments[3];
			var buttons: ConfirmButtons = arguments[2];
		} else {
			var callback: ConfirmCallback = arguments[2];
			var buttons: ConfirmButtons = Modal.Buttons.OkCancel;
		}

		var result = null;
		dialog({
			title: title,
			body: message,
			className: 'prompt',
			buttons: [
				{
					text: buttons.yes,
					className: 'yes',
					action: () => (result = true)
				},
				{
					text: buttons.no,
					className: 'no',
					action: () => (result = false)
				}
			],
			options: {
				close: false,
				overlayClose: false,
				escClose: false,
				onClose: () => {
					callback(result);
				}
			}
		});
	}

	/** 
	 * Displays an error message
	 * @param title The title of the dialog
	 * @param message The content of the dialog
	 * @param onclose A function to call when the dialog is closed
	 */
	export function error(title: string, message: JQuery, onclose?: SimpleModalCallback);
	/** 
	 * Displays an error message
	 * @param title The title of the dialog
	 * @param message The content of the dialog
	 * @param onclose A function to call when the dialog is closed
	 */
	export function error(title: string, message: string, onclose?: SimpleModalCallback);
	export function error(title: string, message: any, onclose?: SimpleModalCallback) {
		var options: ModalOptions = {
			title: title,
			body: message,
			className: 'error',
			buttons: [
				{ text: 'OK' },
			],
			options: {
				close: true,
				overlayClose: true,
				escClose: true,
			}
		};

		if (typeof onclose !== 'undefined')
			options.options.onClose = onclose;

		dialog(options);
	}

	/** 
	 * Displays multiple error messages in a single dialog
	 * @param messages The error messages
	 * @param onclose A function to call when the dialog is closed
	 */
	export function multiError(messages: JQuery[], onclose?: SimpleModalCallback);
	/** 
	 * Displays multiple error messages in a single dialog
	 * @param messages The error messages
	 * @param onclose A function to call when the dialog is closed
	 */
	export function multiError(messages: string[], onclose?: SimpleModalCallback);
	export function multiError(messages: any[], onclose?: SimpleModalCallback) {
		var tabs = $('<ul class=tabs>').append(
			messages.map((msg, i) => {
				var item = $('<li>').append(
					$('<button>').text((i + 1).toString()).click(changeTab.bind(null, i))
				);

				if (i === 0)
					item.addClass('current');

				return item;
			})
		)

		var bodies = $('<ul class=messages>').append(
			messages.map((msg, i) => {
				var item = $('<li>');
				if (typeof msg === 'string')
					item.append($('<p>').text(msg));
				else
					item.append(msg);

				if (i === 0)
					item.addClass('current');

				return item;
			})
		)

		function changeTab(tab: number) {
			tabs.find('li.current').removeClass('current');
			bodies.find('li.current').removeClass('current');
			
			$(tabs.find('li').get(tab)).addClass('current');
			$(bodies.find('li').get(tab)).addClass('current');
		}

		var options: ModalOptions = {
			title: messages.length === 1 ? '1 Error' : (messages.length.toString() + ' Errors'),
			body: tabs.add(bodies),
			className: 'error multiple',
			buttons: [
				{ text: 'OK' },
			],
			options: {
				close: true,
				overlayClose: true,
				escClose: true,
			}
		};

		if (typeof onclose !== 'undefined')
			options.options.onClose = onclose;

		dialog(options);
	}

	function apiErrorContents(error: APIError, message?: string): JQuery {
		var response: any = error.message;
		try {
			response = $('<code>').text(writeObject(JSON.parse(response), 99));
		} catch (e) { }

		return $('<p>').text(message || '')
			.add($('<p>').text(error.status + ': ' + error.statusText))
			.add($('<p>').append($('<pre>').append(response)));
	}

	/** 
	 * Displays an error message for a failed API call
	 * @param err The APIError object
	 * @param message A description of the error (what API call failed?)
	 * @param onclose A function to call when the dialog is closed
	 */
	export function apiError(err: APIError, message: string, onclose?: SimpleModalCallback) {
		error(message, apiErrorContents(err), onclose);
	}

	/** 
	 * Displays multiple error messages for failed API calls in a single dialog
	 * @param errors The APIError objects
	 * @param messages Descriptions of the errors (what API calls failed?)
	 * @param onclose A function to call when the dialog is closed
	 */
	export function multiApiError(errors: APIError[], messages: string[], onclose?: SimpleModalCallback) {
		var contents = errors.map((err, i) => apiErrorContents(err, messages[i]));
		multiError(contents, onclose);
	}

	/**
	 * Creates a function to use as a callback to an API call.
	 * The function displays an error if the call fails, or does nothing otherwise.
	 * @param message A description of the error (what API call failed?)
	 */
	export function makeErrorHandler(message: string) {
		return function(err) {
			if (err)
				apiError(err, message);
		}
	}

	function ajaxErrorContents(xhr: JQueryXHR, message: string): JQuery {
		var response: any = xhr.responseText;
		if (xhr.getResponseHeader('Content-Type').indexOf('json') >= 0) {
			try {
				response = $('<code>').text(writeObject(JSON.parse(response), 99));
			} catch (e) { }
		}

		return $('<p>').text(message)
			.add($('<p>').text(xhr.status + ': ' + xhr.statusText))
			.add($('<p>').append($('<pre>').append(response)));
	}

	/** 
	 * Displays an error message for a failed AJAX request
	 * @param xhr The xhr object
	 * @param message A description of the error (what request failed?)
	 * @param onclose A function to call when the dialog is closed
	 */
	export function ajaxError(xhr: JQueryXHR, message: string, onclose?: SimpleModalCallback) {
		error('Request Error', ajaxErrorContents(xhr, message), onclose);
	}

	/** 
	 * Displays an error message for multiple failed AJAX requests in a single dialog
	 * @param xhr The xhr objects
	 * @param message Descriptions of the errors (what requests failed?)
	 * @param onclose A function to call when the dialog is closed
	 */
	export function multiAjaxError(xhrs: JQueryXHR[], messages: string[], onclose?: SimpleModalCallback) {
		var contents = xhrs.map((xhr, i) => ajaxErrorContents(xhr, messages[i]));
		multiError(contents, onclose);
	}
}







// Helper functions

/** Converts an array-like object to an array */
var slice = Function.prototype.call.bind(Array.prototype.slice);

/** 
 * Generates an array containing a range of integers in increasing order
 * @param start The first number in the list
 * @param end The last number in the list
 */
function range(start, end): number[] {
	var array = new Array(end - start + 1);
	for (var i = 0; i < array.length; i++)
		array[i] = start + i;

	return array;
}

/** Returns the names of all properties of an object */
function keys(object: any): string[] {
	var keys: string[] = [];
	
	for (var k in object) {
		if (object.hasOwnProperty(k))
			keys.push(k);
	}

	return keys;
}

/** Creates a deep clone of any JSON-serializable object */
function clone(object: any) {
	if (typeof object !== 'object')
		return object;

	if (Array.isArray(object)) {
		var r = new Array(object.length);
		for (var i = 0; i < object.length; ++i) {
			r[i] = clone(object[i]);
		}
		return r;
	} else {
		var o = {};
		for (var key in object) {
			if (object.hasOwnProperty(key)) {
				o[key] = clone(object[key]);
			}
		}
		return o;
	}
}

/** Converts an object with numeric keys to an array 
 * e.g. { 0: 'foo', 1: 'bar' } => ['foo', 'bar'] */
function toArray(object: any) {
	var array = [];
	for (var key in object) {
		if (object.hasOwnProperty(key)) {
			var index = parseInt(key);
			if (!isNaN(index)) {
				array[index] = object[key];
			}
		}
	}
	return array;
}

/** Tests whether two objects are equal to each other property-by-property */
function deepEquals(a: any, b: any): bool {
	var type;
	if ((type = typeof a) !== typeof b)
		return false;

	if (type === 'object') {
		for (var key in a) {
			var aHas = a.hasOwnProperty(key);
			var bHas = b.hasOwnProperty(key);
			// if both have the property and they aren't equal, return false
			if (aHas && bHas && !deepEquals(a[key], b[key])) 
				return false;
				// if only one has the property, return false
			else if (aHas && !bHas) 
				return false;
		}
		for (var key in b) {
			if (b.hasOwnProperty(key) && !a.hasOwnProperty(key)) 
				return false;
		}

		// if both objects have the same properties and each is equal, return true
		return true;
	} else {
		return a === b;
	}
}

/** Converts an object to a URL query string */
function serialize(obj: any): string {
	if (typeof obj === 'string')
		return obj;

	var q = [];
	for (var p in obj) {
		if (!obj.hasOwnProperty(p))
			continue;
		
		var name = encodeURIComponent(p);

		if (obj[p] === null)
			q.push(p);
		else if (typeof obj[p] === 'object')
			q.push(name + '=' + encodeURIComponent(JSON.stringify(obj[p])));
		else
			q.push(name + '=' + encodeURIComponent(obj[p]));
	}
	return q.join('&');
}

/** Parses the string representation of a boolean value */
function parseBool(value: any): bool {
	if (value === true || value === false)
		return value;

	if (typeof value === 'string') 
		return (<string>value).toLowerCase() === 'true' || (<string>value) === '1';

	return !!parseInt(value);
}

/** Ensures that "this" will always be correct for all of an object's functions */
function bindMemberFunctions(obj: any) {
	var _this = obj, _constructor = (<any>obj).constructor;

	if (!_constructor.__fn__) {
		_constructor.__fn__ = {};
		for (var m in _this) {
			var fn = _this[m];
			if (typeof fn === 'function' && m != 'constructor') {
				_constructor.__fn__[m] = fn;	
			}
		}
	}

	for (var m in _constructor.__fn__) {
		(function (m, fn) {
			_this[m] = function () {
				return fn.apply(_this, Array.prototype.slice.call(arguments));						
			};
		})(m, _constructor.__fn__[m]);
	}
}

/** Generates a string representation of a JSON-serializable object */
function writeObject(object: any, maxLevel?: number): string {
	function write(object: any, name: string, level: number, references: any[]) {
		var lbrace = '{';
		var rbrace = '}';

		var str = (name ? name + ': ' : '').indent(level);
		var isEmpty = false;

		if (object === null) {
			str += 'null';
			isEmpty = true;
			lbrace = rbrace = '';
		} else if (object === undefined) {
			str += 'undefined';
			isEmpty = true;
			lbrace = rbrace = '';
		} else if ($.isEmptyObject(object)) {
			isEmpty = true;
		} else if ($.isArray(object)) {
			lbrace = '[';
			rbrace = ']';
		} else if (typeof object === 'string') {
			str += '"' + object + '"';
			isEmpty = true;
			lbrace = rbrace = '';
		} else if (typeof object === 'number') {
			str += object;
			isEmpty = true;
			lbrace = rbrace = '';
		}

		str += lbrace;

		if (!isEmpty) {
			level++;
			for (var key in object) {
				if (!object.hasOwnProperty(key))
					continue;

				var value = object[key];

				if (typeof value === 'object') {
					if (references.contains(value) || value === object) {
						str += '\n' + key.indent(level) + ': [Circular Reference]';
					} else if (level >= maxLevel)
						str += '\n' + key.indent(level) + ': [Level Limit]';
					else {
						var myReferences = slice(references);
						myReferences.push(value);
						str += '\n' + write(value, key, level, myReferences);
					}
				} else {
					str += '\n' + key.indent(level) + ': ';
					if (typeof value === 'string')
						str += '"' + value + '"';
					else
						str += value;
				}
			}

			level--;
		}

		return str + (isEmpty ? '' : '\n' + ''.indent(level)) + rbrace;
	}

	if (typeof maxLevel === 'undefined')
		maxLevel = 3;

	return write(object, null, 0, []);
}




// Base type extensions

/** The result of a string partition call */
interface PartitionResult {
	success: bool;
	before: string;
	after: string;
}

interface String {
	indent(level?: number): string;
	dedent(level?: number): string;
	pad(length: number, char?: string);
	partition(sep: string): PartitionResult;
	rpartition(sep: string): PartitionResult;
	startswith(str: string): bool;
	endswith(str: string): bool;
	capitalize(): string;
}

/** Left-pads a string to a given length. If it is already the desired length or longer, nothing is done */
String.prototype.pad = function(length: number, char?: string) {
	char = char || ' ';
	var pad = (length - this.length) / char.length;
	var padstr = '';
	for (var i = pad; i > 0; i--)
		padstr += char;
	return padstr + this;
}

/**
 * Adds 4 spaces to the beginning of the string 
 * @param level The number of 4-space indents to add (default: 1)
 */
String.prototype.indent = function(level?: number): string {
	level = (typeof level === 'undefined') ? 1 : level;
	var indent = '';
	for (var i = level; i > 0; i--)
		indent += '    ';
	return indent + this;
}

/** 
 * Removes one tab or 4 spaces from the beginning of the string 
 * @param level The number of 4-space indents to remove (default: 1)
 */
String.prototype.dedent = function(level?: number): string {
	level = (typeof level === 'undefined') ? 1 : level;
	var newstring = this;
	for (var i = level; i > 0; i--)
		newstring = newstring.replace(/^(\t| {1,4})/, '');
	return newstring;
}

/** Splits the string into the parts before and after the first instance of a separator */
String.prototype.partition = function(sep: string): PartitionResult {
	var i = this.indexOf(sep);
	if (i >= 0) {
		return {
			success: true,
			before: this.substr(0, i),
			after: this.substr(i + sep.length),
		}
	} else {
		return { success: false, before: this, after: '' }
	}
}

/** Splits the string into the parts before and after the last instance of a separator */
String.prototype.rpartition = function(sep: string): PartitionResult {
	var i = this.lastIndexOf(sep);
	if (i >= 0) {
		return {
			success: true,
			before: this.substr(0, i),
			after: this.substr(i + sep.length),
		}
	} else {
		return { success: false, before: '', after: this }
	}
}

/** Returns true if the string starts with a search string */
String.prototype.startswith = function(str: string): bool {
	return this.indexOf(str) === 0;
}

/** Returns true if the string ends with a search string */
String.prototype.endswith = function(str: string): bool {
	return (this.lastIndexOf(str) === this.length - str.length) && (this.length >= str.length);
}

/** Capitalizes the first letter of the string */
String.prototype.capitalize = function(): string {
	return this.substr(0, 1).toUpperCase() + this.substr(1);
}


interface Array {
	indexByProperty(prop: string): any[];
	remove(object: any): bool;
	contains(object: any): bool;
}

/** 
 * Converts an array to an object of key-value pairs indexed by a property on each item
 * e.g. [{ a: 'foo' }, { a: 'bar' }].indexByProperty('a') => { foo: { a: 'foo' }, bar: { a: 'bar' } }
 * @param prop The name of the property to index by
 */
Array.prototype.indexByProperty = function (prop: string): any {
	var obj = {};
	this.forEach((item) => obj[item[prop]] = item);
	return obj;
}

/** Removes the first instance of an object from the array */
Array.prototype.remove = function(object: any) {
	var i = this.indexOf(object);
	if (i >= 0) {
		this.splice(i, 1);
		return true;
	} else {
		return false;
	}
}

/** Gets whether the array contains an object */
Array.prototype.contains = function(object: any): bool {
	return this.indexOf(object) >= 0;
}


// jQuery easings
interface JQueryStatic {
	easing: any;
}

$.extend($.easing,
{
	easeInQuad: function (x, t, b, c, d) {
		return c*(t/=d)*t + b;
	},
	easeOutQuad: function (x, t, b, c, d) {
		return -c *(t/=d)*(t-2) + b;
	},
	easeInCubic: function (x, t, b, c, d) {
		return c*(t/=d)*t*t + b;
	},
	easeOutCubic: function (x, t, b, c, d) {
		return c*((t=t/d-1)*t*t + 1) + b;
	},
	easeInQuart: function (x, t, b, c, d) {
		return c*(t/=d)*t*t*t + b;
	},
	easeOutQuart: function (x, t, b, c, d) {
		return -c * ((t=t/d-1)*t*t*t - 1) + b;
	},
	easeInQuint: function (x, t, b, c, d) {
		return c*(t/=d)*t*t*t*t + b;
	},
	easeOutQuint: function (x, t, b, c, d) {
		return c*((t=t/d-1)*t*t*t*t + 1) + b;
	},
	easeInOutQuint: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
		return c/2*((t-=2)*t*t*t*t + 2) + b;
	},
	easeInExpo: function (x, t, b, c, d) {
		return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
	},
	easeOutExpo: function (x, t, b, c, d) {
		return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
	},
	easeInCirc: function (x, t, b, c, d) {
		return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
	},
	easeOutCirc: function (x, t, b, c, d) {
		return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
	},
});