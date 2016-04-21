var appurl = 'http://ec2-52-91-67-156.compute-1.amazonaws.com';

var express = require('express');
var app = express();

var http = require('http');
var path = require('path');
var engine = require('ejs-locals');
var session = require('express-session');
var multer  = require('multer');
var s3 = require('multer-s3');
var bodyParser = require('body-parser');
var fs = require('fs');
var async = require('async');
var assert = require('assert');
var secretObj = JSON.parse(fs.readFileSync('json/secret.json', 'utf8'));
// var mysqlObj = JSON.parse(fs.readFileSync('json/mysqldb.json', 'utf8'));
var awsObj = JSON.parse(fs.readFileSync('json/aws.json', 'utf8'));
var emailObj = JSON.parse(fs.readFileSync('json/email.json', 'utf8'));
var dateFormat = require('dateformat');
var bcrypt = require('bcrypt');
var nodemailer = require('nodemailer');
var uuid = require('node-uuid');
var PythonShell = require('python-shell');
app.engine('ejs', engine);
app.set('views', path.join( __dirname, 'views'));
app.set('view engine', 'ejs');

app.use(multer({dest: './uploads/', includeEmptyFields: true}).single('photo'));
app.use( express.static( path.join( __dirname, 'public' )));
app.use(express.static(__dirname + '/views/stylesheets'));
app.use(express.static(__dirname + '/views/images'));
app.use(express.static(__dirname + '/views/js'));
app.use(bodyParser.urlencoded({extended: true }));
app.use(bodyParser.json());

app.use(session({
  secret: secretObj.secret,
  resave: true,
  saveUninitialized: true,
  login: false
}));

var transporter = nodemailer.createTransport({
  service: emailObj.serv,
  auth: {
    user: emailObj.user,
    pass: emailObj.pass
  }
});

// var mysql      = require('mysql');
// var connection = mysql.createConnection({
//   host     : mysqlObj.host,
//   user     : mysqlObj.user,
//   password : mysqlObj.password,
//   port     : mysqlObj.port,
//   database : mysqlObj.database
// });

var ddb = require('dynamodb').ddb({ 
  accessKeyId: awsObj.accessKeyId, 
  secretAccessKey: awsObj.secretAccessKey,
  region: "us-east-1"
});

// var MongoClient = require('mongodb').MongoClient;
// var url = 'mongodb://localhost:27017/test';
// MongoClient.connect(url, function(err, db) {
//   assert.equal(null, err);
//   console.log("Connected correctly to server.");
//   db.close();
// });

/////////////////

app.get('/login', function (req, res) {
	res.redirect('/');
  return;
});

app.get('/', function (req, res) {
	if (req.session.login) {
    res.redirect('/home');
    return;
  }

  var t = 'Roshi';
  res.render('login', { 
    title: t,
    login: false,
    signin: true,
    signup: false
  });
});

app.get('/signup', function (req, res) {
  if (req.session.login) {
    res.redirect('/home');
    return;
  }

  var t = 'Roshi';
  res.render('index', { 
    title: t,
    login: false,
    signin: false,
    signup: true
  });
});

app.post('/login', function (req, res) {
	var email = req.body.email;
  var password = req.body.password;

	ddb.getItem('users', email, null, {}, function (err1, res1, cap1) {
		if (err1) {
			console.log('/login: Get Item');
			console.log(err1);
			res.send({success: false, msg: ''});
			return;
		} else if (typeof res1 === 'undefined') {
			res.send({success: false, msg: 'Email does not exist in system!'});
			return;
		} else {
			var value = JSON.parse(res1.value);
			bcrypt.compare(password, value.password, function (err2, res2) {
				if (err2) {
					console.log('/login: Compare hash');
					console.log(err2);
					res.send({success: false, msg: ''});
					return;
				} else {
					if (!res2) {
						res.send({success: false, msg: 'Password is incorrect!'});
						return;
					} else {
						req.session.login = true;
						req.session.email = email;
						req.session.isVerified = value.isVerified;
						res.send({success: true, msg: 'Welcome!'});
						return;
					}
				}
			});
		}
	});
});

app.post('/logout', function (req, res) {
	req.session.login = false;
  req.session.username = undefined;
  res.send({success: true, msg: 'Bye!'});
  return;
});

