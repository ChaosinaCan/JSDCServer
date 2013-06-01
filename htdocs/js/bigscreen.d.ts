﻿// Typing for the BigScreen library

interface BigScreenStatic {

	request(element?: Element);
	exit();
	toggle(element?: Element);
	
	onenter: Function;
	onexit: Function;

	element: Element;
	enabled: bool;

	videoEnabled(video: Element);
}

declare var BigScreen: BigScreenStatic;