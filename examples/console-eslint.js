(function() {
	var scripts = [],
		promises = [];

	var loadScript = function(uri) {
		console.log(uri);
		return new Promise(function(resolve, reject) {
			var xhr = new XMLHttpRequest();
			xhr.open('GET', uri, true);
			xhr.onreadystatechange = function() {
				if (xhr.readyState === XMLHttpRequest.DONE) {
					if (xhr.status === 200) {
						resolve({
							uri: uri,
							source: xhr.responseText
						});
					} else {
						reject();
					}
				}
			};
			xhr.send();
		});
	};

	Array.prototype.forEach.call(document.scripts, function(script) {
		if (!script.getAttribute('type') || script.getAttribute('type') === 'text/javascript') {
			if (script.getAttribute('src')) {
				promises.push(loadScript(script.getAttribute('src')));
			} else {
				promises.push(new Promise(function(resolve) {
					resolve({
						uri: 'Inline script',
						source: script.innerHTML
					});
				}));
			}
		}
	});

	Promise.all(promises).then(function(results) {
		console.log(results);
	});
}());
