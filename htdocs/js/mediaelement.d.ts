/// <reference path="jquery.d.ts" />

interface MediaElementOptions {
	defaultVideoWidth?: number;
	defaultVideoHeight?: number;
	videoWidth?: number;
	videoHeight?: number;
	audioWidth?: number;
	audioHeight?: number;
	startVolume?: number;
	loop?: bool;
	enableAutosize?: bool;
	features?: string[];
	alwaysShowControls?: bool;
	iPadUseNativeControls?: bool;
	iPhoneUseNativeControls?: bool;
	AndroidUseNativeControls?: bool;
	alwaysShowHours?: bool;
	showTimecodeFrameCount?: bool;
	framesPerSecond?: number;
	enableKeyboard?: bool;
	pauseOtherPlayers?: bool;
	keyActions?: any[];

	enablePluginDebug?: bool;
	plugins?: string[];
	type?: string;
	pluginPath?: string;
	flashName?: string;
	silverlightName?: string;
	pluginWidth?: number;
	pluginHeight?: number;
	timerRate?: number;
	success?: (mediaelement: MediaElementPlayer, domObject: HTMLElement) => any;
	error?: Function;
}

interface MediaElementPlayer extends HTMLElement {
	paused: bool;
	ended: bool;
	seeking: bool;
	duration: bool;
	muted: bool;
	volume: number;
	currentTime: number;
	src: string;
	
	setMuted(mute: bool);
	setVolume(volume: number);
	setCurrentTime(time: number);
	setSrc(src: string);

	play();
	pause();
	load();
	stop();

}

interface JQuery {
	mediaelementplayer(options: MediaElementOptions): void;
}