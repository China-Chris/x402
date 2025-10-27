#!/bin/bash

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 HashKey Chain x402 快速启动"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查部署状态
if [ ! -f "hashkey-deployment/deployment.json" ]; then
    echo "❌ 未找到部署信息，请先运行部署："
    echo "   cd hashkey-deployment && npm run deploy"
    exit 1
fi

USDC_ADDRESS=$(jq -r .contractAddress hashkey-deployment/deployment.json)
echo "✅ 检测到 USDC 合约: $USDC_ADDRESS"
echo ""

# 选择 Facilitator 类型
echo "请选择 Facilitator 类型:"
echo "  1) TypeScript Express"
echo "  2) TypeScript Hono"
echo "  3) Python FastAPI"
echo ""
read -p "选择 (1-3): " facilitator_choice

case $facilitator_choice in
    1)
        echo "启动 TypeScript Express Facilitator..."
        cd examples/typescript/servers/express
        npm install 2>/dev/null || true
        NETWORK=hashkey-testnet USDC_ADDRESS=$USDC_ADDRESS npm start
        ;;
    2)
        echo "启动 TypeScript Hono Facilitator..."
        cd examples/typescript/servers/hono
        npm install 2>/dev/null || true
        NETWORK=hashkey-testnet USDC_ADDRESS=$USDC_ADDRESS npm start
        ;;
    3)
        echo "启动 Python FastAPI Facilitator..."
        cd python/x402
        uv run examples/facilitator.py
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac
