#!/bin/bash
echo "🚀 启动 HashKey Chain Facilitator..."
cd examples/typescript/servers/express
if [ ! -f .env ]; then
    cp .env-hashkey .env
fi
npm start
