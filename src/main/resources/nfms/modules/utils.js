define([], function() {
	var today = new Date();
	today.setHours(0);
	today.setMinutes(0);
	today.setMilliseconds(0);

	var formatDate = function(date) {
		return (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();
	}

	return {
		"DAY_MILLIS" : 24 * 60 * 60 * 1000,
		"today" : today,
		"formatDate" : formatDate
	}
});