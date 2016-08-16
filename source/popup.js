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
	var $content = document.createDocumentFragment();

	document.getElementById('configure').addEventListener('click', function(e) {
		e.preventDefault();
		chrome.runtime.openOptionsPage();
	});

	chrome.storage.sync.get({
		env: defaults.env,
		globals: defaults.globals,
		rules: defaults.rules
	}, function(config) {
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
					nextScript.$div.textContent = 'Linting script...';
					webWorker = new Worker('eslint-web-worker.js');

					webWorker.addEventListener('message', function(e) {
						nextScript.messages = e.data.messages;
						nextScript.codeBeautified = e.data.codeBeautified;
						renderResults(nextScript);
						isLinting = false;
						lintNextItemOnStack();
					});

					webWorker.postMessage({
						config: config,
						url: window.location.protocol + '//' + window.location.host,
						file: nextScript.file,
						code: nextScript.code
					});
				};
			}());

			renderResults = function(script) {
				script.$div.textContent = '';

				if (script.messages.length === 0) {
					var $p = document.createElement('p');
					$p.textContent = 'No errors in this file.';
					script.$div.appendChild($p);
				} else {
					var messagesSummary = {},
						$resultsSummary = document.createElement('table'),
						$resultsSummaryBody = document.createElement('tbody'),
						$showResultsLink = document.createElement('a'),
						$resultsDetail = document.createElement('div'),
						key,
						$row;

					$resultsSummary.innerHTML = '<thead><tr><th>Rule</th><th>Count</th></tr></thead>';
					$resultsSummary.appendChild($resultsSummaryBody);
					$resultsSummary.setAttribute('class', 'results-summary');
					$showResultsLink.textContent = 'Show full results';
					$showResultsLink.setAttribute('href', '#');
					$resultsDetail.setAttribute('class', 'results-detail hidden');
					$showResultsLink.addEventListener('click', function(e) {
						e.preventDefault();
						if ($resultsDetail.getAttribute('class').indexOf('hidden') === -1) {
							$resultsDetail.setAttribute('class', 'results-detail hidden');
						} else {
							$resultsDetail.setAttribute('class', 'results-detail');
						}
					});

					script.messages.forEach(function(m) {
						if (messagesSummary.hasOwnProperty(m.ruleId)) {
							messagesSummary[m.ruleId] += 1;
						} else {
							messagesSummary[m.ruleId] = 1;
						}

						var $result = document.createElement('p'),
							$summary = document.createElement('div'),
							$code = document.createElement('code');

						$summary.textContent = m.line + ':' + m.column + ' ' + m.message;
						$code.textContent = m.source.trim();
						$code.setAttribute('class', 'scrolling-code');
						$result.appendChild($summary);
						$result.appendChild($code);
						$resultsDetail.appendChild($result);
					});

					for (key in messagesSummary) {
						if (messagesSummary.hasOwnProperty(key)) {
							$row = document.createElement('tr');
							$row.innerHTML = `<td>${key}</td><td>${messagesSummary[key]}</td>`;
							$resultsSummaryBody.appendChild($row);
						}
					}

					script.$div.appendChild($resultsSummary);
					script.$div.appendChild($showResultsLink);
					script.$div.appendChild(document.createElement('br'));
					script.$div.appendChild($resultsDetail);
				}

				var $sourceLink = document.createElement('a'),
					$sourceLink2 = document.createElement('a'),
					$sourceCode = document.createElement('code'),
					$sourceCode2 = document.createElement('code'),
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

				$sourceLink.textContent = 'Show source (original)';
				$sourceLink2.textContent = 'Show source (beautified)';
				$sourceCode.textContent = script.code;
				$sourceCode2.textContent = script.codeBeautified;
				$sourceLink.setAttribute('href', '#');
				$sourceLink2.setAttribute('href', '#');
				$sourceCode.setAttribute('class', 'scrolling-code hidden');
				$sourceCode2.setAttribute('class', 'scrolling-code hidden');
				createClickListener($sourceLink, $sourceCode);
				createClickListener($sourceLink2, $sourceCode2);

				script.$div.appendChild($sourceLink);
				script.$div.appendChild($sourceCode);
				script.$div.appendChild(document.createElement('br'));
				script.$div.appendChild($sourceLink2);
				script.$div.appendChild($sourceCode2);
			};

			scripts.forEach(function(script) {
				var $h2 = document.createElement('h2');
				$h2.textContent = script.file || 'Inline script';
				$content.appendChild($h2);
				var $div = document.createElement('div');
				$div.setAttribute('class', 'results-container');
				$div.textContent = (script.file ? 'Loading script...' : 'Waiting for Web Worker...');
				$content.appendChild($div);
				script.$div = $div;

				if (script.file) {
					loadScript(script.file).then(function(data) {
						script.code = data;
						lintStack.push(script);
						$div.textContent = 'Waiting for Web Worker...';
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
});
