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

	$('.saveBtn').click(function () {
		$('.has-error').removeClass('has-error');

		var firstname = $('#firstname').val();
		var lastname = $('#lastname').val();
		var gpa = $('#gpa').val();
		var year = $('#year').val();
		var school = [];
		var major = [];
		var minor = [];
		if ($('#school0').val() !== '') {
			school.push($('#school0').val());
			if ($('#school1').val() !== '') {
				school.push($('#school1').val());
			}
		}
		if ($('#major1').val() !== '') {
			major.push($('#major1').val());
			if ($('#major2').val() !== '') {
				major.push($('#major2').val());
				if ($('#major3').val() !== '') {
					major.push($('#major3').val());
				}
			}
		}
		if ($('#minor1').val() !== '') {
			minor.push($('#minor1').val());
			if ($('#minor2').val() !== '') {
				minor.push($('#minor2').val());
				if ($('#minor3').val() !== '') {
					minor.push($('#minor3').val());
				}
			}
		}

		if (firstname === '') {
			$('#firstname').parent().addClass('has-error'); 
			window.location.hash = '#firstname'; 
			return;
		}
		if (lastname === '') {
			$('#lastname').parent().addClass('has-error'); 
			window.location.hash = '#lastname'; 
			return;
		}
		if (gpa === undefined) {
			$('#gpa').parent().addClass('has-error'); 
			window.location.hash = '#gpa'; 
			return;
		}
		if (year === '') {
			$('#year').parent().addClass('has-error'); 
			window.location.hash = '#year'; 
			return;
		}
		if (school[0] === undefined) {
			$('#school0').parent().addClass('has-error'); 
			window.location.hash = '#school0'; 
			return;
		}
		if (major[0] === undefined) {
			$('#major0').parent().addClass('has-error'); 
			window.location.hash = '#major0'; 
			return;
		}

		var work = {
			'summer2015': {
				'company': '',
				'position': ''
			},
			'summer2014': {
				'company': '',
				'position': ''
			}
		};
		work.summer2015.company = $('#company1').val();
		work.summer2015.position = $('#position1').val();
		work.summer2014.company = $('#company2').val();
		work.summer2014.position = $('#position2').val();

		var clubs = [];

		if ($('#club1').val() !== '') {
			var club1 = {
				group: $('#club1').val(),
				position: ''
			};
			clubs.push(club1);
			if ($('#clubposition1').val() !== '') {
				clubs[0].position = $('#clubposition1').val();
				if ($('#club2').val() !== '') {
					var club2 = {
						group: $('#club2').val(),
						position: ''
					};
					clubs.push(club2);
					if ($('#clubposition2').val() !== '') {
						clubs[1].position = $('#clubposition2').val();
					}
				}
			}
		}

		var projects = $('#projects').val();

		var classes = [];

		if ($('#class1').val() !== '') {
			classes.push($('#class1').val());
			if ($('#class2').val() !== '') {
				classes.push($('#class2').val());
				if ($('#class3').val() !== '') {
					classes.push($('#class3').val());
					if ($('#class4').val() !== '') {
						classes.push($('#class4').val());
					}
				}
			}
		}

		var value = {
			firstname: firstname,
	    lastname: lastname,
	    gpa: gpa,
	    year: year,
	    school: school,
	    major: major,
	    minor: minor,
	    work: work,
	    clubs: clubs,
	    projects: projects,
	    classes: classes
		};

		console.log(value);
		$.post('/editProfile', value, function (data) {
			if (data.success) {
				window.location = '/home';
			}
		});

	});
});