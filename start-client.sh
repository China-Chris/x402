#!/bin/bash
echo "🧪 启动 HashKey Chain 测试客户端..."
cd examples/typescript/clients/axios
if [ ! -f .env ]; then
    cp .env-hashkey .env
fi
npm start
