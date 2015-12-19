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
  // TODO: jQuery to post to '/editProfile'
});