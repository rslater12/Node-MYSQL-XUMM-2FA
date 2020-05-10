'use strict';
var LocalStrategy = require("passport-local").Strategy;

var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');
var dbconfig = require('./database');
var connection = mysql.createConnection(dbconfig.connection);
const nodemailer = require('nodemailer');

module.exports = function(passport) {

  main();

  async function main() {
  var um = await funcaoUm();
  var dois = await funcaoDois();
  return um, dois;
  }
  async function funcaoUm() {
  connection.connect(function(err) {
    if(err){
      console.log('\x1b[31m%s\x1b[0m',"######  -->> Edit database on config folder <<-- #####");	
      }else{
        connection.query("CREATE DATABASE IF NOT EXISTS 2FA", function (err, result) {
          if (err) throw err;
          connection.query('USE 2FA', function(err){
                if(err) throw err;
                console.log('\x1b[32m%s\x1b[0m',"The 2FA data base was created and the connection done")

                var sql = "CREATE TABLE IF NOT EXISTS `users` (";
                sql +="`id` int(11) NOT NULL AUTO_INCREMENT,";
                sql +=" `username` varchar(100) COLLATE utf8_unicode_ci NOT NULL,";
                sql +=" `password` varchar(255) COLLATE utf8_unicode_ci NOT NULL,";
                sql +=" `useraddress` varchar(255) COLLATE utf8_unicode_ci NULL,";
                sql +=" `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,";
                sql +=" `modified` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,";
                sql +="`check_acc` INT(1) NOT NULL DEFAULT '0',";
                sql +=" PRIMARY KEY (`id`)";
                sql +=")";

                connection.query(sql, function (err, result){
                  if(err) throw err;
                  console.log('\x1b[32m%s\x1b[0m',"Table users to 2FA login is created")
                })
          })
        })
      }
  })
}
async function funcaoDois() {
  await sleep(500);
connection.query('USE 2FA');

 passport.serializeUser(function(user, done){
  done(null, user.id);
 });

 passport.deserializeUser(function(id, done){
  connection.query("SELECT * FROM users WHERE id = ? ", [id],
   function(err, rows){
    done(err, rows[0]);
   });
 });

 passport.use(
		  'local-signup',
		  new LocalStrategy({
		   usernameField : 'username',
		   passwordField: 'password',
		   useraddressField: 'useraddress',
		   passReqToCallback: true
		  },
		   
		  function(req, username, password, done, useraddress){
		   connection.query("SELECT * FROM users WHERE username = ? ", 
		   [username], function(err, rows){
		    if(err)
		     return done(err);
		    if(rows.length){
		     return done(null, false, req.flash('signupMessage', 'That is already taken'));
		    }else{
		     var newUserMysql = {
		      username: username,
		      password: bcrypt.hashSync(password, null, null),
		      useraddress: req.body.useraddress
		     
		     };


		     var sql = "INSERT INTO users (username, password, useraddress) VALUES ('"+newUserMysql.username+"', '"+newUserMysql.password+"', '" +newUserMysql.useraddress+"')";
		     connection.query(sql, function (err, result) {
		      if (err) throw err;

		      newUserMysql.id = result.insertId;
		      console.log('\x1b[32m%s\x1b[0m',result.insertId);
		      
		      
	   // Create a SMTP transport object
	      const transport = nodemailer.createTransport({
	        host: 'smtp.gmail.com',
	        port: 587,
	        secure: false, // use SSL
	        auth: {
	        	user: '',
	            pass: ''
	        }
	    });

	    // Message object
	      var message = {

	      // sender info
	      from: 'example@gmail.com',

	      // Comma separated list of recipients
	      to: newUserMysql.username,

	      // Subject of the message
	      subject: 'Validate Your Account', //'Nodemailer is unicode friendly ✔', 

	      // plaintext body
	      //text: req.query.text //'Hello to myself!',

	      // HTML body
	        html:'<p><b>Hello</b> '+ newUserMysql.username +' ! </p>'+
	        '<p>Click <a href="http://localhost:5000/checkAccount?id='+result.insertId+'"> here </a> to Authroise your Account</p>'
	      };

	      console.log('Sending Mail');
	      transport.sendMail(message, function(error){
	      if(error){
	      console.log('Error occured');
	      console.log(error.message);
	      return;
	      }
	      console.log('Message sent successfully!');

	      // if you don't want to use this transport object anymore, uncomment    
	      //transport.close(); // close the connection pool
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
	   connection.query("SELECT * FROM users WHERE username = ? ", [username],
	   function(err, rows){
	    if(err)
	     return done(err);
	    if(!rows.length){
	     return done(null, false, req.flash('loginMessage', 'No User Found'));
	    }
	    if(rows[0].check_acc == 0){
	      return done(null, false, req.flash('loginMessage', 'Please check your email to validate your account!'));
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
};
