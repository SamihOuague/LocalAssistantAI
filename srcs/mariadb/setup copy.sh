#!/bin/bash
if [ ! -d "/var/lib/mysql/mysql" ]; then
    mariadb-install-db --user=mysql --datadir=/var/lib/mysql
fi

mysqld_safe &
pid="$!"

until mariadb -u root -e "SELECT 1" >/dev/null 2>&1; do
    sleep 1
done

DB_PASSWORD=$(cat /run/secrets/db_password)

mariadb -u root <<EOF
CREATE DATABASE IF NOT EXISTS ${DB_NAME};
ALTER USER IF EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASSWORD}';
CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASSWORD}'; 
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'%';
FLUSH PRIVILEGES;
EOF

wait $pid