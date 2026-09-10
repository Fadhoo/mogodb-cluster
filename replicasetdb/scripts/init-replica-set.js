const result = rs.initiate({
  _id: "rs-replicasetdb",
  members: [
    { _id: 0, host: "mongo1:27017", priority: 2 },
    { _id: 1, host: "mongo2:27017", priority: 1 },
    { _id: 2, host: "mongo3:27017", priority: 1 }
  ]
});

printjson(result);

const deadline = Date.now() + 60000;
while (!db.hello().isWritablePrimary && Date.now() < deadline) {
  sleep(1000);
}

if (!db.hello().isWritablePrimary) {
  printjson(rs.status());
  throw new Error("Timed out waiting for this member to become writable primary.");
}

db.getSiblingDB("admin").createUser({
  user: "replica_admin",
  pwd: "replica_password",
  roles: [{ role: "root", db: "admin" }]
});

print("Replica set initialized and admin user created.");
