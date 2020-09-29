#!/bin/bash

mkdir keeweb-local-server
cd keeweb-local-server

wget https://github.com/keeweb/keeweb/releases/download/v1.15.7/KeeWeb-1.15.7.html.zip
unzip KeeWeb-1.15.7.html.zip

wget https://github.com/vavrecan/keeweb-local-server/archive/master.zip
unzip master.zip

sed -i 's/content="(no-config)"/content="config.json"/' index.html

unlink KeeWeb-1.15.7.html.zip
unlink master.zip
