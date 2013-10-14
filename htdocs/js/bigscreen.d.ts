// Typing for the BigScreen library

interface BigScreenStatic {

	request(element?: Element);
	exit();
	toggle(element?: Element);
	
	onenter: Function;
	onexit: Function;

	element: Element;
	enabled: boolean;

	videoEnabled(video: Element);
}

declare var BigScreen: BigScreenStatic;