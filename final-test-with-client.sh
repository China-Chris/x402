#!/bin/bash

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 x402 HashKey Chain 完整测试 (多账户)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "👥 测试账户:"
echo "   📍 客户端 (付款人): 0x5f5239252E295bD0b03643a5911D8da4b2f6C9f8"
echo "   📍 资源服务器 (收款人): 0x319749f49C884a2F0141e53187dd1454E217786f"
echo "   📍 Facilitator (提交者): 0x319749f49C884a2F0141e53187dd1454E217786f"
echo ""

# 清理端口
echo "🧹 清理端口..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:4021 | xargs kill -9 2>/dev/null || true
sleep 2

# 配置 Facilitator
echo "📝 配置 Facilitator..."
cd /Users/zhoumenghan/Documents/GitHub/x402/examples/typescript/facilitator
cat > .env << 'ENVEOF'
NETWORK=hashkey-testnet
PRIVATE_KEY=0x8ad5b3c82c433bb80dda9510959e94a695b1ff5d8ae01da4fac55b05494aa0f5
EVM_PRIVATE_KEY=0x8ad5b3c82c433bb80dda9510959e94a695b1ff5d8ae01da4fac55b05494aa0f5
PORT=3000
ENVEOF

# 配置资源服务器
echo "📝 配置资源服务器..."
cd /Users/zhoumenghan/Documents/GitHub/x402/examples/typescript/servers/express
cat > .env << 'ENVEOF'
NETWORK=hashkey-testnet
FACILITATOR_URL=http://localhost:3000
ADDRESS=0x319749f49C884a2F0141e53187dd1454E217786f
USDC_ADDRESS=0x7c2a7C56a4A873c0087FCfA3B1491C6e31211E15
ENVEOF

# 配置客户端
echo "📝 配置客户端..."
cd /Users/zhoumenghan/Documents/GitHub/x402/examples/typescript/clients/axios
cat > .env << 'ENVEOF'
NETWORK=hashkey-testnet
RESOURCE_SERVER_URL=http://localhost:4021
ENDPOINT_PATH=/weather
PRIVATE_KEY=0x517197a0cd7d51ade08b4c79476071b6c5f885f5fa6a80d7515416fab3acbbdf
ENVEOF

# 启动 Facilitator
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏦 启动 Facilitator..."
cd /Users/zhoumenghan/Documents/GitHub/x402/examples/typescript/facilitator
npx tsx index-hashkey.ts > /tmp/fac-final.log 2>&1 &
FAC_PID=$!

echo "⏳ 等待 Facilitator..."
for i in {1..30}; do
    if curl -s http://localhost:3000/supported > /dev/null 2>&1; then
        echo "✅ Facilitator 已启动"
        break
    fi
    [ $i -eq 30 ] && echo "❌ 超时" && kill $FAC_PID 2>/dev/null && exit 1
    sleep 1
done

sleep 2

# 启动资源服务器
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 启动资源服务器..."
cd /Users/zhoumenghan/Documents/GitHub/x402/examples/typescript/servers/express
npx tsx index-hashkey.ts > /tmp/res-final.log 2>&1 &
RES_PID=$!

echo "⏳ 等待资源服务器..."
for i in {1..30}; do
    if curl -s http://localhost:4021/weather > /dev/null 2>&1; then
        echo "✅ 资源服务器已启动"
        break
    fi
    [ $i -eq 30 ] && echo "❌ 超时" && kill $FAC_PID $RES_PID 2>/dev/null && exit 1
    sleep 1
done

sleep 2

# 运行测试
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 运行测试..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
cd /Users/zhoumenghan/Documents/GitHub/x402/examples/typescript/clients/axios
npx tsx test-hashkey.ts
RESULT=$?

echo ""
echo "🛑 停止服务..."
kill $FAC_PID $RES_PID 2>/dev/null || true

if [ $RESULT -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🎉🎉🎉 测试成功！🎉🎉🎉"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo ""
    echo "❌ 测试失败"
    echo "Facilitator 日志:" && tail -20 /tmp/fac-final.log
    echo "资源服务器日志:" && tail -20 /tmp/res-final.log
fi

exit $RESULT
