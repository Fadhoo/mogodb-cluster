# MongoDB Replica Set with Keyfile Authentication

This folder is a small, dedicated replica set setup extracted from the larger sharded cluster examples in the repository. It runs three MongoDB 6.0.2 nodes with keyfile authentication enabled.

## Components

- `mongo1`, `mongo2`, `mongo3`: a three-member replica set named `rs-replicasetdb`
- Shared keyfile copied into each MongoDB image at `/data/mongodb-keyfile`
- Admin user created during first-time initialization:
  - Username: `twoo_admin`
  - Password: `replicRviKJ297n242QFS3W`

## Start

From this folder:

```bash
docker compose up -d --build
```

The replica set and admin user are initialized automatically by the `mongo-init` one-shot container. Watch its logs:

```bash
docker compose logs -f mongo-init
```

Wait until you see:

```text
Replica set initialized and admin user created.
```

## How Initialization Works

`docker compose up -d --build` starts four containers:

- `mongo1`, `mongo2`, `mongo3`: the MongoDB replica set members
- `mongo-init`: a temporary setup container that exits after initialization

The important detail is that `mongo-init` uses:

```yaml
network_mode: "service:mongo1"
```

That makes `mongo-init` share `mongo1`'s network namespace, so `127.0.0.1:27017` from inside `mongo-init` is the same MongoDB server running in `mongo1`. This lets the setup script use MongoDB's first-start localhost exception to create the first admin user while keyfile auth is already enabled.

The flow is:

1. `mongo-init` runs `/scripts/init-replica-set.sh`.
2. `init-replica-set.sh` waits until `mongo1` responds to `ping`.
3. It runs `/scripts/init-replica-set.js` through `mongosh`.
4. `init-replica-set.js` calls `rs.initiate(...)` with:

```javascript
{
  _id: "rs-replicasetdb",
  members: [
    { _id: 0, host: "rs-mongo1:27217", priority: 2 },
    { _id: 1, host: "rs-mongo2:27218", priority: 1 },
    { _id: 2, host: "rs-mongo3:27219", priority: 1 }
  ]
}
```

5. The script waits until `mongo1` becomes writable primary.
6. It creates the root admin user:

```javascript
db.getSiblingDB("admin").createUser({
  user: "twoo_admin",
  pwd: "replicRviKJ297n242QFS3W",
  roles: [{ role: "root", db: "admin" }]
});
```

7. `init-replica-set.sh` writes `/data/db/.replicasetdb-initialized` so future restarts do not recreate the replica set or admin user.

## Connect From Host

On Linux, add the replica set host aliases to `/etc/hosts` before connecting from the host machine:

```bash
sudo sh -c 'printf "\n127.0.0.1 rs-mongo1 rs-mongo2 rs-mongo3\n" >> /etc/hosts'
```

From a local app running on your host machine:

```text
mongodb://twoo_admin:replicRviKJ297n242QFS3W@rs-mongo1:27217,rs-mongo2:27218,rs-mongo3:27219/admin?replicaSet=rs-replicasetdb&authSource=admin
```

For an application `.env` file:

```env
MONGODB_URL=mongodb://twoo_admin:replicRviKJ297n242QFS3W@rs-mongo1:27217,rs-mongo2:27218,rs-mongo3:27219/admin?replicaSet=rs-replicasetdb&authSource=admin
```

Do not use `directConnection=true` for apps that require replica set support. The replica set advertises `rs-mongo1:27217`, `rs-mongo2:27218`, and `rs-mongo3:27219`, so clients can discover all three members.

## Connect From Docker

From another Docker container, use the same advertised replica set URI. The container must be able to resolve `rs-mongo1`, `rs-mongo2`, and `rs-mongo3`. Add the same `extra_hosts` entries used by this Compose file if the app runs in a separate Compose project.

```text
mongodb://twoo_admin:replicRviKJ297n242QFS3W@rs-mongo1:27217,rs-mongo2:27218,rs-mongo3:27219/admin?replicaSet=rs-replicasetdb&authSource=admin
```

You can also open an authenticated shell inside the primary container:

```bash
docker compose exec mongo1 mongosh -u twoo_admin -p replicRviKJ297n242QFS3W --authenticationDatabase admin
```

## Verify

Check replica set status:

```bash
docker compose exec mongo1 mongosh -u twoo_admin -p replicRviKJ297n242QFS3W --authenticationDatabase admin --eval "rs.status()"
```

Check which node is primary:

```bash
docker compose exec mongo1 mongosh -u twoo_admin -p replicRviKJ297n242QFS3W --authenticationDatabase admin --eval "db.hello().primary"
```

## Reset

Stop and remove the containers and volumes:

```bash
docker compose down -v --remove-orphans
```

Then start again.

Use reset after changing the replica set member hosts, replica set name, admin username, or admin password. Those values are written during first initialization and will not be recreated while the Docker volumes still exist.

## Keyfile

The included keyfile is suitable for local development. For a non-demo environment, replace `mongodb-build/auth/mongodb-keyfile` with a newly generated secret:

```bash
openssl rand -base64 756 > mongodb-keyfile
```

The Dockerfile applies the required ownership and `400` permission inside the image, which avoids Windows bind-mount permission issues.
