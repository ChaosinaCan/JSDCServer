/// <reference path="jquery.d.ts" />

interface SingleEventObject extends JQueryEventObject {
	complete();
}

interface JQueryStatic {
	single(handler: (eventObject: SingleEventObject) => any, noDisable?: bool);
	reset(callback: Function);
}