var createError = require('http-errors');
var express = require('express');
var session = require('express-session');
var path = require('path');
var cookieParser = require('cookie-parser');
var index = require('./routes/index');
var users = require('./routes/users');
var bodyParser = require('body-parser');
var morgan = require('morgan');
const favicon = require('express-favicon');

var app = express();

//socket io

const server = require('http').Server(app);
const io = require('socket.io')(server);
app.io = io;
app.locals.io = io

io.on('connection', function (socket) {
	console.log("Socket.IO Connected")
   
}) 


//login
var passport = require('passport');
const flash = require('connect-flash');		

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan('dev'));
app.use(session({
  secret: 'justasecret',
  resave:true,
  saveUninitialized: true
 }));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
