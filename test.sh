#!/bin/bash

set -e

echo "🛠️  Levantando contenedores..."
docker compose -f docker-compose-test.yml up -d

echo "⏳ Esperando que la base de datos esté lista en localhost:5433..."

RETRIES=30
until docker exec classconnect-education-tests pg_isready -h localhost -p 5432 -U postgres >/dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
  echo "Esperando base de datos... intentos restantes: $RETRIES"
  sleep 2
  RETRIES=$((RETRIES - 1))
done

if [ $RETRIES -eq 0 ]; then
  echo "❌ No se pudo conectar a la base de datos."
  exit 1
fi

echo "✅ Base de datos lista."

echo "⏳ Esperando que MongoDB esté listo en localhost:27017..."

RETRIES=30
until docker exec my-mongo mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
  echo "Esperando MongoDB... intentos restantes: $RETRIES"
  sleep 1
  RETRIES=$((RETRIES - 1))
done

if [ $RETRIES -eq 0 ]; then
  echo "❌ No se pudo conectar a MongoDB."
  exit 1
fi

echo "✅ MongoDB listo."

echo "📦 Cargando variables desde .env.test"
export $(grep -v '^#' .env.test | xargs)

echo "🧬 Ejecutando prisma migrate deploy..."
npx prisma migrate deploy

echo "🧪 Ejecutando tests..."
npx jest --runInBand #--testPathPattern=test/e2e/course
