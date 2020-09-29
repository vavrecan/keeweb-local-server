#!/bin/bash

mkdir keeweb-local-server
cd keeweb-local-server || exit

wget https://github.com/keeweb/keeweb/releases/download/v1.15.7/KeeWeb-1.15.7.html.zip
if [ $? -ne 0 ]; then
  echo "Failed to download keeweb"
  exit
fi

unzip KeeWeb-1.15.7.html.zip

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

unlink KeeWeb-1.15.7.html.zip
unlink master.zip
