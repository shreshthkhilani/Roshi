$( document ).ready(function () {
	$('button#loginBtn').click(function () {
		$.post('/recalculate', {}, function (data) {
			if (data.success) {
				window.location = '/jobs';
			}
		});
	});
});