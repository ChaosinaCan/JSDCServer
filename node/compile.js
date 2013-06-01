if (!String.prototype.endsWith) {
	Object.defineProperty(String.prototype, 'endsWith', {
		enumerable: false,
		configurable: false,
		writable: false,
		value: function (searchString, position) {
			position = position || this.length;
			position = position - searchString.length;
			return this.lastIndexOf(searchString) === position;
		}
	});
}


var path = require('path'),
	exec = require('child_process').exec,
	less = require('less'),
	walk = require('walkr'),
	fs = require('fs');

function compileTS(path, callback) {
	console.log('compiling', path);
	var child = exec('tsc  -target ES5 ' + path, function(err, stdout, stderr) {
		if (err !== null) {
			console.log(err, stderr);
		}
		callback(err);
	});
}

function compileLESS(file, callback) {
	console.log('compiling', file);
	var dir = path.dirname(file);
	var name = path.basename(file, '.less');
	var cwd = process.cwd();
	process.chdir(dir);

	function done(err) {
		process.chdir(cwd);
		callback(err);
	}

	fs.readFile(name + '.less', 'utf-8', function(err, data) {
		if (err) {
			done(err);
		} else {
			less.render(data, function(err, css) {
				if (err) {
					done(err);
				} else {
					fs.writeFile(name + '.css', css, function(err) {
						done(err);
					});
				}
			});
		}
	});

}


function compileNodeServerTS(callback) {
	console.log('Compiling Node server TypeScript files.');
	var files = [];
	walk('.')
		.filterDir(/node_modules/)
		.on('file', function(ops) {
			var path = ops.source;
			if (path.endsWith('.ts') && !path.endsWith('.d.ts')) {
				files.push(path);
			}
		})
		.start(function(err) {
			function next() {
				if (files.length) {
					var file = files.pop();
					compileTS(file, next);
				} else {
					callback();
				}
			}

			next();
		});
}

function compileHttpServerTS(callback) {
	console.log('Compiling HTTP server TypeScript files.');
	var files = [];
	walk('../htdocs/js')
		.on('file', function(ops) {
			var path = ops.source;
			if (path.endsWith('.ts') && !path.endsWith('.d.ts')) {
				files.push(path);
			}
		})
		.start(function(err) {
			function next() {
				if (files.length) {
					var file = files.pop();
					compileTS(file, next);
				} else {
					callback();
				}
			}

			next();
		});
}

function compileStylesheets(callback) {
	console.log('Compiling LESS stylesheets.');
	var files = [];
	walk('../htdocs/css')
		.on('file', function(ops) {
			var path = ops.source;
			if (path.endsWith('.less')) {
				files.push(path);
			}
		})
		.start(function(err) {
			function next() {
				if (files.length) {
					var file = files.pop();
					compileLESS(file, next);
				} else {
					callback();
				}
			}

			next();
		});
}



compileNodeServerTS(function() {
	compileHttpServerTS(function() {
		compileStylesheets(function() {
			console.log('Done.');
		});
	});
});