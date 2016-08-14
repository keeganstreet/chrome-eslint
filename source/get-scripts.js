(function() {
	var scripts = [];

	Array.prototype.forEach.call(document.scripts, function(script) {
		if (!script.getAttribute('type') || script.getAttribute('type') === 'text/javascript') {
			if (script.getAttribute('src')) {
				var src = script.getAttribute('src');

				if (src.indexOf('://') !== -1) {
					// Nice, we have a fully qualified URL
				} else if (src.substr(0, 2) === '//') {
					// Add protocol
					src = window.location.protocol + src;
				} else if (src.substr(0, 1) === '/') {
					// Add protocol and domain
					src = window.location.protocol  + '//' + window.location.host + src;
				} else {
					// Add protocol, domain and path
					src = window.location.protocol  + '//' + window.location.host + window.location.pathname.split('/').slice(0, -1).join('/') + '/' + src;
				}

				scripts.push({
					file: src
				});

			} else {
				scripts.push({
					code: script.innerHTML
				});
			}
		}
	});

	return scripts;
}());
