(function($) {

	var executing = {};

	function startExecution(guid) {
		executing[guid] = true;
	}

	function completeExecution(guid) {
		delete executing[guid];
	}

	function isExecuting(guid) {
		return guid in executing;
	}

	$.single = function(callback, noDisable) {
		var guid;

		function wrapper(event) {
			// if the function is already executing, stop.
			if (isExecuting(guid))
				return;

			startExecution(guid);
			event = event || {};

			// if this is an event on a control, disable the control
			var disableControl = !noDisable && event.delegateTarget
				&& ['BUTTON', 'INPUT'].indexOf(event.delegateTarget.nodeName) >= 0;

			if (disableControl)
				$(event.delegateTarget).prop('disabled', true)

			// give the callback a way to mark itself as finished
			event.complete = function() {
				completeExecution(guid);
				if (disableControl)
					$(event.delegateTarget).prop('disabled', false);
			}

			// call the callback
			callback.apply(this, Array.prototype.slice.apply(arguments));
		}

		wrapper.guid = callback.guid = callback.guid || $.guid++;
		guid = wrapper.guid;

		return wrapper;
	}

	$.reset = function(callback) {
		if (callback.guid) {
			completeExecution(callback.guid);
		}
	}

})($ || jQuery);