app.post('/create', function (req, res) {
	var email = req.body.email;
  var password = req.body.password;

  function endsWith (str, suffix) {
	  return str.indexOf(suffix, str.length - suffix.length) !== -1;
	}

	function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
	}

	if (!validateEmail(email)) {
		res.send({success: false, msg: 'You must enter a valid email address!'});
		return;
	}

  if (!endsWith(email, 'upenn.edu')) {
  	res.send({success: false, msg: 'Email must end with upenn.edu!'});
		return;
  }

  if (password.length < 6) {
  	res.send({success: false, msg: 'Password must have at least 6 characters!'});
		return;
  }

	ddb.getItem('users', email, null, {}, function (err1, res1, cap1) {
		if (err1) {
			console.log('/create: Get Item');
			console.log(err1);
			res.send({success: false, msg: ''});
			return;
		} else if (typeof res1 === 'undefined') {
			// Do it 
			bcrypt.hash(password, 8, function (err3, hash) {
				if (err3) {
					console.log('/create: Hash password');
					console.log(err3);
					res.send({success: false, msg: ''});
					return;
				} else {
					var verifyid = uuid.v4();
  				var verifyurl = appurl + '/v?id=' + verifyid;
					var value = {
						email: email,
						password: hash,
						isVerified: false,
						verifyid: verifyid,
						verifyurl: verifyurl,
						resume: '',
				    firstname: '',
				    lastname: '',
				    gpa: 0,
				    year: 0,
				    school: [],
				    major: [],
				    minor: [],
				    work: {
							'summer2015': {
								'company': '',
								'position': ''
							},
							'summer2014': {
								'company': '',
								'position': ''
							}
						},
				    clubs: [],
				    projects: '',
				    classes: []
					};
					var newItem = {
						email: email,
						value: JSON.stringify(value)
					};
					ddb.putItem('users', newItem, {}, function (err2, res2, cap2) {
						if (err2) {
							console.log('/create: Put Item');
							console.log(err2);
							res.send({success: false, msg: ''});
							return;
						} else {
							req.session.login = true;
							req.session.email = email;
							req.session.isVerified = value.isVerified;
							var vItem = {
								verifyid: verifyid,
								email: email
							};
							ddb.putItem('verification', vItem, {}, function (err5, res5, cap5) {
								if (err5) {
									console.log('/create: Put Item (verification)');
									console.log(err5);
									res.send({success: true, msg: 'Verification Incomplete!'});
									return;
								} else {
									recommendedItem = {
										email: email,
										value: JSON.stringify({rlist: []})
									};
									ddb.putItem('recommended', recommendedItem, {}, function (err6, res6, cap6) {
										if (err6) {
											console.log('/create: Put Item (recommended)');
											console.log(err6);
											res.send({success: true, msg: 'Error with DB, mail not sent!'});
										} else {
											interestedItem = {
												email: email,
												value: JSON.stringify({ilist: []})
											};
											ddb.putItem('interested', interestedItem, {}, function (err7, res7, cap7) {
												if (err7) {
													console.log('/create: Put Item (interested)');
													console.log(err7);
													res.send({success: true, msg: 'Error with DB, mail not sent!'});
												} else {
													var options = {
													  mode: 'text',
													  args: [email]
													};
													 
													PythonShell.run('py/make_recco.py', options, function (err8, results) {
													  if (err8) {
													  	console.log('/create: Python Shell');
															console.log(err8);
													  } else {
													  	// results is an array consisting of messages collected during execution 
													  	console.log('results: %j', results);
													  	var emailhtml = 'Click this link to complete verification:\n' + verifyurl;
														var mailOptions = {
							    						from: 'Roshi Recruiting <' + emailObj.user + '>',
							    						to: email,
							    						subject: '[Roshi] Verify Email Address', 
							    						text: emailhtml
														};
														transporter.sendMail(mailOptions, function (err4, info) {
															if (err4) {
																console.log('/create: Send Mail');
																console.log(err4);
																res.send({success: true, msg: 'Mail not sent!'});
																return;
															} else {
																res.send({success: true, msg: 'Welcome!'});
																return;
															}
														});
													  }
													});
												}
											});
										}
									});
								}
							});
						}
					});
				}
			});
		} else {
			res.send({success: false, msg: 'Email already exists in system!'});
			return;
		}
	});
});

