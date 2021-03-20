var express = require('express');
var router = express.Router();
var con = require('./../lib/con.js'); // Require Data Base

var request = require("request");

//const path = require('path')
const app = express ();
//let dotenv = require('dotenv');
//const cors = require('cors')
var bcrypt = require('bcrypt-nodejs');
var mysql = require('mysql');
//var connection = con;
var passport = require('passport');
const flash = require('connect-flash') //removed from functions
var session = require('express-session');
var LocalStrategy = require("passport-local").Strategy;
const nodemailer = require('nodemailer');
var W3CWebSocket = require('websocket').w3cwebsocket;
var url = 'wss://xumm.app/sign/' // + payload UUID;
con.query('USE 2FA');

var apikey = ""
var apisecret= ""

var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: true });
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());
  const publicIp = require('public-ip');
let IP;
(async () => {
    //console.log(await publicIp.v4());
    IP = await publicIp.v4();
    })();

    
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/profile', isLoggedIn, function(req, res){
  res.render('profile.ejs', {user: req.user});
 });

/* GET login page. */
router.get('/login', function(req, res, task){
	
  res.render('login.ejs', {message:req.flash('loginMessage'), task: task});//
  });
  
   /* post login page. */
  router.post('/login', passport.authenticate('local-login', {
    successRedirect: '/verify',
    failureRedirect: '/fail',
    failureFlash: true
  }),
    function(req, res){
     if(req.body.remember){
      req.session.cookie.maxAge = 1000 * 60 * 60;
     }else{
      req.session.cookie.expires = false;
     }
     res.redirect('/profile');
  });
  
  //xumm 2FA
  router.get('/verify', isLoggedIn, async function(req, res){
  
  res.render('verify.ejs', {});
  });
  
  router.get('/authenticate', isLoggedIn, async function(req, res){
   
	var w_id  = req.user.id;
	var cookie = req.cookies.io
	socketID = cookie
	
		var Useraddress = con.query("SELECT useraddress FROM `users` WHERE `id` = ?", w_id, async function(err, result, fields, task) {
			if (err) {
				console.log("DataBase Error Authenticate")
			   };
			if (result.length > 0) {
				  for (var i = 0; i < result.length; i++) {
					Useraddress = result[i].useraddress;
				  }
	}
		var options = {
			method: 'POST',
			url: 'https://xumm.app/api/v1/platform/payload',
			headers: {
			  'content-type': 'application/json',
			  'x-api-key': apikey,
			  'x-api-secret': apisecret,
			  authorization: 'Bearer' + apisecret
			},
			body: {
				"options": {
					  "submit": true,
					  "expire": 5,
					  "return_url": {
						  "web": "", 
						  "app": ""
							  }    
						},
					"txjson": {
					  "TransactionType": "SignIn",
					  "Destination": "", 
					  "Fee": "12"
					}
				  },
			json: true,
			jar: 'JAR'
		  };
		  request(options, function (error, response, body) {
			if (error) {
				console.log("Theres a bug in my xumm function")
				console.log("xumm Error")
			   };
			UUID = body.uuid;
			Web = body.websocket_status;
			qr = body.refs.qr_png;
			next = body.next.always
			const io = req.app.locals.io
			io.to(socketID).emit('QR', qr)
			console.log('\x1b[34m%s\x1b[0m',"UUID: " + UUID);
			console.log('\x1b[34m%s\x1b[0m',"WebSocket ID: " + Web);
			
			  /* Start WebSocket Connection */
			var client = new W3CWebSocket('wss://xumm.app/sign/'+UUID, 'echo-protocol');
			client.onopen = function() {
           console.log('WebSocket Client Connected');
    
            function sendNumber() {
            if (client.readyState === client.OPEN) {
                var number = Math.round(Math.random() * 0xFFFFFF);
                client.send(number.toString());
                setTimeout(sendNumber, 1000);
					}
				}
				sendNumber();
			};

    		client.onmessage = function(message) {
			if (typeof message.data === 'string') {
						
			var msg = JSON.parse(message.data);
			if (msg.message !== "Right back at you!" ){
			console.log("Payload Welcome : "+msg.message )
			console.log("Payload "+msg.message + " : User ID - " + req.user.id)
			console.log('\x1b[31m%s\x1b[0m',"Payload Expires in : "+msg.expires_in_seconds)
			}
			if (msg.opened === true){
			console.log("Payload Opened : "+msg.opened)
			}
			//console.log("Payload API Fetched : "+msg.devapp_fetched)
			else if (msg.signed === true){
			console.log("Payload Resolved : "+msg.signed) 
			/*Authenticate XUMM Login*/
			var data = String(UUID);
			var options = {
					method: 'GET',
					url: 'https://xumm.app/api/v1/platform/payload/' + data,
					headers: {
							'x-api-key': apikey,
							'x-api-secret': apisecret,
							'content-type': 'application/json'
						},
						};
					request(options, function (error, response, body) {
						if (error) {
							console.log("Theres a bug in my xumm function")
							console.log("xumm Error")
						   };
					var jsonBody = JSON.parse(body)
					var Loginaddress = jsonBody.response.account;
					console.log("::::::::Loginaddress::::::: " + Loginaddress); 
					console.log("::::::::Useraddress:::::(:: " + Useraddress); 
					
					if(Loginaddress === Useraddress){
						client.close()
						console.log('echo-protocol Client Closed');
							console.log("Redirect User to Profile Page")
							return res.redirect('/profile')
					}
					else if(Loginaddress !== Useraddress){
					  console.log("Redirect User to fail Page")
					  errorLogger.error("2FA sign in Attempt Failed, Redirect User to login Page")
					  console.log('echo-protocol Client Closed');
					 
					  client.close()
					  return res.render('xummreject.ejs')
					}
					});
			}
			else if (msg.expires_in_seconds < 0){
				client.close()
				console.log("Payload Expired : "+msg.expired)
				console.log("Log User out of con and return to login page")
				res.redirect('/logout')
				console.log('echo-protocol Client Closed');
			
				}
		}
    };

    client.onerror = function() {
        console.log('Connection Error');
    };
    
			});
});
  });
  
  
  /*XUMM reject*/
  router.get('/xummreject', isLoggedIn, function(req, res){
    
  res.render('xummreject.ejs');
  });
  
  /*XUMM Register*/
  router.get('/xummreg', isLoggedIn, function(req, res){
    
  res.render('xummreg.ejs');
  });
  
  
  router.get('/xummcreatereg', isLoggedIn, function(req, res){
    var cookie = req.cookies.io
		socketID = cookie
	var options = {
		method: 'POST',
		url: 'https://xumm.app/api/v1/platform/payload',
		headers: {
		  'content-type': 'application/json',
		  'x-api-key': apikey,
		  'x-api-secret': apisecret,
		  authorization: 'Bearer' + apisecret
		},
		body: {
			"options": {
				  "submit": true,
				  "expire": 5,
				  "return_url": {
					  "web": "",
					  "app": ""
						  }    
					},
				"txjson": {
				  "TransactionType": "SignIn",
				  "Fee": "12"
				}
			  },
		json: true,
		jar: 'JAR'
	  };
	  request(options, async function (error, response, body) {
		if (error) throw new Error(error);
		var UUID = body.uuid;
		qr = body.refs.qr_png;
		const io = req.app.locals.io;

		io.to(socketID).emit('address', qr);
	  console.log('\x1b[34m%s\x1b[0m',"QRcode URL: " + qr);
	  console.log('\x1b[34m%s\x1b[0m',"UUID: " + UUID);
	   /* Start WebSocket Coonnection */
	    /* Start WebSocket Connection */
		var client = new W3CWebSocket('wss://xumm.app/sign/'+UUID, 'echo-protocol');
		client.onopen = function() {
	   console.log('WebSocket Client Connected');

		function sendNumber() {
		if (client.readyState === client.OPEN) {
			var number = Math.round(Math.random() * 0xFFFFFF);
			client.send(number.toString());
			setTimeout(sendNumber, 1000);
				}
			}
			sendNumber();
		};

    client.onmessage = function(message) {
			if (typeof message.data === 'string') {
			var msg = JSON.parse(message.data);
			if (msg.message !== "Right back at you!" ){
				console.log("Payload Welcome : "+msg.message )
				console.log("Payload "+msg.message + " : User ID - ")
				console.log('\x1b[31m%s\x1b[0m',"Payload Expires in : "+msg.expires_in_seconds)
				}
				if (msg.opened === true){
				console.log("Payload Opened : "+msg.opened)
				}
				//console.log("Payload API Fetched : "+msg.devapp_fetched)
				else if (msg.signed === true){
				console.log("Payload Resolved : "+msg.signed) 
				/*Authenticate XUMM Login*/
				var data = String(UUID);
				var options = {
						method: 'GET',
						url: 'https://xumm.app/api/v1/platform/payload/' + data,
						headers: {
								'x-api-key': apikey,
								'x-api-secret': apisecret,
								'content-type': 'application/json'
							},
							};
						request(options, function (error, response, body) {
							if (error) {
								console.log("Theres a bug in my xumm function")
								console.log("xumm Error")
							   };
						var jsonBody = JSON.parse(body)
						Registeraddress = jsonBody.response.account;
						signed = jsonBody.meta.resolved;
						console.log("::::::::Registeraddress::::::: " + Registeraddress); 
						var values = [ Registeraddress ];
						w_id = req.user.id;										
						con.query("UPDATE `users` SET `useraddress` = '"+values+"' WHERE `id` = ?", w_id, function(err, result){

							if (err) {
								console.log("DataBase Error Profile")
							   };
                 console.log("1 Useraddress registered & recorded & updated to DB");
						
						})  
						if(signed === true){
							client.close()
							res.redirect('/profile')
						}
						});
				}
				else if (msg.expires_in_seconds < 0){
					client.close()
					console.log("Payload Expired : "+msg.expired)
					console.log("Log User out of con and return to login page")
					res.redirect('/logout')
					console.log('echo-protocol Client Closed');
				
					}
			}
		};
	
		client.onerror = function() {
			console.log('Connection Error');
		};
		
				});
      });
  
  
  
   /* xumm register success */
  router.get('/xummregsuccess', function(req, res){
    
  res.render('xummregsuccess.ejs');
  });
  
  /* Check Account */
  router.get('/checkAccount', function(req, res){
    
    var uid = req.query.id;
    console.log(uid)
  
    var sql = "UPDATE users SET check_acc = '1' WHERE id = '" +uid+ "'";
       con.query(sql, function (err, result) {
         if (err) throw err;
         console.log(result.affectedRows + " record(s) updated");
         res.redirect('/login');
       });    
    });
  
  /* Logout */
  router.get('/logout', function(req,res){
   req.logout();
   res.render('index.ejs');
  })
  
  function isLoggedIn(req, res, next){
  if(req.isAuthenticated())
   return next();
  
  res.redirect('/login');
  }
  
  /* Register */
  router.get('/register', function(req, res){
    res.render('register.ejs', {message: req.flash('Sign Up')}); 
     });
  
  router.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/new',
    failureRedirect: '/register',
    failureFlash: true
     }));
  
  router.get('/new', function(req, res){
      res.render('new.ejs');
     });
  
  router.get('/fail', function(req, res){
  res.render('fail.ejs');
  });

  /* My SQL Login code */
  main();
  
  async function main() {
     var dois = await funcaoDois();
     return  dois;
     }
     
     async function funcaoDois() {
     await sleep(500);
     
    passport.serializeUser(function(user, done){
     done(null, user.id);
    });
  
    passport.deserializeUser(function(id, done){
     con.query("SELECT * FROM users WHERE id = ? ", [id],
      function(err, rows){
       done(err, rows[0]);
      });
    });
  
    passport.use(
      'local-signup',
      new LocalStrategy({
       usernameField : 'username',
       passwordField: 'password',
       passReqToCallback: true
      },
       
      function(req, username, password, done, useraddress){
       con.query("SELECT * FROM users WHERE username = ? ", 
       [username], function(err, rows){
        if(err)
         return done(err);
        if(rows.length){
         return done(null, false, req.flash('signupMessage', 'Sorry this is already taken!'));
        }else{
         var newUserMysql = {
        username: username,
        password: bcrypt.hashSync(password, null, null)
        //  useraddress: req.body.useraddress
         
         };
  
         var sql = "INSERT INTO users (username, password) VALUES ('"+newUserMysql.username+"', '"+newUserMysql.password+"')";
         con.query(sql, function (err, result) {
        if (err) throw err;
  
        newUserMysql.id = result.insertId;
        console.log('\x1b[32m%s\x1b[0m',result.insertId);
        
      const transport = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // use SSL
        auth: {
          user: '', // add credentials
          pass: '' // add credentials 
        }
      });
  
 
      var message = {
  
      // sender info
      from: '', //change
  
  
      to: newUserMysql.username,
  
      // Subject of the message
      subject: 'Validate Your Account', //'Nodemailer is unicode friendly ✔', 
  
      // HTML body
        html:'<p><UUID>Hello</UUID> '+ newUserMysql.username +' ! </p>'+
        '<p>Click <a href="https://' + IP + ':3000/checkAccount?id='+result.insertId+'"> here </a> to check your Account</p>'
      };
  
      console.log('Sending Mail');
      transport.sendMail(message, function(error){
      if(error){
      console.log('Error occured');
      console.log(error.message);
      return;
      }
      console.log('Message sent successfully!');
  
      });
  
      return done(null, newUserMysql);
      });
      }
     });
    })
     );
  
     passport.use(
    'local-login',
    new LocalStrategy({
     usernameField : 'username',
     passwordField: 'password',
     passReqToCallback: true
    },
    function(req, username, password, done){
     con.query("SELECT * FROM users WHERE username = ? ", [username],
     function(err, rows){
      if(err)
       return done(err);
      if(!rows.length){
       return done(null, false, req.flash('loginMessage', 'No User Found'));
      }
      if(rows[0].check_acc == 0){
      return done(null, false, req.flash('loginMessage', 'Please check your email to validate your Account!'));
      }
      if(!bcrypt.compareSync(password, rows[0].password))
       return done(null, false, req.flash('loginMessage', 'Wrong Password'));
  
      return done(null, rows[0]);
     });
    })
     );
     }
     function sleep(ms = 0) {
    return new Promise(r => setTimeout(r, ms));
    }

module.exports = router;
