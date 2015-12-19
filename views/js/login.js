$( document ).ready(function () {
	$('button#loginBtn').click(function () {
		var email = $('#emailInput').val();
		var password = $('#passwordInput').val();

		if (email === '' || password === '') {
			$('#issue').text('Please enter email and password to login!');
			return;
		}

		var postData = {
			email: email,
			password: password
		};

		$.post('/login', postData, function (data) {
			if (!data.success) {
				$('#issue').text(data.msg);
			} else {
				window.location = '/home';
			}
		});
	});
});