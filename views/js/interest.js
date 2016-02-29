$( document ).ready(function () {
	var removecheck = function () {
		$('button.roshiBtn2').children().hide();
	};
	var addcheck = function () {
		$('button.interestedBtn').children().show();
	};
	removecheck();

	$('button.iTB').click(function (isInterested) {
		var btnId = $(this).attr('id');
		var jobId = parseInt(btnId.substring(2));
		postData = {
			jobId: jobId,
			isInterested: 1
		};
		$.post('/changeInterest', postData, function (data) {
			if (data.success) {
				location.reload();
			}
		});
	});
	$('button.iFB').click(function (isInterested) {
		var btnId = $(this).attr('id');
		var jobId = parseInt(btnId.substring(2));
		postData = {
			jobId: jobId,
			isInterested: 0
		};
		$.post('/changeInterest', postData, function (data) {
			if (data.success) {
				location.reload();
			}
		});
	});
});