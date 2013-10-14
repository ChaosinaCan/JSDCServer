/// <reference path="base.ts" />
/// <reference path="../mediaelement.d.ts" />

module audio {
	// Public Variables
	export var base = '/audio/';

	// Private Variables
	var sounds: { [key: string]: MediaElementPlayer; } = {};

	// Public Methods
	export function init(): void {
		jsdc.clock.connect(onconnect);
	}

	export function add(map: { [key: string]: string; }): void;
	export function add(name: string, path: string): void;
	export function add(name: any, path?: any): void {
		
		if (typeof name === 'object') {
			for (var key in name) {
				if (name.hasOwnProperty(key)) {
					createPlayer(key, name[key]);
				}
			}
		} else {
			createPlayer(name, path);
		}

	}

	export function play(name: string) {
		console.log('play', name);
		var sound = sounds[name];
		sound.setCurrentTime(0);
		sound.play();
	}

	export function stop(name: string) {
		console.log('stop', name);
		sounds[name].pause();
	}

	// Private Methods
	function onconnect(error: string) {
		if (error) {
			Modal.error('Cannot connect to clock server', error);
		} else {
			var clock = jsdc.clock;
			clock.join('audio');
			clock.on('list audio', add);
			clock.on('play audio', play);
			clock.on('stop audio', stop);
			clock.emit('get audio');
		}
	}

	function createPlayer(name: string, path: string) {
		if (sounds[name]) {
			return;
		}

		var player = $('<audio>').attr('src', base + path);

		$('#audio').append(
			$('<div>').append(
				$('<span class=x-large>').text(name),
				player
			)
		);

		player.mediaelementplayer({
			features: ['playpause', 'progress', 'duration'],
			loop: false,
			pluginPath: '/js/mediaelement/',
			success: function(mediaElement) {
				sounds[name] = mediaElement;
			},
			error: () => {
				Modal.error('Failed to create audio player',
					'Could not create an audio player for "' + name + '", ' + path);
			}
		});
	}
}