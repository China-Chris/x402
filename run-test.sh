#!/bin/bash

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 开始 x402 HashKey Chain 自动化测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. 验证部署
echo "步骤 1/4: 验证部署状态..."
cd hashkey-deployment
BALANCE_OUTPUT=$(npm run balance --silent 2>&1)
if echo "$BALANCE_OUTPUT" | grep -q "USDC"; then
    echo "✅ 合约部署正常"
else
    echo "❌ 合约部署验证失败"
    exit 1
fi
cd ..
echo ""

# 2. 准备 Facilitator
echo "步骤 2/4: 准备 Facilitator..."
cd examples/typescript/servers/express

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install > /dev/null 2>&1
fi

# 复制配置文件
cp .env-hashkey .env
echo "✅ Facilitator 配置完成"
cd ../../..
echo ""

# 3. 准备客户端
echo "步骤 3/4: 准备客户端..."
cd examples/typescript/clients/axios

if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install > /dev/null 2>&1
fi

cp .env-hashkey .env
echo "✅ 客户端配置完成"
cd ../../..
echo ""

# 4. 显示测试命令
echo "步骤 4/4: 准备就绪！"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 请按以下步骤运行测试："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣  在当前终端启动 Facilitator:"
echo "   cd examples/typescript/servers/express"
echo "   npm start"
echo ""
echo "2️⃣  打开新终端，运行客户端测试:"
echo "   cd examples/typescript/clients/axios"
echo "   npm start"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 如果想直接启动 Facilitator，运行:"
echo "   ./start-facilitator.sh"
echo ""
