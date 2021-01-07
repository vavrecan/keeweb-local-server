#!/bin/bash

VERSION=1.16.7
mkdir keeweb-local-server
cd keeweb-local-server || exit

wget https://github.com/keeweb/keeweb/releases/download/v${VERSION}/KeeWeb-${VERSION}.html.zip
if [ $? -ne 0 ]; then
  echo "Failed to download keeweb"
  exit
fi

unzip KeeWeb-${VERSION}.html.zip

wget https://github.com/vavrecan/keeweb-local-server/archive/master.zip
if [ $? -ne 0 ]; then
  echo "Failed to download keeweb-local-server"
  exit
fi

unzip master.zip

mv keeweb-local-server-master/plugins .
mv keeweb-local-server-master/databases .
mv keeweb-local-server-master/server.php .
mv keeweb-local-server-master/config.json .
rm -r keeweb-local-server-master

sed -i 's/content="(no-config)"/content="config.json"/' index.html

unlink KeeWeb-${VERSION}.html.zip
unlink master.zip
