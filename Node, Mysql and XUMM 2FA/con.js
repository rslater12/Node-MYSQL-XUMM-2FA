var mysql = require('mysql');
var fs = require('fs');
var config = require('./../DBdata.json'); // get data base credentials


var con = mysql.createConnection({
 host: config.host,
 user: config.user,
 password: config.password,
 port: config.port,
 multipleStatements: true,
 _socket: "/var/run/mysqld/mysqld.sock"
}); 

con.connect(function(err) {
  if(err){
    console.log('\x1b[34m%s\x1b[0m',"SET DBdata.json Credentials");	
    }else{
  
  console.log('\x1b[31m%s\x1b[0m', "Connected!");
  con.query("CREATE DATABASE IF NOT EXISTS 2FA", function (err, result) {
    if (err) throw err;
    con.query('USE 2FA', function(err){
           if(err) throw err;

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

                con.query(sql, function (err, result){
                  if(err) throw err;
                  console.log('\x1b[32m%s\x1b[0m',"Table users to 2FA login is created")
                })
	})
	})
}
});
module.exports = con;