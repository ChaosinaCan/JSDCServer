///<reference path="../node.d.ts" />
///<reference path="../jsdc.ts" />
///<reference path="../clock.ts" />

import jsdc = require('../jsdc');
import clock = require('../clock');

var TimedEvent = clock.TimedEvent;

export class GameRules extends jsdc.GameRules {
	constructor(game: clock.GameClock, api: jsdc.API, cue: jsdc.CueServer[]) {
		super(game, api, cue);

		// Perform any one-time initialization here
		game.config.duration = 7 * 60;
		game.config.events = [];

		this.cues = {
			'Emergency': 911,
		}

		this.actions = {
		}

		this.audio.add({
		})
	}

	// Events handlers are attached by convention. Funtions with certain names will
	// automatically be called when an event is emitted by the 'game' object:
	//
	// this.game.emit('foo bar', data) -> this.onFooBar(data)
	// this.game.emit('game event', { event: 'foo bar', data: data }) -> this.onGameFooBar(data)
	// this.sendEvent('foo bar', data) -> this.onGameFooBar(data)

	onStart() {
		// Perform any per-match initialization here
	}

	onPause() {
		// Called when the game is paused
	}

	onResume() {
		// Called when the game resumes from being paused
	}

	onStop() {
		// Called when the game ends for any reason
	}

	onGameover() {
		// Called in addition to onStop() when the timer hits 0
	}

	onAbort() {
		// Called in addition to onStop() if the match is aborted
	}

	onReset() {
		// Called when a field reset command is sent
	}

	onEmergency() {
		// Called when a judge declares an emergency
		this.sendCue('Emergency');
	}

	onGameSpecialEvent(data: any) {
		// Called when a 'game event' event is sent with the event name 'special event'
	}
}