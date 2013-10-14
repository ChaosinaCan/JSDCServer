/// <reference path="jquery.d.ts" />

interface MediaElementOptions {
	defaultVideoWidth?: number;
	defaultVideoHeight?: number;
	videoWidth?: number;
	videoHeight?: number;
	audioWidth?: number;
	audioHeight?: number;
	startVolume?: number;
	loop?: boolean;
	enableAutosize?: boolean;
	features?: string[];
	alwaysShowControls?: boolean;
	iPadUseNativeControls?: boolean;
	iPhoneUseNativeControls?: boolean;
	AndroidUseNativeControls?: boolean;
	alwaysShowHours?: boolean;
	showTimecodeFrameCount?: boolean;
	framesPerSecond?: number;
	enableKeyboard?: boolean;
	pauseOtherPlayers?: boolean;
	keyActions?: any[];

	enablePluginDebug?: boolean;
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
	paused: boolean;
	ended: boolean;
	seeking: boolean;
	duration: boolean;
	muted: boolean;
	volume: number;
	currentTime: number;
	src: string;
	
	setMuted(mute: boolean);
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