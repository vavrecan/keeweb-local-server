# keeweb-local-server

This plugin adds support for simple storage on same self hosted server.
Reading and writing is done through simple php script `server.php`. 

User is then asked for password to access server files (which can also be changed in php script). 
It should be easy to rewrite server-side storage script to other programming languages as well.

<a href="https://ibb.co/iYXLWb"><img src="https://thumb.ibb.co/iYXLWb/Screenshot_from_2017_12_30_23_35_26.png" alt="Screenshot_from_2017_12_30_23_35_26" border="0"></a> <a href="https://ibb.co/hPHvEw"><img src="https://thumb.ibb.co/hPHvEw/Screenshot_from_2017_12_30_21_07_37.png" alt="Screenshot_from_2017_12_30_21_07_37" border="0"></a> <a href="https://ibb.co/jTWcSG"><img src="https://thumb.ibb.co/jTWcSG/Screenshot_from_2017_12_30_21_07_53.png" alt="Screenshot_from_2017_12_30_21_07_53" border="0"></a>

## Installation
Download keeweb, place it to the same directory and override in index.html

`<meta name="kw-config" content="(no-config)">`

to 

`<meta name="kw-config" content="config.json">`

Update read / write password in `server.php` and configure path to keepass databases.

## Authors
- [Marek Vavrecan](mailto:vavrecan@gmail.com)
- [Donate](https://www.paypal.me/vavrecan)

## License
- [GNU General Public License, version 2](http://www.gnu.org/licenses/gpl-2.0.html)
