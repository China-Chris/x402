#!/bin/bash

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 启动 x402 HashKey Chain 测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 清理端口
echo "🧹 清理端口 4021..."
lsof -ti:4021 | xargs kill -9 2>/dev/null || true
sleep 2

# 配置 Facilitator
echo "📝 配置 Facilitator..."
cd /Users/zhoumenghan/Documents/GitHub/x402/examples/typescript/servers/express
cat > .env << 'ENVEOF'
NETWORK=hashkey-testnet
FACILITATOR_URL=http://localhost:4021/facilitator
ADDRESS=0x319749f49C884a2F0141e53187dd1454E217786f
USDC_ADDRESS=0x7c2a7C56a4A873c0087FCfA3B1491C6e31211E15
RPC_URL=https://testnet.hsk.xyz
PRIVATE_KEY=0x8ad5b3c82c433bb80dda9510959e94a695b1ff5d8ae01da4fac55b05494aa0f5
ENVEOF

# 配置客户端
echo "📝 配置客户端..."
cd /Users/zhoumenghan/Documents/GitHub/x402/examples/typescript/clients/axios
cat > .env << 'ENVEOF'
NETWORK=hashkey-testnet
RESOURCE_SERVER_URL=http://localhost:4021
ENDPOINT_PATH=/weather
USDC_ADDRESS=0x7c2a7C56a4A873c0087FCfA3B1491C6e31211E15
RPC_URL=https://testnet.hsk.xyz
PRIVATE_KEY=0x8ad5b3c82c433bb80dda9510959e94a695b1ff5d8ae01da4fac55b05494aa0f5
ENVEOF

# 启动 Facilitator
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 启动 Facilitator (后台)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd /Users/zhoumenghan/Documents/GitHub/x402/examples/typescript/servers/express
npx tsx index-hashkey.ts > /tmp/facilitator-test.log 2>&1 &
FACILITATOR_PID=$!
echo "✅ Facilitator PID: $FACILITATOR_PID"

# 等待 Facilitator 启动
echo "⏳ 等待 Facilitator 启动..."
for i in {1..30}; do
    if curl -s http://localhost:4021/weather > /dev/null 2>&1; then
        echo "✅ Facilitator 已启动"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Facilitator 启动超时"
        echo "查看日志:"
        tail -20 /tmp/facilitator-test.log
        kill $FACILITATOR_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

sleep 2
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 运行客户端测试..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 运行客户端
cd /Users/zhoumenghan/Documents/GitHub/x402/examples/typescript/clients/axios
npx tsx test-hashkey.ts
TEST_RESULT=$?

# 停止 Facilitator
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🛑 停止 Facilitator..."
kill $FACILITATOR_PID 2>/dev/null || true
sleep 2

# 显示结果
echo ""
if [ $TEST_RESULT -eq 0 ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🎉 测试成功！"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📊 查看余额变化:"
    echo "   cd hashkey-deployment && npm run balance"
    echo ""
    echo "📄 查看 Facilitator 日志:"
    echo "   cat /tmp/facilitator-test.log"
else
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❌ 测试失败"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "查看 Facilitator 日志:"
    tail -50 /tmp/facilitator-test.log
fi
echo ""

exit $TEST_RESULT
