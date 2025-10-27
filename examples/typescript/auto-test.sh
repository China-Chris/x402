#!/bin/bash

set -e

PROJECT_ROOT="/Users/zhoumenghan/Documents/GitHub/x402"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 自动启动并测试 x402 on HashKey Chain"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. 验证部署
echo "步骤 1/5: 验证部署..."
cd "$PROJECT_ROOT/hashkey-deployment"
USDC_ADDRESS=$(jq -r .contractAddress deployment.json)
echo "✅ USDC 合约: $USDC_ADDRESS"
echo ""

# 2. 准备 Facilitator 配置
echo "步骤 2/5: 准备 Facilitator..."
cd "$PROJECT_ROOT/examples/typescript/servers/express"
cat > .env << 'ENVEOF'
NETWORK=hashkey-testnet
FACILITATOR_URL=http://localhost:4021/facilitator
ADDRESS=0x319749f49C884a2F0141e53187dd1454E217786f
USDC_ADDRESS=0x7c2a7C56a4A873c0087FCfA3B1491C6e31211E15
RPC_URL=https://testnet.hsk.xyz
PRIVATE_KEY=0x8ad5b3c82c433bb80dda9510959e94a695b1ff5d8ae01da4fac55b05494aa0f5
ENVEOF
echo "✅ Facilitator 配置完成 (端口 4021)"
echo ""

# 3. 准备客户端配置
echo "步骤 3/5: 准备客户端..."
cd "$PROJECT_ROOT/examples/typescript/clients/axios"
cat > .env << 'ENVEOF'
NETWORK=hashkey-testnet
RESOURCE_SERVER_URL=http://localhost:4021
ENDPOINT_PATH=/weather
USDC_ADDRESS=0x7c2a7C56a4A873c0087FCfA3B1491C6e31211E15
RPC_URL=https://testnet.hsk.xyz
PRIVATE_KEY=0x8ad5b3c82c433bb80dda9510959e94a695b1ff5d8ae01da4fac55b05494aa0f5
ENVEOF
echo "✅ 客户端配置完成"
echo ""

# 4. 启动 Facilitator
echo "步骤 4/5: 启动 Facilitator..."
cd "$PROJECT_ROOT/examples/typescript/servers/express"
echo "📡 启动 Facilitator (后台运行, 端口 4021)..."
npx tsx index-hashkey.ts > /tmp/facilitator.log 2>&1 &
FACILITATOR_PID=$!
echo "✅ Facilitator PID: $FACILITATOR_PID"

# 等待 Facilitator 启动
echo "⏳ 等待 Facilitator 启动..."
for i in {1..20}; do
    if curl -s http://localhost:4021/weather > /dev/null 2>&1; then
        echo "✅ Facilitator 运行中 (http://localhost:4021)"
        break
    fi
    if [ $i -eq 20 ]; then
        echo "❌ Facilitator 启动超时，查看日志:"
        tail -30 /tmp/facilitator.log
        kill $FACILITATOR_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done
echo ""

# 5. 运行客户端测试
echo "步骤 5/5: 运行客户端测试..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd "$PROJECT_ROOT/examples/typescript/clients/axios"
npx tsx test-hashkey.ts
TEST_RESULT=$?

# 停止 Facilitator
echo ""
echo "🛑 停止 Facilitator..."
kill $FACILITATOR_PID 2>/dev/null || true
sleep 2

# 显示结果
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $TEST_RESULT -eq 0 ]; then
    echo "🎉 测试成功！"
    echo ""
    echo "查看余额变化:"
    echo "  cd hashkey-deployment && npm run balance"
    echo ""
    echo "查看 Facilitator 日志:"
    echo "  cat /tmp/facilitator.log"
    echo ""
    echo "查看交易:"
    echo "  https://testnet.hashkeyscan.io"
else
    echo "❌ 测试失败"
    echo ""
    echo "查看 Facilitator 日志:"
    echo "  cat /tmp/facilitator.log"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

exit $TEST_RESULT
