#!/bin/bash

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 x402 HashKey Chain 完整测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 清理端口
echo "🧹 清理端口..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:4021 | xargs kill -9 2>/dev/null || true
sleep 2

# 配置 Facilitator (端口 3000)
echo "📝 配置 Facilitator (端口 3000)..."
cd /Users/zhoumenghan/Documents/GitHub/x402/examples/typescript/facilitator
cat > .env << 'ENVEOF'
NETWORK=hashkey-testnet
PRIVATE_KEY=0x8ad5b3c82c433bb80dda9510959e94a695b1ff5d8ae01da4fac55b05494aa0f5
RPC_URL=https://testnet.hsk.xyz
PORT=3000
ENVEOF

# 配置资源服务器 (端口 4021)
echo "📝 配置资源服务器 (端口 4021)..."
cd /Users/zhoumenghan/Documents/GitHub/x402/examples/typescript/servers/express
cat > .env << 'ENVEOF'
NETWORK=hashkey-testnet
FACILITATOR_URL=http://localhost:3000
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
echo "🏦 启动 Facilitator (端口 3000)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd /Users/zhoumenghan/Documents/GitHub/x402/examples/typescript/facilitator
npx tsx index-hashkey.ts > /tmp/facilitator-full.log 2>&1 &
FACILITATOR_PID=$!
echo "✅ Facilitator PID: $FACILITATOR_PID"

# 等待 Facilitator 启动
echo "⏳ 等待 Facilitator 启动..."
for i in {1..30}; do
    if curl -s http://localhost:3000/supported > /dev/null 2>&1; then
        echo "✅ Facilitator 已启动"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Facilitator 启动超时"
        tail -20 /tmp/facilitator-full.log
        kill $FACILITATOR_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

sleep 2

# 启动资源服务器
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 启动资源服务器 (端口 4021)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd /Users/zhoumenghan/Documents/GitHub/x402/examples/typescript/servers/express
npx tsx index-hashkey.ts > /tmp/resource-server.log 2>&1 &
RESOURCE_PID=$!
echo "✅ 资源服务器 PID: $RESOURCE_PID"

# 等待资源服务器启动
echo "⏳ 等待资源服务器启动..."
for i in {1..30}; do
    if curl -s http://localhost:4021/weather > /dev/null 2>&1; then
        echo "✅ 资源服务器已启动"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ 资源服务器启动超时"
        tail -20 /tmp/resource-server.log
        kill $FACILITATOR_PID $RESOURCE_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

sleep 2

# 运行客户端测试
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 运行客户端测试..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
cd /Users/zhoumenghan/Documents/GitHub/x402/examples/typescript/clients/axios
npx tsx test-hashkey.ts
TEST_RESULT=$?

# 停止服务
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🛑 停止服务..."
kill $FACILITATOR_PID $RESOURCE_PID 2>/dev/null || true
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
    echo "📄 查看日志:"
    echo "   Facilitator: cat /tmp/facilitator-full.log"
    echo "   资源服务器: cat /tmp/resource-server.log"
else
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❌ 测试失败"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Facilitator 日志:"
    tail -30 /tmp/facilitator-full.log
    echo ""
    echo "资源服务器日志:"
    tail -30 /tmp/resource-server.log
fi
echo ""

exit $TEST_RESULT
