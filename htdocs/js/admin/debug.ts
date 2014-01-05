/// <reference path="base.ts" />

$(function() {
	$('.autoexpand').autoexpand();
	$('select').chosen({ disable_search: true });

	$('#send').click(debug.sendRequest);
	$('#api-request input, #api-request select, #api-request textarea').change(debug.updateFields);
	$('#api-request textarea').keydown((e: KeyboardEvent) => {
		if (e.which === 13 && e.ctrlKey) 
			debug.sendRequest();
	}).bind('input', (e) => {
		debug.updateFields();
	});

	debug.updateFields();
})

interface JQuery {
	autoexpand();
}

jQuery.fn.autoexpand = function() {
	return this.each(function () {
		var container = $(this);
		var area = container.find('textarea');
		var span = container.find('span');

		function update() {
			span.text(area.val());
		}

		area.bind('input', update);
		setTimeout(update, 500);
	});
}

module Debug {
	enum parsemode { name, value, multiline }

	export class DebugHandler {

		private _lastDatatype: string = null;
		private _lastMethod: string = null;

		constructor() {
			bindMemberFunctions(this);
		}

		get method() {
			return $('#method-get').is(':checked') ? 'get' : 'post';
		}

		sendRequest() {
			if (this.method === 'get')
				debug.sendRequestHelper(jsdc.get, this.getParams());
			else
				debug.sendRequestHelper(jsdc.post, debug.getQueryBody());
		}

		private sendRequestHelper(fn: (method: string, data: any) => JQueryPromise<any>, data: any) {
			console.log(data);

			this.displayProgress();
			fn($('#datatype').val(), data).then(
				(res) => {
					this.displayResponse(res);
				},
				(...reasons) => {
					var xhr: JQueryXHR = reasons[0]
					console.log(xhr.responseText);
					this.displayResponse({
						status: xhr.status,
						response: JSON.parse(xhr.responseText)
					});
				}
			);
		}

		getParams() {
			var text: string[] = $('#params').val().split('\n');
			var params = {};
			var mode = parsemode.name;
			var currentName = '';
			var currentValue = '';

			for (var i = 0; i < text.length; i++) {
				var line = text[i].trim();
				switch (mode) {
					case parsemode.name:
						var split = line.partition('=');
						if (split.success) {
							currentName = split.before.trim();
							mode = parsemode.value;
							text[i] = split.after;
							i--;
						} else {
							line = line.trim();
							if (line !== '')
								params[line] = null;
						}
						break;

					case parsemode.value:
						line = line.replace(/;$/, '');
						if ((line.startswith('{') && !line.endswith('}'))
							|| (line.startswith('[') && !line.endswith(']'))) {
							// multiline
							currentValue = line;
							mode = parsemode.multiline;
						} else {
							try {
								params[currentName] = JSON.parse(line);
							} catch (e) {
								params[currentName] = line;
							}
							mode = parsemode.name;
						}
						break;

					case parsemode.multiline:
						if (line.length === 0) {
							// blank line = end of object
							params[currentName] = JSON.parse(currentValue);
							mode = parsemode.name;
						} else if (line.endswith(';')) {
							currentValue += line.substr(0, line.length - 1);
							params[currentName] = JSON.parse(currentValue);
							mode = parsemode.name;
						} else {
							currentValue += line;
						}
						break;
				}
			}

			if (mode === parsemode.multiline) {
				params[currentName] = JSON.parse(currentValue);
			}

			return params;
		}

		getQueryUrl() {
			var datatype = $('#datatype').val();
			if (this.method === 'post')
				return jsdc.apiUrl(datatype);
			else
				return jsdc.apiUrl(datatype, this.getParams());
		}

		getQueryBody() {
			if (this.method === 'get') 
				return null;
			else {
				try {
					var params = this.getParams();
					params['method'] = $('#post-method').val();
					return params;
				} catch (e) {
					return e;
				}
			}
		}

		displayProgress() {
			$('#response').text('Working...');
		}

		displayResponse(obj: any) {
			$('#response').text(writeObject(obj, 99));
		}

		updateFields() {
			var url, decoded, highlighted;
			try {
				url = this.getQueryUrl();
				decoded = decodeURIComponent(url);
				highlighted = url.replace(/(%[0-9a-fA-F]{2})/g, '<span class="escape">$1</span>');
			} catch (e) {
				url = decoded = e.toString();
			}


			$('#queryurl').text(decoded);
			$('#queryurl-encoded').html(url == decoded ? '' : highlighted);

			if (this.method === 'get') {
				$('#querybody').text('');
				$('#post-fields select').prop('disabled', true)
					.trigger('chosen:update');
			} else {
				$('#querybody').text(writeObject(this.getQueryBody(), 99));
				$('#post-fields select').prop('disabled', false)
					.trigger('chosen:update');
			}

			var datatype = $('#datatype').val();
			var method = this.method;
			if (datatype != this._lastDatatype || method != this._lastMethod) {
				// update docs column
				var sel = method + '-' + datatype;
				$('#doc div:not(#' + sel + ')').hide();
				$('#doc #' + sel).show();

				this._lastDatatype = datatype;
				this._lastMethod = method;
			}
		}

	}
}

var debug = new Debug.DebugHandler();