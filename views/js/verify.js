$( document ).ready(function () {
	$('button#verifyBtn').click(function () {
		$.post('/sendVerification', {}, function (data) {
			$('#issue').text(data.msg);
		});
	});
});