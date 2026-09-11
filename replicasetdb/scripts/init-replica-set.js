const result = rs.initiate({
  _id: "rs-replicasetdb",
  members: [
    { _id: 0, host: "rs-mongo1:27217", priority: 2 },
    { _id: 1, host: "rs-mongo2:27218", priority: 1 },
    { _id: 2, host: "rs-mongo3:27219", priority: 1 }
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
  user: "twoo_admin",
  pwd: "replicRviKJ297n242QFS3W",
  roles: [{ role: "root", db: "admin" }]
});

print("Replica set initialized and admin user created.");
