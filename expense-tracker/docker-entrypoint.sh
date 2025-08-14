#!/bin/sh
set -e

echo "Starting ExpenseTracker Pro..."

# Wait for database to be ready
echo "Waiting for database connection..."
for i in $(seq 1 30); do
  if npx prisma db push --skip-generate >/dev/null 2>&1; then
    echo "Database is ready!"
    break
  fi
  echo "Database is unavailable - sleeping"
  sleep 2
done

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Seed database if needed
if [ "${SEED_DATABASE:-false}" = "true" ]; then
  echo "Seeding database..."
  npx prisma db seed
fi

# Start the application
echo "Starting Next.js server..."
exec node server.js