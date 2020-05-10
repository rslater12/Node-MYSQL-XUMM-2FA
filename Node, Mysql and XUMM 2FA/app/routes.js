module.exports = function(app, passport) {
    var mysql = require('mysql');
    var dbconfig = require('./../config/database');
    var connection = mysql.createConnection(dbconfig.connection);
    var request = require("request");
    connection.query('USE 2FA')
	var Loginaddress;
	var destinationAddress;
	var signed;
	var UUID;
	var qr;
	var apikey = ''; //XUMM API
	var apisecret = ''; //XUMM API
    var bodyParser = require('body-parser');
    var urlencodedParser = bodyParser.urlencoded({ extended: false });
    app.use(bodyParser.json());
    var db = connection;

 app.get('/', function(req, res){
  res.render('index.ejs');
 });

app.get('/login', function(req, res, task){
	
	  res.render('login.ejs', {message:req.flash('loginMessage'), task: task});//
	 });

app.post('/login', passport.authenticate('local-login', {
	  successRedirect: '/verify',
	  failureRedirect: '/fail',
	  failureFlash: true
	 }),
	  function(req, res){
	   if(req.body.remember){
	    req.session.cookie.maxAge = 1000 * 60 * 3;
	   }else{
	    req.session.cookie.expires = false;
	   }
	   res.redirect('/profile');
	  });


app.get('/signup', function(req, res){
	  res.render('signup.ejs', {message: req.flash('Sign Up To .....')}); 
	 });

app.post('/signup', passport.authenticate('local-signup', {
	  successRedirect: '/new',
	  failureRedirect: '/signup',
	  failureFlash: true
	 }));

app.get('/profile', isLoggedIn, function(req, res){
	  res.render('profile.ejs', {user: req.user});
	 });

app.get('/new', function(req, res){
	    res.render('new.ejs');
	   });

app.get('/fail', function(req, res){
    res.render('fail.ejs');
   });

app.get('/verify', isLoggedIn, async function(req, res){
	 login()
	
    res.render('verify.ejs');
    
   });

//XUMM Auth Verifification Check
app.get('/authenticate', isLoggedIn, async function(req, res){
	
	authenticate()
    res.render('authenticate.ejs');
   });

app.get('/xummauth', isLoggedIn, async function(req, res){
	
	  if (Loginaddress == destinationAddress){
		  console.log("Authenticated Login Address and they are a Match: " + Loginaddress);
		  
		  res.redirect('/xummsuccess');
	  }
	  else if(Loginaddress != destinationAddress){
			 
 console.log("Login Address Dont Match: " + Loginaddress + " " + destinationAddress)
		  
		  res.redirect('/xummreject')  
		  }
   });

app.get('/xummsuccess', isLoggedIn, function(req, res){
	
    res.render('xummsuccess.ejs');
   });

app.get('/xummreject', isLoggedIn, function(req, res){
	
    res.render('xummreject.ejs');
   });

//XUMM Register
app.get('/xummcreatereg', function(req, res){
	register();
	
 res.render('xummreg.ejs');
});

app.get('/xummreg', function(req, res){
	
 res.render('xummreg.ejs');
});

app.get('/xummgetadd', function(req, res){
	registering();
	
 res.render('registeringaddress.ejs');
});

app.get('/registeringaddress', function(req, res){
	
 res.render('xummreject.ejs');
});

app.get('/xummregsuccess', function(req, res){
	
	function clear(){
		qr = null;
		UUID = null;
		Logginaddress = null;
		
		module.exports.qr = null;
		module.exports.UUID = null;
		module.exports.Logginaddress = null;
		
	}
	setTimeout(clear, 5000)
	
 res.render('xummregsuccess.ejs');
});

app.get('/checkAccount', function(req, res){
	
	     var uid = req.query.id;
	     console.log(uid)

	     var sql = "UPDATE users SET check_acc = '1' WHERE id = '" +uid+ "'";
	        connection.query(sql, function (err, result) {
	            if (err) throw err;
	            console.log(result.affectedRows + " record(s) updated");
	            res.redirect('/login');
	        });    
	     });

app.get('/logout', function(req,res){
	  req.logout();
	  res.render('index.ejs');
	 })
	

	function isLoggedIn(req, res, next){
	 if(req.isAuthenticated())
	  return next();

	 res.redirect('/login');// /home
	}


// xumm login
	function login(){
		
		var userAdd = db.query("SELECT useraddress FROM `users`", async function(err, result, fields, task) {
			  if (err) throw err;
			  if (result.length > 0) {
			        for (var i = 0; i < result.length; i++) {
			            
			  userAdd = result[i].useraddress;
			  
			    
			        }
	}
			//  var destinationAddress;
		 destinationAddress = userAdd;

		var jar = request.jar();
		
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
				     
					  },
				  "txjson": {
				    "TransactionType": "SignIn",
				    "Destination": destinationAddress, // DB Call required for destination address;
				    "Fee": "12"
				  }
				},
		  json: true,
		  jar: 'JAR'
		};

		request(options, function (error, response, body) {
		  if (error) throw new Error(error);
		  
		  UUID = body.uuid;
		  qr = body.refs.qr_png;
		  module.exports.payload = body.uuid;
		  module.exports.qr = body.refs.qr_png;
		
		  //console.log(body);
		  
		console.log('\x1b[34m%s\x1b[0m',"QRcode URL: " + qr);
		console.log('\x1b[34m%s\x1b[0m',"UUID: " + UUID);
		
		})
		
		});
	}

//Authenticate XUMM Login
	async function authenticate(){
		
		await UUID
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
				  if (error) throw new Error(error);

				var jsonBody = JSON.parse(body)
				signed = jsonBody.meta.resolved;
				Loginaddress = jsonBody.response.account;
				module.exports.signed = jsonBody.meta.resolved;
				module.exports.Logginaddress = jsonBody.response.account;

				});
	  
	}
	
	// xumm register
	async function register(){
		console.log("register")
		
		var jar = request.jar();
		
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
		  
		  UUID = body.uuid;
		  qr = body.refs.qr_png;
		  module.exports.UUID = body.uuid;
		  module.exports.qr = body.refs.qr_png;
		
		  //console.log(body);
		  
		console.log('\x1b[34m%s\x1b[0m',"QRcode URL: " + qr);
		console.log('\x1b[34m%s\x1b[0m',"UUID: " + UUID);
		
		
		});
	}

	async function registering(){
		
		await UUID
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
				  if (error) throw new Error(error);

				var jsonBody = JSON.parse(body)
				signed = jsonBody.meta.resolved;
				Loginaddress = jsonBody.response.account;
				module.exports.signed = jsonBody.meta.resolved;
				module.exports.Logginaddress = jsonBody.response.account;
			//	console.log("::::::::Loginaddress::::::: " + jsonBody); 
				
				var values = [ Loginaddress ];
																//WHERE id = ?
				db.query("UPDATE `users` SET `useraddress` = ? ", values,  function(err, result){

			        if(err) throw err;

			        console.log("1 record updated");
				
				})
				  
				});
	}
}