# Login using mysql and nodejs
Simple login app using node, passaport and mysql followed by an attempt at 2FA using XUMM and an XRPL Address;

Install:

cd Node_and_MYSQL_login

npm install

** NOTE **
 Edit the /config/database.js using your settings to connect on you mysql.
 
  'host':'localhost',
  'user':'root',
  'password':''

npm start

Open your browser and go to localhost:3000

may need to open port 3000 on the router to allow verification email through or change the email path.

Please have your xumm app open when loggin in and the address entered at signup is the same as the account on XUMM.

