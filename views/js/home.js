$( document ).ready(function () {
	$('#photoForm').hide();
	var year = $('#classDiv').html();
	if (year !== '0') {
		$('#year').val(year);
	}
	$('#fileInput').change(function () {
    $('#photoForm').submit(); 
  });
  $('.uploadBtn').click(function () {
    $('#fileInput').trigger('click');
  });

  var school0 = $('#school0Div').html();
	if (school0 !== 'undefined') {
		$('#school0').val(school0);
	}
	var school1 = $('#school1Div').html();
	if (school1 !== 'undefined') {
		$('#school1').val(school1);
	}
  // TODO: jQuery to post to '/editProfile'
});