$( document ).ready(function () {
	$('button#recalc').click(function () {
		$.post('/recalculate', {}, function (data) {
			if (data.success) {
				window.location = '/jobs';
			}
		});
	});
});