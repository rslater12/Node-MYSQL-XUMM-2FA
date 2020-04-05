var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var app = express();
var port = process.env.PORT || 3000;
app.io()

var passport = require('passport');
var flash = require('connect-flash');

const server = app.listen(port);
console.log("Port: " + port);

var io = require('socket.io')(server);



var get = require('./app/routes.js');
let qr;

io.on('connection', function (socket) {
	console.log("Socket.IO Connected")

	async function QR(){
			qr = index.qr;
			await qr
		 socket.emit('QR', qr);
		console.log('\x1b[34m%s\x1b[0m',"QRCode Sent: " + qr)
	
	}
		setInterval(QR, 1000)
		

	
	}

require('./config/passport')(passport);

app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({
 extended: true
}));

app.set('view engine', 'ejs');

app.use(session({
 secret: 'justasecret',
 resave:true,
 saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

require('./app/routes.js')(app, passport);



