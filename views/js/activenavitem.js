$( document ).ready(function () {
	var pathname = window.location.pathname;
	if (pathname === '/home') {
		$('#homenav').addClass('activenavitem');
	} else if (pathname === '/jobs') {
		$('#jobsnav').addClass('activenavitem');
	} else if (pathname === '/interested') {
		$('#intnav').addClass('activenavitem');
	}
});