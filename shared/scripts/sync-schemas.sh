#!/bin/bash

# Get the directory of this script (shared/scripts/)
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WORKSPACE_DIR="$(cd "$DIR/../.." && pwd)"

echo "Synchronizing Prisma schemas..."

# Ensure target directories exist
mkdir -p "$WORKSPACE_DIR/backend-store/prisma"
mkdir -p "$WORKSPACE_DIR/backend-admin/prisma"

# Copy schema.prisma
cp "$WORKSPACE_DIR/shared/prisma/schema.prisma" "$WORKSPACE_DIR/backend-store/prisma/schema.prisma"
cp "$WORKSPACE_DIR/shared/prisma/schema.prisma" "$WORKSPACE_DIR/backend-admin/prisma/schema.prisma"

echo "Prisma schema copied to both backends."

# Check if npm dependencies exist in the backends before generating client
if [ -d "$WORKSPACE_DIR/backend-store/node_modules" ]; then
  echo "Generating Prisma client for backend-store..."
  cd "$WORKSPACE_DIR/backend-store" && npx prisma generate
fi

if [ -d "$WORKSPACE_DIR/backend-admin/node_modules" ]; then
  echo "Generating Prisma client for backend-admin..."
  cd "$WORKSPACE_DIR/backend-admin" && npx prisma generate
fi

echo "Prisma schema sync complete!"
