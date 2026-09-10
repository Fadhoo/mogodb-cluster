FROM mongo:6.0.2

COPY mongodb-build/auth/mongodb-keyfile /data/mongodb-keyfile
COPY scripts/init-replica-set.js /scripts/init-replica-set.js
COPY scripts/init-replica-set.sh /scripts/init-replica-set.sh
RUN chmod 400 /data/mongodb-keyfile \
    && chown 999:999 /data/mongodb-keyfile \
    && chmod +x /scripts/init-replica-set.sh
