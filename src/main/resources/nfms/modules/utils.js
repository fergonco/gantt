define([], function() {
	var today = new Date();
	today.setHours(0);
	today.setMinutes(0);
	today.setMilliseconds(0);

	return {
		"DAY_MILLIS" : 24 * 60 * 60 * 1000,
		"today" : today
	}
});