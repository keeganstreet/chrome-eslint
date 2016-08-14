var loadScript = function(file) {
	return new Promise(function(resolve, reject) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', file, true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState === XMLHttpRequest.DONE) {
				if (xhr.status === 200) {
					resolve({
						file: file,
						code: xhr.responseText
					});
				} else {
					resolve({
						file: file,
						code: '/* Could not load. Status = ' + xhr.status + '*/'
					});
				}
			}
		};
		xhr.send();
	});
};

document.addEventListener('DOMContentLoaded', function() {
	var $content = document.createElement('div');

	chrome.tabs.executeScript(null, {
		file: 'source/get-scripts.js'
	}, function(scriptResults) {
		var scripts = scriptResults[0],
			promises = [];

		scripts.forEach(function(script) {
			if (script.file) {
				promises.push(loadScript(script.file));
			} else {
				promises.push(new Promise(function(resolve) {
					resolve({
						file: 'Inline script',
						code: script.code
					});
				}));
			}
		});

		Promise.all(promises).then(function(results) {
			require(['../libs/eslint.js'], function(ESLint) {
				var espree = require('espree');

				results.forEach(function(result) {
					var $h2 = document.createElement('h2');
					$h2.textContent = result.file;
					$content.appendChild($h2);

					// It is hard to read the linting output for a minified file,
					// so generate an Abstract Syntax Tree (AST), then convert
					// the AST into a nicely formatted script with one operation per line.
					var ast = espree.parse(result.code);
					var newCode = escodegen.generate(ast);

					if (result.file === 'Inline script') {
						var $inline = document.createElement('div'),
							$inlineLink = document.createElement('a'),
							$inlineLink2 = document.createElement('a'),
							$inlineCode = document.createElement('code'),
							$inlineCode2 = document.createElement('code'),
							createClickListener = function($link, $code) {
								$link.addEventListener('click', function(e) {
									e.preventDefault();
									if ($code.getAttribute('class').indexOf('hidden') === -1) {
										$code.setAttribute('class', 'scrolling-code hidden');
									} else {
										$code.setAttribute('class', 'scrolling-code');
									}
								});
							};

						$inlineLink.textContent = 'Show inline script (original)';
						$inlineLink2.textContent = 'Show inline script (beautified)';
						$inlineCode.textContent = result.code;
						$inlineCode2.textContent = newCode;
						$inlineLink.setAttribute('href', '#');
						$inlineLink2.setAttribute('href', '#');
						$inlineCode.setAttribute('class', 'scrolling-code hidden');
						$inlineCode2.setAttribute('class', 'scrolling-code hidden');
						createClickListener($inlineLink, $inlineCode);
						createClickListener($inlineLink2, $inlineCode2);

						$content.appendChild($inlineLink);
						$content.appendChild($inlineCode);
						$content.appendChild(document.createElement('br'));
						$content.appendChild($inlineLink2);
						$content.appendChild($inlineCode2);
					}

					var messages = ESLint.verify(newCode, {
						env: {
							browser: true,
							es6: true,
							commonjs: true,
							amd: true,
							jquery: true
						},
						globals: {
							TLT: true,
							require: true,
							define: true
						},
						rules: {
							'no-implicit-globals': 2,
							'no-undef': 2,
							// 'no-redeclare': 2,
							// 'no-native-reassign': 2
						}
					}, { filename: result.file });

					messages.forEach(function(m) {
						var $result = document.createElement('p'),
							$summary = document.createElement('div'),
							$code = document.createElement('code');

						$summary.textContent = m.line + ':' + m.column + ' ' + m.message;
						$code.textContent = m.source.trim();
						$code.setAttribute('class', 'scrolling-code');
						$result.appendChild($summary);
						$result.appendChild($code);
						$content.appendChild($result);
					});

					if (messages.length === 0) {
						var $p = document.createElement('p');
						$p.textContent = 'No errors in this file.';
						$content.appendChild($p);
					}
				});

				document.getElementById('result').appendChild($content);
			});
		});
	});
});
