2FA Login using mysql, nodejs using XUMM/XRPL for 2FA Signin
Simple login page using node, passport, mysql and XUMM.

Install:

git clone https://github.com/......

cd to folder location

npm install

** NOTE ** Edit the /config/database.js using your settings to connect on you mysql.

'host':'localhost', 'user':'root', 'password':''

Edit the Nodemailer Settings

passport.js auth: { user: '', pass: '' }

app/routes.js

Xumm Developer API secret and Key required.

npm start

Open your browser and go to localhost: 5000

Requires you to have the XUMM app and an XRP Address.

Register, then sign the XUMM QR code, confirm your email address. // emails needs to be confirmed on the same LAN unless settings are changed.

Then after confirming email address, attempt to login, there is only a 20 second window to sign the Xumm requests before the QR code page redirects to the authentication page.

If the page redirects before the QR code is scanned then this login attempt will fail and it should redirect back to start the login procedure.
