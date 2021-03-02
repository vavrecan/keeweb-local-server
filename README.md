# keeweb-local-server

This plugin adds support for simple storage on self hosted server.
Reading and writing is done through simple php script `server.php`. 

Users are prompt to enter access password for reading or writing to server storage (password can be set in php script). 
It should be easy to rewrite server-side storage script to other programming languages as well.

![Server file access prompt dialog](docs/prompt.png)

![Global settings to configure server file access](docs/settings.png)

## Installation
Following installation script requires wget and unzip. Simply run

`wget -O - https://raw.githubusercontent.com/vavrecan/keeweb-local-server/master/install.sh | bash`

then copy files to website root directory or test with local webserver 

`php -S localhost:8080`

## Server Configuration
Standard http server with PHP support should be enough and in the most of the cases you do not have to change anything. Server access password is transfered over Authorization header - make sure your configuration or proxy server allows this. If you are using php-cgi and apache, the Authorisation Header could be stripped - check [https://www.codepunker.com/blog/php-a-primer-on-the-basic-authorization-header](this article) for more details.

## Manual Installation
Download keeweb html version from [https://github.com/keeweb/keeweb/releases](https://github.com/keeweb/keeweb/releases), 
copy files from this repository and make changes to the `index.html` file

`<meta name="kw-config" content="(no-config)">`

to 

`<meta name="kw-config" content="config.json">`

Update read / write password in `server.php` and configure path to keepass databases.


## Optional Configuration

Changing path to server.php script file:
Plugin will always try to access server.php in website root directory. If you wish to change default script path, add localServerStorageScriptPath to config.json settings property, e.g.:

```
{
  "settings": {
    "canOpen": true,
    "canOpenDemo": false,
    "canOpenSettings": true,
    "canCreate": false,
    "canImportXml": false,
    "canRemoveLatest": true,

    "dropbox": false,
    "webdav": false,
    "gdrive": false,
    "onedrive": false,
    "localServerStorage": true,
    "localServerStorageScriptPath": "/subdirectory/server.php"
  },
  "plugins": [{
    "url": "plugins/local-server",
    "skipSignatureValidation": true
  }]
}
```

## Author
- [Marek Vavrecan](mailto:vavrecan@gmail.com)
- [Donate by PayPal](https://www.paypal.me/vavrecan)

## License
- [GNU General Public License, version 2](http://www.gnu.org/licenses/gpl-2.0.html)