app.post('/sendVerification', function (req, res) {
	var email = req.session.email;

	ddb.getItem('users', email, null, {}, function (err1, res1, cap1) {
		if (err1) {
			console.log('/sendVerification: Get Item');
			console.log(err1);
			res.send({success: false, msg: ''});
			return;
		} else {
			var value = JSON.parse(res1.value);
			var verifyid = value.verifyid;
			var verifyurl = value.verifyurl;
			var emailhtml = 'Click this link to complete verification:\n' + verifyurl;
			var mailOptions = {
				from: 'Roshi Recruiting <' + emailObj.user + '>',
				to: email,
				subject: '[Roshi] Verify Email Address', 
				text: emailhtml
			};
			transporter.sendMail(mailOptions, function (err4, info) {
				if (err4) {
					console.log('/sendVerifiation: Send Mail');
					console.log(err4);
					res.send({success: false, msg: 'Mail not sent!'});
					return;
				} else {
					res.send({success: true, msg: 'Mail sent!'});
					return;
				}
			});
		}
	});
});

app.get('/v', function (req, res) {
	var verifyid = req.query.id;
	ddb.getItem('verification', verifyid, null, {}, function (err1, res1, cap1) {
		if (err1) {
			console.log('/v: Get Item');
			console.log(err1);
			res.redirect('/');
			return;
		} else {
			var email = res1.email;
			ddb.getItem('users', email, null, {}, function (err2, res2, cap2) {
				if (err2) {
					console.log('/v: Get Item (users)');
					console.log(err2);
					res.redirect('/');
					return;
				} else {
					var value = JSON.parse(res2.value);
					if (value.isVerified) {
						res.redirect('/verified');
						return;
					}
					value.isVerified = true;
					var newItem = {
						email: email, 
						value: JSON.stringify(value)
					};
					ddb.updateItem('users', email, null, {'value': {value: JSON.stringify(value)}}, {}, function (err3, res3, cap3) {
						if (err3) {
							console.log('/v: Update Item');
							console.log(err3);
							res.redirect('/');
							return;
						} else {
							var mailOptions = {
								from: 'Roshi Recruiting <' + emailObj.user + '>',
								to: email,
								subject: '[Roshi] Welcome to Roshi!', 
								text: 'Your account has been verified! Welcome to Roshi!'
							};
							transporter.sendMail(mailOptions, function (err4, info) {
								if (err4) {
									console.log('/v: Send Email');
									console.log(err4);
									res.redirect('/verified');
									return;
								} else {
									if (typeof req.session.email === 'undefined') {
										res.redirect('/verified');
										return;
									} else if (req.session.email !== email) {
										res.redirect('/verified');
										return;
									} else {
										req.session.isVerified = true;
										res.redirect('/verified');
										return;
									}
								}
							});
						}
					});
				}
			});
		}
	});
});

app.post('/uploadResume', function (req, res) {
	var email = req.session.email;
	uploadToS3(req.file, function (image_url) {
		ddb.getItem('users', email, null, {}, function (err1, res1, cap1) {
			if (err1) {
				console.log('/uploadResume: Get Item');
				console.log(err1);
				res.redirect('/home');
				return;
			}
			var value = JSON.parse(res1.value);
			value.resume = image_url;
			ddb.updateItem('users', email, null, {'value': {value: JSON.stringify(value)}}, {}, function (err2, res2, cap2) {
				if (err2) {
					console.log('/uploadResume: Update Item');
					console.log(err2);
					res.redirect('/home');
					return;
				}
				res.redirect('/home');
				return;
			});
		});
  });
});

app.post('/editProfile', function (req, res) {
	var email = req.session.email;
	var profile = req.body;
	if (profile['school'] === undefined) {
		profile['school'] = [];
	}
	if (profile['major'] === undefined) {
		profile['major'] = [];
	}
	if (profile['minor'] === undefined) {
		profile['minor'] = [];
	}
	if (profile['clubs'] === undefined) {
		profile['clubs'] = [];
	}
	if (profile['classes'] === undefined) {
		profile['classes'] = [];
	}
	console.log(profile);
	ddb.getItem('users', email, null, {}, function (err1, res1, cap1) {
		if (err1) {
			console.log('/editProfile: Get Item');
			console.log(err1);
			res.send({success: false, msg: 'Get failed?'});
			return;
		}
		var value = JSON.parse(res1.value);
		value.firstname = profile.firstname;
		value.lastname = profile.lastname;
		value.gpa = profile.gpa;
		value.year = profile.year;
		value.school = profile.school;
		value.major = profile.major;
		value.minor = profile.minor;
		value.work = profile.work;
		value.clubs = profile.clubs;
		value.projects = profile.projects;
		value['classes'] = profile['classes'];
		// TODO: for rest of items
		ddb.updateItem('users', email, null, {'value': {value: JSON.stringify(value)}}, {}, function (err2, res2, cap2) {
			if (err2) {
				console.log('/editProfile: Update Item');
				console.log(err2);
				res.send({success: false, msg: 'Update failed!'});
				return;
			}
			res.send({success: true, msg: 'Thank you!'});
			return;
		});
	});
});

