#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 HashKey Chain x402 快速测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. 验证部署
echo "步骤 1/3: 验证合约部署..."
cd hashkey-deployment
npm run balance --silent
echo ""

# 2. 检查配置
echo "步骤 2/3: 检查配置..."
USDC_ADDRESS=$(jq -r .contractAddress deployment.json)
echo "✅ USDC 地址: $USDC_ADDRESS"
echo "✅ 网络: HashKey Testnet (Chain ID: 133)"
echo ""

# 3. 测试提示
echo "步骤 3/3: 准备运行测试"
echo ""
echo "请打开 2 个新终端窗口："
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 终端 1 - 启动 Facilitator:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "cd examples/typescript/servers/express"
echo "npm install"
echo "NETWORK=hashkey-testnet npm start"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 终端 2 - 运行客户端测试:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "cd examples/typescript/clients/axios"
echo "npm install"
echo "NETWORK=hashkey-testnet npm start"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 提示: 如果看到 ✅ 支付成功，说明测试通过！"
echo ""
