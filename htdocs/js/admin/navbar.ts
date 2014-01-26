/// <reference path="base.ts" />

$(function() {
	NavBar.init();
})

/** Handles the top navigation bar */
module NavBar {
	var nav: JQuery;
	var list: JQuery;
	var current: JQuery;
	var leftButton: JQuery;
	var rightButton: JQuery;

	var keepCurrentCentered = true;

	/** Intializes the navigation bar */
	export function init() {
		nav = $('header#branding nav');
		list = nav.find('ul');
		current = list.find('.current');
		leftButton = nav.find('.scroll-left');
		rightButton = nav.find('.scroll-right');

		// attach scroll events
		leftButton.click($.single((e) => {
			shift(3);
			setTimeout(e.complete, 300);
		}));

		rightButton.click($.single((e) => {
			shift(-3);
			setTimeout(e.complete, 300);
		}));

		nav.bind('mousewheel', $.single((e) => {
			function sign(x) { return x ? x < 0 ? -1 : 1 : 0; }

			var delta = sign((<MouseWheelEvent><any>e.originalEvent).wheelDelta) * 3;
			shift(delta);

			e.preventDefault();
			setTimeout(e.complete, 300);
		}));

		// Prevent selecting the scroll buttons
		function preventDefault(e) {
			e.preventDefault();
			e.stopPropagation();
		}

		leftButton.mousedown(preventDefault);
		rightButton.mousedown(preventDefault);

		$(window).resize(update);
		update();
	}

	function getListWidth(): number {
		var last = list.find('li').last();
		return last.position().left + last.width() + 20;
	}

	function getLeft(): number {
		return list.position().left;
	}

	function getRight(): number {
		return nav.width() - (getLeft() + getListWidth());
	}

	function getItemLeft(item: JQuery): number {
		return getLeft() + item.position().left;
	}

	function getItemRight(item: JQuery): number {
		return nav.width() - (getItemLeft(item) + item.width());
	}

	function getCurrentLeft(): number {
		return getItemLeft(current);
	}

	function getCurrentRight(): number {
		return getItemRight(current);
	}

	function getLeftVisibleElement(): JQuery {
		var items = list.find('li');
		for (var i = 0; i < items.length; i++) {
			var item = $(items.get(i));
			if (item.position().left + item.width() / 2 + getLeft() > 0)
				return item;
		}
		return null;
	}

	function getRightVisibleElement(): JQuery {
		var items = list.find('li');
		for (var i = items.length - 1; i >= 0; i--) {
			var item = $(items.get(i));
			if (item.position().left + item.width() / 2 + getLeft() < nav.width())
				return item;
		}
		return null;
	}

	/**
	 * Scrolls the navigation bar
	 * @param x The number of links to shift by
	 */
	export function shift(x: number) {
		keepCurrentCentered = false;
		var prev = getLeftVisibleElement().prev();
		var next = getRightVisibleElement().next();

		while (x > 0) {
			x--;
			if (prev.length === 0) {
				list.css('left', '0px');
				break;
			} else {
				list.css('left', getLeft() - getItemLeft(prev) + 'px');
			}

			prev = prev.prev();
		}

		while (x < 0) {
			x++;
			if (next.length === 0) {
				list.css('left', nav.width() - getListWidth() + 'px');
				break;
			} else {
				list.css('left', getLeft() + getItemRight(next) + 'px');
			}

			next = next.next();
		}

		setTimeout(update, 300);
	}

	function centerCurrentElement() {
		var currentCenter = getCurrentLeft() + current.width() / 2;
		var navCenter = nav.width() / 2;
		var offset = navCenter - currentCenter;

		var newLeft = Math.max(Math.min(getLeft() + offset, 0), nav.width() - getListWidth());

		list.addClass('no-anim');
		setTimeout(() => list.css('left', newLeft + 'px'), 10);
		setTimeout(() => {
			list.removeClass('no-anim');
			updateButtons();
		}, 100);
	}

	function updateButtons() {
		if (getRight() === 0)
			rightButton.addClass('disabled');
		else
			rightButton.removeClass('disabled');

		if (getLeft() === 0)
			leftButton.addClass('disabled');
		else
			leftButton.removeClass('disabled');
	}

	/** Updates the navigation bar (for example, after a screen resize) */
	export function update() {
		updateButtons();

		if (keepCurrentCentered)
			centerCurrentElement();
	}
}