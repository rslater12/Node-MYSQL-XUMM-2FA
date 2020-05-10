var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var app = express();
var port = process.env.PORT || 5000;
var path = require('path')


var passport = require('passport');
var flash = require('connect-flash');

const server = app.listen(port);
console.log("Port: " + port);

var io = require('socket.io')(server);

var get = require('./app/routes.js');
let b;
let qr;
let web;
let Loginaddress = get.Loginaddress;
let signed;

io.on('connection', function (socket) {
	console.log("Socket.IO Connected")

		// send the QR code to the login page on succesfuly login, login function in index.js
		
		async function QR(){
			qr = get.qr;
			await qr
		 socket.emit('QR', qr);
		//console.log('\x1b[34m%s\x1b[0m',"QRCode Sent: " + qr)

	}
		setInterval(QR, 1000)
		
		// send the websocket address to client side
		
		async function Web(){
		web = get.web;
		await web;
	 socket.emit('web', web);
	//console.log('\x1b[35m%s\x1b[0m',"Web Socket Sent: " + web)
	}
		setInterval(Web, 1000)

		//	 registered address
		async function Ladd(){
			
			var z = Loginaddress;
			await z;
			//console.log("Iv got the address now: " + z)
			socket.emit('address', z);
		}
		
		setInterval(Ladd, 1000)
		// xumm response
		// Signed
		async function sig(){
			signed = get.signed;
			await signed;
			
			//console.log('\x1b[34m%s\x1b[0m',"Authentication Signed: " + signed)
			socket.emit('auth', signed);
		}
		
		setInterval(sig, 1000)
	})

require('./config/passport')(passport);
app.use(express.static(path.join(__dirname, 'public')));
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



