#!/data/user/0/ai.antigem/files/usr/bin/bash
# Keeps the local Postgres instance for KIBAOFFICIAL alive.
# The dev host is memory-constrained and the OOM killer occasionally takes
# the postmaster down; this loop brings it back (WAL recovery is automatic).
PGDATA=/data/user/0/ai.antigem/files/home/.pgdata
SOCKDIR=/data/user/0/ai.antigem/files/usr/tmp
LOG=/data/user/0/ai.antigem/files/usr/tmp/opencode/pg-watchdog.log
while true; do
  if ! pg_isready -h 127.0.0.1 -p 5432 >/dev/null 2>&1; then
    echo "$(date -Is) postgres down -> restarting" >> "$LOG"
    pg_ctl -D "$PGDATA" -l /data/user/0/ai.antigem/files/usr/tmp/opencode/pg-restart.log \
      -o "-p 5432 -k $SOCKDIR" -w start >/dev/null 2>&1
  fi
  sleep 10
done
