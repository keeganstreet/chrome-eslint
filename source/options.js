var saveOptions = function() {
	var env = document.getElementById('env').value;
	var globals = document.getElementById('globals').value;
	var rules = document.getElementById('rules').value;
	chrome.storage.sync.set({
		env: env,
		globals: globals,
		rules: rules
	}, function() {
		var status = document.getElementById('status');
		status.textContent = 'Options saved.';
		setTimeout(function() {
			status.textContent = '';
		}, 750);
	});
};

var restoreOptions = function() {
	chrome.storage.sync.get({
		env: JSON.stringify(defaults.env, null, '  '),
		globals: JSON.stringify(defaults.globals, null, '  '),
		rules: JSON.stringify(defaults.rules, null, '  ')
	}, function(config) {
		document.getElementById('env').value = config.env;
		document.getElementById('globals').value = config.globals;
		document.getElementById('rules').value = config.rules;
	});
};

document.addEventListener('DOMContentLoaded', function() {
	restoreOptions();
	document.getElementById('save').addEventListener('click', saveOptions);
});
