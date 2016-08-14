var loadScript = function(file) {
	return new Promise(function(resolve, reject) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', file, true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState === XMLHttpRequest.DONE) {
				if (xhr.status === 200) {
					resolve(xhr.responseText);
				} else {
					resolve('/* Could not load. Status = ' + xhr.status + '*/');
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
			lintStack = [],
			lintNextItemOnStack,
			renderResults;

		lintNextItemOnStack = (function() {
			var isLinting = false;

			return function() {
				var nextScript,
					webWorker;

				if (isLinting || lintStack.length === 0) {
					return;
				}

				isLinting = true;
				nextScript = lintStack.shift();
				webWorker = new Worker('eslint-web-worker.js');

				webWorker.addEventListener('message', function(e) {
					nextScript.messages = e.data.messages;
					nextScript.codeBeautified = e.data.codeBeautified;
					renderResults(nextScript);
					isLinting = false;
					lintNextItemOnStack();
				});

				webWorker.postMessage({
					url: window.location.protocol + '//' + window.location.host,
					file: nextScript.file,
					code: nextScript.code
				});
			};
		}());

		renderResults = function(script) {
			script.$div.textContent = '';

			if (!script.file) {
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
				$inlineCode.textContent = script.code;
				$inlineCode2.textContent = script.codeBeautified;
				$inlineLink.setAttribute('href', '#');
				$inlineLink2.setAttribute('href', '#');
				$inlineCode.setAttribute('class', 'scrolling-code hidden');
				$inlineCode2.setAttribute('class', 'scrolling-code hidden');
				createClickListener($inlineLink, $inlineCode);
				createClickListener($inlineLink2, $inlineCode2);

				script.$div.appendChild($inlineLink);
				script.$div.appendChild($inlineCode);
				script.$div.appendChild(document.createElement('br'));
				script.$div.appendChild($inlineLink2);
				script.$div.appendChild($inlineCode2);
			}

			script.messages.forEach(function(m) {
				var $result = document.createElement('p'),
					$summary = document.createElement('div'),
					$code = document.createElement('code');

				$summary.textContent = m.line + ':' + m.column + ' ' + m.message;
				$code.textContent = m.source.trim();
				$code.setAttribute('class', 'scrolling-code');
				$result.appendChild($summary);
				$result.appendChild($code);
				script.$div.appendChild($result);
			});

			if (script.messages.length === 0) {
				var $p = document.createElement('p');
				$p.textContent = 'No errors in this file.';
				script.$div.appendChild($p);
			}
		};

		scripts.forEach(function(script) {
			var $h2 = document.createElement('h2');
			$h2.textContent = script.file || 'Inline script';
			$content.appendChild($h2);
			var $div = document.createElement('div');
			$div.textContent = 'Linting...';
			$content.appendChild($div);
			script.$div = $div;

			if (script.file) {
				loadScript(script.file).then(function(data) {
					script.code = data;
					lintStack.push(script);
					lintNextItemOnStack();
				});
			} else {
				lintStack.push(script);
			}
		});

		document.getElementById('result').appendChild($content);
		lintNextItemOnStack();
	});
});
