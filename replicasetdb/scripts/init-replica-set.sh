#!/bin/bash
set -e

MARKER="/data/db/.replicasetdb-initialized"

if [ -f "$MARKER" ]; then
  echo "Replica set has already been initialized."
  exit 0
fi

until mongosh --quiet --host 127.0.0.1 --eval "db.adminCommand({ ping: 1 }).ok" >/dev/null 2>&1; do
  sleep 1
done

mongosh --quiet --host 127.0.0.1 --file /scripts/init-replica-set.js
touch "$MARKER"
