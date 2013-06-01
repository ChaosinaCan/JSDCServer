/// <reference path="jquery.d.ts" />

interface SimpleModalCallback {
	(dialog: SimpleModalDialog): any;
}

interface SimpleModalOptions {
	appendTo?: string;
	focus?: bool;
	opacity?: number;
	overlayId?: string;
	overlayCss?: any;
	containerId?: string;
	containerCss?: any;
	dataId?: string;
	dataCss?: any;
	minHeight?: number;
	minWidth?: number;
	maxHeight?: number;
	maxWidth?: number;
	autoResize?: bool;
	autoPosition?: bool;
	zIndex?: number;
	close?: bool;
	closeHTML?: string;
	closeClass?: string;
	escClose?: bool;
	overlayClose?: bool;
	position?: any[];
	persist?: bool;
	modal?: bool;
	onOpen?: SimpleModalCallback;
	onShow?: SimpleModalCallback;
	onClose?: SimpleModalCallback;
}

interface SimpleModalDialog {
	container: JQuery;
	wrap: JQuery;
	data: JQuery;
	overlay: JQuery;
	origHeight: number;
	origWidth: number;
	placeholder: bool;
}

interface JQuery {
	modal(options?: SimpleModalOptions);
}

interface JQueryStatic {
	modal: {
		(element: JQuery, options?: SimpleModalOptions);
		(element: HTMLElement, options?: SimpleModalOptions);
		(html: string, options?: SimpleModalOptions);
		close();
		focus(pos: any);
		setContainerDimensions();
		setPosition();
		update(height: number, width: number);
		defaults: SimpleModalOptions;
		impl;
	};
}
