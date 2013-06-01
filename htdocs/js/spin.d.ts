// <reference path="jquery.d.ts" />

interface SpinnerOptions {
	lines?: number;
	length?: number;
	width?: number;
	corners?: number;
	rotate?: number;
	color?: string;
	speed?: number;
	trail?: number;
	shadow?: bool;
	hwaccel?: bool;
	className?: string;
	zIndex?: number;
	top?: any;
	left?: any;
}

interface JQuery {
	spin(options?: SpinnerOptions);
	spin(options: bool);
}
