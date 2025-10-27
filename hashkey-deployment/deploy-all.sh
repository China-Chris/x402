#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🚀 HashKey Chain - x402 一键部署${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查 .env 文件
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  未找到 .env 文件${NC}"
    echo ""
    read -p "请输入你的私钥 (0x...): " PRIVATE_KEY
    
    if [ -z "$PRIVATE_KEY" ]; then
        echo -e "${RED}❌ 私钥不能为空${NC}"
        exit 1
    fi
    
    echo "DEPLOYER_PRIVATE_KEY=$PRIVATE_KEY" > .env
    echo -e "${GREEN}✅ .env 文件已创建${NC}"
fi

# 检查 node_modules
if [ ! -d node_modules ]; then
    echo -e "${YELLOW}📦 安装依赖中...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 依赖安装失败${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ 依赖安装完成${NC}"
    echo ""
fi

# 检查余额
echo -e "${BLUE}💰 检查账户余额...${NC}"
npm run balance
echo ""

read -p "确认继续部署？(y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "部署已取消"
    exit 0
fi

# 部署合约
echo ""
echo -e "${BLUE}🚀 开始部署...${NC}"
npm run deploy

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 部署失败${NC}"
    exit 1
fi

# 提取合约地址
if [ -f deployment.json ]; then
    USDC_ADDRESS=$(node -p "require('./deployment.json').contractAddress")
    export USDC_ADDRESS
    echo ""
    echo -e "${GREEN}✅ 部署成功！${NC}"
    echo -e "${GREEN}📍 合约地址: $USDC_ADDRESS${NC}"
fi

# 询问是否测试
echo ""
read -p "是否运行测试？(y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🧪 运行测试...${NC}"
    npm run test
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 测试通过！${NC}"
    else
        echo -e "${RED}❌ 测试失败${NC}"
    fi
fi

# 询问是否铸造
echo ""
read -p "是否铸造测试代币？(y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🪙 铸造代币...${NC}"
    npm run mint
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 铸造成功！${NC}"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 完成！${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}📝 下一步:${NC}"
echo "1. 将合约地址添加到 x402 配置"
echo "2. 重新构建 x402 项目"
echo "3. 测试完整流程"
echo ""
echo -e "${BLUE}查看详细说明:${NC}"
echo "  cat ../HASHKEY_INTEGRATION_GUIDE.md"
echo ""


