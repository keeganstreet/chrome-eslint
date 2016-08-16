var saveOptions = function() {
	var status = document.getElementById('status'),
		env,
		globals,
		rules;

	try {
		env = JSON.parse(document.getElementById('env').value);
		globals = JSON.parse(document.getElementById('globals').value);
		rules = JSON.parse(document.getElementById('rules').value);
	} catch(e) {
		status.textContent = 'Error parsing input as JSON.';
		setTimeout(function() {
			status.textContent = '';
		}, 750);
		return;
	}

	chrome.storage.sync.set({
		env: env,
		globals: globals,
		rules: rules
	}, function() {
		restoreOptions();
		status.textContent = 'Options saved.';
		setTimeout(function() {
			status.textContent = '';
		}, 750);
	});
};

var restoreOptions = function() {
	chrome.storage.sync.get({
		env: defaults.env,
		globals: defaults.globals,
		rules: defaults.rules
	}, function(config) {
		document.getElementById('env').value = JSON.stringify(config.env, null, '  ');
		document.getElementById('globals').value = JSON.stringify(config.globals, null, '  ');
		document.getElementById('rules').value = JSON.stringify(config.rules, null, '  ');
	});
};

document.addEventListener('DOMContentLoaded', function() {
	restoreOptions();
	document.getElementById('save').addEventListener('click', saveOptions);
});