app.get('/verify', function (req,res) {
	if (!req.session.login) {
    res.redirect('/');
    return;
  }

  if (req.session.isVerified) {
  	res.redirect('/home');
  	return;
  }

  var t = 'Roshi';
  res.render('verify', { 
    title: t,
    login: true,
    signin: false,
    signup: false,
  });
});

app.get('/verified', function (req,res) {
	var t = 'Roshi';
	req.session.login = false;
  req.session.username = undefined;
  res.render('verified', { 
    title: t,
    login: req.session.login,
    signin: false,
    signup: false,
  });
});

app.get('/home', function (req, res) {
  if (!req.session.login) {
    res.redirect('/');
    return;
  }

  if (!req.session.isVerified) {
  	res.redirect('/verify');
  	return;
  }

  var email = req.session.email;
	ddb.getItem('users', email, null, {}, function (err1, res1, cap1) {
		if (err1) {
			console.log('/home: Get Item');
			console.log(err1);
		} else {
			var value = JSON.parse(res1.value);

			var t = 'Profile';
		  res.render('home', { 
		    title: t,
		    login: true,
		    signin: false,
		    signup: false,
		    email: value.email,
		    resume: value.resume,
		    firstname: value.firstname,
		    lastname: value.lastname,
		    gpa: value.gpa,
		    year: value.year,
		    school: value.school,
		    major: value.major,
		    minor: value.minor,
		    work: value.work,
		    clubs: value.clubs,
		    projects: value.projects,
		    classes: value.classes
		  });
		}
	});
});

var uploadToS3 = function (file, callback) {
  var file_suffix = uuid.v1();
  var s3 = require('s3');
  var client = s3.createClient({
    maxAsyncS3: 20,     // this is the default 
    s3RetryCount: 3,    // this is the default 
    s3RetryDelay: 1000, // this is the default 
    multipartUploadThreshold: 20971520, // this is the default (20 MB) 
    multipartUploadSize: 15728640, // this is the default (15 MB) 
    s3Options: {
      accessKeyId: awsObj.accessKeyId,
      secretAccessKey: awsObj.secretAccessKey
      // any other options are passed to new AWS.S3() 
      // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property 
    },
  });

  var file_ext = '';

  if (file.mimetype === 'application/pdf') {
    file_ext = ".pdf";
  } else {
    res.send({success: false, msg: 'Please upload only .pdf files!'});
  }

  var params = {
    localFile: file.path,     
    s3Params: {
      Bucket: 'roshi',
      Key: 'uploads/' + file_suffix + file_ext
      // other options supported by putObject, except Body and ContentLength. 
      // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property 
    },
    defaultContentType: file.mimetype
  };

  var uploader = client.uploadFile(params);
  uploader.on('error', function(err) {
    console.error("unable to upload:", err.stack);
  });
  uploader.on('progress', function() {
    console.log("progress", uploader.progressMd5Amount,
              uploader.progressAmount, uploader.progressTotal);
  });
  uploader.on('end', function() {
    console.log("done uploading");
    var image_url = 'https://s3.amazonaws.com/roshi/uploads/' + file_suffix + file_ext;
    callback(image_url);
  });
};

