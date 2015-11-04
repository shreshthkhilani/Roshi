var express = require('express');
var routes = require ('./routes');
var http = require('http');
var path = require('path');
var app = express();
var engine = require('ejs-locals');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var async = require('async');
var multer  = require('multer');
var fs = require('fs');
var secret = "abc-123";

//app.use(multer({dest: './uploads/', includeEmptyFields: true}));
app.set('port', process.env.PORT || 8080);
app.engine('ejs', engine);
app.set('views', path.join( __dirname, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true }));
app.use(bodyParser.json());
app.use( express.static( path.join( __dirname, 'public' )));
app.use(express.static(__dirname + '/views/stylesheets'));
app.use(express.static(__dirname + '/views/images'));
app.use(express.static(__dirname + '/views/js'));

app.use(cookieParser());
app.use(session({
	secret: secret,
	login: false
}));

/////////////////

//var aws = require("./keyvaluestore.js");
routes.init(function() {
	app.get( '/', routes.index );		
});

http.createServer( app ).listen( app.get( 'port' ), function(){
	console.log( 'Open browser to http://localhost:' + app.get( 'port' ));
});
process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
});