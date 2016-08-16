var lint = function(data) {
	// Escodegen must be loaded before require.js.
	// It has been built with "CommonJS Everywhere" and will not execute properly if require is defined.
	importScripts(data.url + '/libs/escodegen.browser.js');

	// Require.js is required to load ESLint. ESLint has been built with Browserify.
	importScripts(data.url + '/libs/require.js');

	require.config({
		baseUrl: data.url
	});

	require(['/libs/eslint.js'], function(ESLint) {
		// Espree is also included in eslint.js
		var espree = require('espree');

		// It is hard to read the linting output for a minified file,
		// so generate an Abstract Syntax Tree (AST), then convert
		// the AST into a nicely formatted script with one operation per line.
		var ast = espree.parse(data.code);
		var codeBeautified = escodegen.generate(ast);

		var messages = ESLint.verify(codeBeautified, data.config, { filename: data.file });

		self.postMessage({
			codeBeautified: codeBeautified,
			messages: messages
		});
	});
};

self.addEventListener('message', function(e) {
	lint(e.data);
}, false);
