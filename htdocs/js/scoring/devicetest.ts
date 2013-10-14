/// <reference path="../admin/base.ts" />

window.addEventListener('DOMContentLoaded', () => {

	var row = document.getElementById('javascript');
	row.lastElementChild.textContent = 'Passed';
	row.className = 'passed';

	$('#jquery > td:last-child').text('Passed');
	$('#jquery').removeClass('failed').addClass('passed');

	TestRunner.runAll();
}, false);

module TestRunner {

	export function runAll(): void {
		var tests: Test[] = [
			new Test('data-* attributes', () => {
				var a = $('<a>').attr('data-test', 'true');
				return a.attr('data-test') == 'true';
			}),
			new Test('AJAX get request', (test) => {
				jsdc.get('ping').then(test.pass, test.fail);
				return undefined;
			}),
			new Test('AJAX post request', (test) => {
				jsdc.post('ping', { method: 'ping' }).then(test.pass, test.fail);
				return undefined;
			}),
			new Test('Socket.IO', (test) => {
				jsdc.clock.connect((error) => {
					if (error) {
						test.fail(error);
					} else {
						test.pass();
					}
				});
				return undefined;
			}),
			new Test('WebSockets', (test) => {
				jsdc.clock.connect((error) => {
					if (error) {
						test.fail(error);
					} else {
						var transport = jsdc.clock._getSocket().socket.transport.name;
						if (transport === 'websocket') {
							test.pass();
						} else {
							test.fail('Transport is ' + transport)
						}
					}
				});
				return undefined;
			}),
		];

		tests.forEach((test) => {
			test.run();
		});
	}
}



class Test {
	name: string;
	testFunc: (test: Test) => boolean;

	private _rowEl: JQuery;
	private _resultEl: JQuery;

	constructor (name: string, testFunc: (test: Test) => boolean) {
		bindMemberFunctions(this);
		this.name = name;
		this.testFunc = testFunc;
	}

	run(): void {
		var row = this._rowEl = $('<tr>');
		row.append($('<td>').text(this.name));

		var result = this._resultEl = $('<td>').text('Running');
		row.append(result);
		$('#tests tbody').append(row);

		try {
			var success = this.testFunc(this);
			if (success !== undefined) {
				this.result(success);
			}
		} catch (e) {
			this.result(false);
		}
	}

	result(success: boolean, info?: string) {
		if (success) {
			this._resultEl.text('Passed');
			this._rowEl.addClass('passed');
		} else {
			this._resultEl.text('Failed');
			this._rowEl.addClass('failed');
		}

		if (info) {
			this._rowEl.attr('title', info);
		}
	}

	pass(info?: string): void {
		this.result(true, info);
	}

	fail(info?: string): void {
		this.result(false, info);
	}
}