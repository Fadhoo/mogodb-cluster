# MongoDB Replica Set with Keyfile Authentication

This folder is a small, dedicated replica set setup extracted from the larger sharded cluster examples in the repository. It runs three MongoDB 6.0.2 nodes with keyfile authentication enabled.

## Components

- `mongo1`, `mongo2`, `mongo3`: a three-member replica set named `rs-replicasetdb`
- Shared keyfile copied into each MongoDB image at `/data/mongodb-keyfile`
- Admin user created during first-time initialization:
  - Username: `replica_admin`
  - Password: `replica_password`

## Start

From this folder:

```bash
docker compose up -d --build
```

Initialize the replica set and create the admin user:

```bash
docker compose logs -f mongo-init
```

The `mongo-init` one-shot container initializes the replica set and creates the admin user automatically on first startup. Watch the logs until you see `Replica set initialized and admin user created.`

## Connect From Docker

From another Docker container on the same Compose network:

```text
mongodb://replica_admin:replica_password@mongo1:27017,mongo2:27017,mongo3:27017/admin?replicaSet=rs-replicasetdb&authSource=admin
```

You can also open an authenticated shell inside the primary container:

```bash
docker compose exec mongo1 mongosh -u replica_admin -p replica_password --authenticationDatabase admin
```

## Connect From Host

The replica set advertises Docker service names (`mongo1`, `mongo2`, `mongo3`) so containers can find each other correctly. Host tools that are not on the Docker network cannot usually resolve that topology.

For a local host tool such as MongoDB Compass, connect directly to the primary:

```text
mongodb://replica_admin:replica_password@127.0.0.1:27217/admin?authSource=admin&directConnection=true
```

If your application also runs in Docker, prefer the full replica set URI:

```text
mongodb://replica_admin:replica_password@mongo1:27017,mongo2:27017,mongo3:27017/admin?replicaSet=rs-replicasetdb&authSource=admin
```

## Verify

Check replica set status:

```bash
docker compose exec mongo1 mongosh -u replica_admin -p replica_password --authenticationDatabase admin --eval "rs.status()"
```

Check which node is primary:

```bash
docker compose exec mongo1 mongosh -u replica_admin -p replica_password --authenticationDatabase admin --eval "db.hello().primary"
```

## Reset

Stop and remove the containers and volumes:

```bash
docker compose down -v --remove-orphans
```

Then start again.

## Keyfile

The included keyfile is suitable for local development. For a non-demo environment, replace `mongodb-build/auth/mongodb-keyfile` with a newly generated secret:

```bash
openssl rand -base64 756 > mongodb-keyfile
```

The Dockerfile applies the required ownership and `400` permission inside the image, which avoids Windows bind-mount permission issues.