app.get('/jobs', function (req, res) {
  if (!req.session.login) {
    res.redirect('/');
    return;
  }

  if (!req.session.isVerified) {
  	res.redirect('/verify');
  	return;
  }

  var email = req.session.email;
	ddb.getItem('recommended', email, null, {}, function (err1, res1, cap1) {
		if (err1) {
			console.log('/jobs: Get Item');
			console.log(err1);
		} else {
			var value1 = JSON.parse(res1.value);
			ddb.getItem('interested', email, null, {}, function (err4, res4, cap4) {
				if (err4) {
					console.log('/jobs: Get Item (interested)');
					console.log(err4);
				} else {
					var value4 = JSON.parse(res4.value);
					var joblist = [];
					var getJobData = function (it, callback) {
						ddb.getItem('jobs', it, null, {}, function (err3, res3, cap3) {
							if (err3) {
								console.log('/jobs: Get Item 2');
								console.log(err3);
							} else {
								var value3 = JSON.parse(res3.value);
								if (value3.desc.length > 200) {
									value3.desc = value3.desc.substring(0,200) + "...";
								}
								joblist.push(value3);
								callback();
							}
						});
					};
					// residual = value1.rlist - value4.ilist
					// create object with values of ilist as keys
					idict = {};
					for (var k = 0; k < value4.ilist.length; k++) {
						idict[value4.ilist[k]] = 1;
					}
					// add to residual only if rlist value is not in idict
					residual = [];
					for (var k = 0; k < value1.rlist.length; k++) {
						var rval = value1.rlist[k];
						if (rval in idict) {
							continue;
						} else {
							residual.push(rval);
						}
					}
					async.each(residual, getJobData, function (err2) {
						if (err2) {
							console.log('/jobs: Async.each');
							console.log(err2);
						} else {
							var t = 'Jobs';
						  res.render('jobs', { 
						    title: t,
						    login: true,
						    signin: false,
						    signup: false,
						    joblist: joblist
						  });
						}
					});
				}
			});
		}
	});
});

app.get('/interested', function (req, res) {
  if (!req.session.login) {
    res.redirect('/');
    return;
  }

  if (!req.session.isVerified) {
  	res.redirect('/verify');
  	return;
  }

  var email = req.session.email;
	ddb.getItem('interested', email, null, {}, function (err1, res1, cap1) {
		if (err1) {
			console.log('/interested: Get Item');
			console.log(err1);
		} else {
			var value = JSON.parse(res1.value);
			var joblist = [];
			var getJobData = function (it, callback) {
				ddb.getItem('jobs', it, null, {}, function (err3, res3, cap3) {
					if (err3) {
						console.log('/interested: Get Item 2');
						console.log(err3);
					} else {
						var value3 = JSON.parse(res3.value);
						if (value3.desc.length > 500) {
							value3.desc = value3.desc.substring(0,500) + "...";
						}
						joblist.push(value3);
						callback();
					}
				});
			};
			async.each(value.ilist, getJobData, function (err2) {
				if (err2) {
					console.log('/interested: Async.each');
					console.log(err2);
				} else {
					var t = 'Interested';
				  res.render('interested', { 
				    title: t,
				    login: true,
				    signin: false,
				    signup: false,
				    joblist: joblist
				  });
				}
			});
		}
	});
});

app.post('/changeInterest', function (req, res) {
	var email = req.session.email;
	var jobId = parseInt(req.body.jobId);
	var isInterested = parseInt(req.body.isInterested);

	ddb.getItem('interested', email, null, {}, function (err1, res1, cap1) {
		if (err1) {
			console.log('/changeInterest: Get Item');
			console.log(err1);
			res.send({success: false});
		} else {
			var value1 = JSON.parse(res1.value);
			var ilist = [];
			for (var k = 0; k < value1.ilist.length; k++) {
				var currJobId = value1.ilist[k];
				if (jobId === currJobId) {
					continue;
				} else {
					ilist.push(currJobId);
				}
			}
			if (isInterested === 1) {
				ilist.push(jobId);
			}
			updVal = {
				ilist: ilist
			};
			ddb.updateItem('interested', email, null, {'value': {value: JSON.stringify(updVal)}}, {}, function (err2, res2, cap2) {
				if (err2) {
					console.log('/changeInterest: Update Item');
					console.log(err2);
					res.send({success: false});
				} else {
					res.send({success: true});
				}
			});
		}
	});
});

app.post('/recalculate', function (req, res) {
	var email = req.session.email;
	var options = {
	  mode: 'text',
	  args: [email]
	};
	 
	PythonShell.run('py/make_recco.py', options, function (err1, results) {
	  if (err1) {
	  	console.log('/recalculate: Python Shell');
			console.log(err1);
			res.send({success: false});
	  } else {
	  	res.send({success: true});
	  }
	});
});

/////////////////

var server = app.listen(8080, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('App listening at http://localhost:%s', port);
});