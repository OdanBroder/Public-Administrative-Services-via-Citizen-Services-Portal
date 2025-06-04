#!/bin/bash
# Wait for MySQL to start fully
until mysqladmin ping -h localhost -u root -p"${MYSQL_ROOT_PASSWORD}" --silent; do
  sleep 1
done

# Check if users table is empty
USER_COUNT=$(mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "SELECT COUNT(*) FROM citizen_services.users;" | grep -v COUNT)
if [ "$USER_COUNT" -eq "0" ]; then
  echo "Seeding database..."
  mysql -u root -p"${MYSQL_ROOT_PASSWORD}" citizen_services < /docker-entrypoint-initdb.d/02-seed.sql
fi