# x402 快速接入部署指南

> 🚀 **5 分钟接入，1 行代码接受数字美元支付**

## 📋 目录

- [5 分钟快速开始](#5-分钟快速开始)
- [完整部署指南](#完整部署指南)
- [快捷命令](#快捷命令)
- [部署架构选择](#部署架构选择)
- [生产环境部署](#生产环境部署)
- [故障排查](#故障排查)

---

## 🚀 5 分钟快速开始

### 最简单的方式（使用公共 Facilitator）

```bash
# 1. 克隆项目
git clone https://github.com/coinbase/x402.git
cd x402/examples/typescript

# 2. 安装依赖
pnpm install
pnpm build

# 3. 部署服务器（只需要收款地址，不需要私钥）
cd servers/express
echo "ADDRESS=0xYourWalletAddress" > .env
echo "FACILITATOR_URL=https://x402-facilitator.coinbase.com" >> .env
echo "NETWORK=base-sepolia" >> .env
pnpm dev
# ✅ 服务器启动在 http://localhost:4021

# 4. 测试客户端（新终端，需要有 USDC 的私钥）
cd ../../clients/axios
echo "PRIVATE_KEY=0xYourPrivateKey" > .env
echo "RESOURCE_SERVER_URL=http://localhost:4021" >> .env
echo "ENDPOINT_PATH=/weather" >> .env
pnpm dev
# 🎉 支付成功，收到数据！
```

**就这么简单！** 您已经运行了一个接受加密货币支付的 API 服务器！

---

## 🎯 部署架构选择

### 选项 A：简单模式 ⭐ **推荐新手**

**只部署 1 个组件：资源服务器**

```
┌─────────────┐         ┌─────────────────┐
│   客户端     │ ←────→  │  您的资源服务器  │
│             │         │   (只需收款地址) │
└─────────────┘         └────────┬────────┘
                                 │
                                 ↓
                        ┌─────────────────┐
                        │ 公共 Facilitator │ (Coinbase 提供)
                        └────────┬────────┘
                                 │
                                 ↓
                        ┌─────────────────┐
                        │    区块链        │
                        └─────────────────┘
```

✅ **优点**：
- 5 分钟部署
- 只需要 1 个收款地址
- 无需管理私钥
- 无需支付 gas

❌ **缺点**：
- 依赖第三方
- 可能有服务费

---

### 选项 B：完全自主 🏢 **推荐生产**

**部署 2 个组件：资源服务器 + Facilitator**

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   客户端     │ ←→ │  您的资源服务器  │ ←→ │ 您的 Facilitator │
│             │    │   (收款地址)     │    │   (需要私钥)     │
└─────────────┘    └─────────────────┘    └────────┬────────┘
                                                    │
                                                    ↓
                                           ┌─────────────────┐
                                           │    区块链        │
                                           └─────────────────┘
```

✅ **优点**：
- 完全控制
- 零服务费
- 可自定义

❌ **缺点**：
- 需要管理 2 个服务
- Facilitator 需要 ETH/gas
- 需要保护私钥

---

## 📦 完整部署指南

### 步骤 1：准备工作

#### 1.1 安装必要软件

```bash
# 安装 Node.js (v24+)
node --version  # 检查版本

# 安装 pnpm
npm install -g pnpm

# 克隆项目
git clone https://github.com/coinbase/x402.git
cd x402
```

#### 1.2 准备钱包地址

您需要 **3 个钱包地址**（根据部署模式）：

| 地址类型 | 需要私钥？ | 需要资金？ | 用途 |
|---------|----------|-----------|------|
| **商户地址** | ❌ 不需要 | ❌ 不需要 | 接收 USDC 支付 |
| **Facilitator 地址** | ✅ 需要 | ✅ 需要 ETH/gas | 提交交易（仅选项 B） |
| **客户端地址** | ✅ 需要 | ✅ 需要 USDC | 支付测试 |

**生成新钱包（测试用）**：

```bash
# 方法 1: 使用 Cast (Foundry)
curl -L https://foundry.paradigm.xyz | bash
cast wallet new

# 方法 2: 使用 Node.js
node -e "console.log(require('ethers').Wallet.createRandom().privateKey)"
```

#### 1.3 获取测试代币

**Base Sepolia 测试网**（推荐）：

```bash
# 1. 获取测试 ETH
# 访问: https://www.alchemy.com/faucets/base-sepolia
# 粘贴您的地址

# 2. 获取测试 USDC
# USDC 地址: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
# 从其他账户转账或使用 Circle faucet
```

**HashKey Chain 测试网**：

```bash
# 获取测试 HSK
# 访问: https://testnet.hsk.xyz/faucet

# USDC 地址: 0x7c2a7C56a4A873c0087FCfA3B1491C6e31211E15
```

---

### 步骤 2：部署模式 A（简单模式）

#### 2.1 安装和构建

```bash
cd x402/examples/typescript
pnpm install
pnpm build
```

#### 2.2 配置资源服务器

```bash
cd servers/express

# 创建 .env 文件
cat > .env << 'EOF'
# 您的收款地址（不需要私钥）
ADDRESS=0xYourMerchantAddress

# 使用公共 Facilitator
FACILITATOR_URL=https://x402-facilitator.coinbase.com

# 选择网络
NETWORK=base-sepolia

# 服务器端口
PORT=4021
EOF
```

#### 2.3 启动服务器

```bash
pnpm dev

# 看到这个输出就成功了：
# ✅ 服务器运行在 http://localhost:4021
# 💰 收款地址: 0xYour...
# 🌐 网络: base-sepolia
```

#### 2.4 测试客户端

```bash
# 新开一个终端
cd x402/examples/typescript/clients/axios

# 创建 .env 文件
cat > .env << 'EOF'
# 客户端私钥（需要有 USDC）
PRIVATE_KEY=0xYourClientPrivateKey

# 资源服务器地址
RESOURCE_SERVER_URL=http://localhost:4021

# 要访问的端点
ENDPOINT_PATH=/weather
EOF

# 运行测试
pnpm dev
```

**成功输出示例**：

```
💳 客户端地址: 0x5f52...C9f8
🌐 使用网络: base-sepolia

🔄 发起请求: GET http://localhost:4021/weather
💰 需要支付: $0.01 USDC
🔐 创建签名...
📤 提交支付...
✅ 支付成功！

📦 收到数据:
{
  "city": "San Francisco",
  "temperature": "72°F",
  "condition": "Sunny"
}

🔗 交易哈希: 0xabc123...
```

**🎉 完成！您已经成功运行了 x402 支付系统！**

---

### 步骤 3：部署模式 B（完全自主）

#### 3.1 部署 Facilitator

```bash
cd x402/examples/typescript/facilitator

# 创建 .env 文件
cat > .env << 'EOF'
# Facilitator 私钥（需要有 ETH 支付 gas）
EVM_PRIVATE_KEY=0xYourFacilitatorPrivateKey

# 支持的网络（逗号分隔）
SUPPORTED_NETWORKS=base-sepolia,hashkey-testnet

# 端口
PORT=3000
EOF

# 启动 Facilitator
pnpm dev

# 输出：
# ✅ Facilitator 运行在 http://localhost:3000/facilitator
# 💰 地址: 0xYour...
# 🌐 支持网络: base-sepolia, hashkey-testnet
```

#### 3.2 部署资源服务器

```bash
# 新终端
cd x402/examples/typescript/servers/express

# 创建 .env 文件
cat > .env << 'EOF'
# 您的收款地址
ADDRESS=0xYourMerchantAddress

# 使用您自己的 Facilitator
FACILITATOR_URL=http://localhost:3000/facilitator

# 网络
NETWORK=base-sepolia

# 端口
PORT=4021
EOF

# 启动服务器
pnpm dev
```

#### 3.3 测试客户端

```bash
# 新终端
cd x402/examples/typescript/clients/axios

# 创建 .env（同上）
cat > .env << 'EOF'
PRIVATE_KEY=0xYourClientPrivateKey
RESOURCE_SERVER_URL=http://localhost:4021
ENDPOINT_PATH=/weather
EOF

# 运行测试
pnpm dev
```

---

## ⚡ 快捷命令

### 一键部署脚本

创建 `deploy-x402.sh`:

```bash
#!/bin/bash

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   x402 一键部署脚本${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 检查是否在正确的目录
if [ ! -d "examples/typescript" ]; then
    echo -e "${RED}❌ 请在 x402 项目根目录运行此脚本${NC}"
    exit 1
fi

# 1. 安装依赖
echo -e "\n${GREEN}📦 步骤 1/4: 安装依赖...${NC}"
cd examples/typescript
pnpm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 依赖安装失败${NC}"
    exit 1
fi

# 2. 构建项目
echo -e "\n${GREEN}🔨 步骤 2/4: 构建项目...${NC}"
pnpm build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 构建失败${NC}"
    exit 1
fi

# 3. 配置环境变量
echo -e "\n${GREEN}⚙️  步骤 3/4: 配置环境变量...${NC}"

# 读取用户输入
read -p "请输入商户地址 (收款地址): " MERCHANT_ADDRESS
read -p "是否部署自己的 Facilitator? (y/n): " DEPLOY_FACILITATOR

if [ "$DEPLOY_FACILITATOR" = "y" ]; then
    read -sp "请输入 Facilitator 私钥 (需要 ETH/gas): " FACILITATOR_KEY
    echo
    FACILITATOR_URL="http://localhost:3000/facilitator"
else
    FACILITATOR_URL="https://x402-facilitator.coinbase.com"
fi

read -p "选择网络 (base-sepolia/hashkey-testnet): " NETWORK

# 配置服务器
echo -e "\n${GREEN}📝 配置资源服务器...${NC}"
cat > servers/express/.env << EOF
ADDRESS=$MERCHANT_ADDRESS
FACILITATOR_URL=$FACILITATOR_URL
NETWORK=$NETWORK
PORT=4021
EOF

# 如果部署 Facilitator
if [ "$DEPLOY_FACILITATOR" = "y" ]; then
    echo -e "\n${GREEN}📝 配置 Facilitator...${NC}"
    cat > facilitator/.env << EOF
EVM_PRIVATE_KEY=$FACILITATOR_KEY
SUPPORTED_NETWORKS=$NETWORK
PORT=3000
EOF
fi

# 4. 创建启动脚本
echo -e "\n${GREEN}📝 步骤 4/4: 创建启动脚本...${NC}"

# 启动脚本
if [ "$DEPLOY_FACILITATOR" = "y" ]; then
    cat > start-x402.sh << 'SCRIPT'
#!/bin/bash
echo "🚀 启动 x402 系统..."

# 启动 Facilitator
cd facilitator
pnpm dev &
FACILITATOR_PID=$!
echo "✅ Facilitator 已启动 (PID: $FACILITATOR_PID)"

# 等待 Facilitator 启动
sleep 3

# 启动资源服务器
cd ../servers/express
pnpm dev &
SERVER_PID=$!
echo "✅ 资源服务器已启动 (PID: $SERVER_PID)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ x402 系统启动完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Facilitator: http://localhost:3000/facilitator"
echo "资源服务器: http://localhost:4021"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 等待中断
trap "kill $FACILITATOR_PID $SERVER_PID; exit" INT
wait
SCRIPT
else
    cat > start-x402.sh << 'SCRIPT'
#!/bin/bash
echo "🚀 启动 x402 资源服务器..."

cd servers/express
pnpm dev &
SERVER_PID=$!

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 资源服务器启动完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "资源服务器: http://localhost:4021"
echo "Facilitator: $FACILITATOR_URL"
echo ""
echo "按 Ctrl+C 停止服务"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

trap "kill $SERVER_PID; exit" INT
wait
SCRIPT
fi

chmod +x start-x402.sh

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ 部署完成！${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "\n运行以下命令启动服务："
echo -e "${BLUE}./start-x402.sh${NC}"
echo -e "\n测试客户端:"
echo -e "${BLUE}cd clients/axios && pnpm dev${NC}"
echo ""
```

**使用方法**：

```bash
# 1. 创建脚本
cd x402
cat > deploy-x402.sh << 'EOF'
# (粘贴上面的脚本内容)
EOF

# 2. 添加执行权限
chmod +x deploy-x402.sh

# 3. 运行部署
./deploy-x402.sh

# 4. 启动服务
cd examples/typescript
./start-x402.sh
```

---

### 常用快捷命令

创建 `Makefile`:

```makefile
.PHONY: install build start-server start-facilitator test clean

# 安装依赖
install:
	cd examples/typescript && pnpm install

# 构建项目
build:
	cd examples/typescript && pnpm build

# 启动资源服务器
start-server:
	cd examples/typescript/servers/express && pnpm dev

# 启动 Facilitator
start-facilitator:
	cd examples/typescript/facilitator && pnpm dev

# 运行测试客户端
test:
	cd examples/typescript/clients/axios && pnpm dev

# 清理
clean:
	cd examples/typescript && rm -rf node_modules */node_modules */*/node_modules

# 完整部署（简单模式）
deploy-simple: install build
	@echo "✅ 简单模式部署完成！"
	@echo "配置 servers/express/.env 后运行: make start-server"

# 完整部署（完全模式）
deploy-full: install build
	@echo "✅ 完全模式部署完成！"
	@echo "配置 facilitator/.env 和 servers/express/.env"
	@echo "运行: make start-facilitator (终端1)"
	@echo "运行: make start-server (终端2)"

# 查看服务状态
status:
	@echo "检查服务状态..."
	@curl -s http://localhost:4021/health || echo "❌ 资源服务器未运行"
	@curl -s http://localhost:3000/facilitator/supported || echo "ℹ️ Facilitator 未运行（可能使用公共服务）"

# 查看日志
logs:
	@echo "=== 资源服务器日志 ==="
	@tail -f examples/typescript/servers/express/logs/*.log 2>/dev/null || echo "无日志文件"
```

**使用方法**：

```bash
# 快速部署
make deploy-simple

# 启动服务
make start-server

# 测试
make test

# 查看状态
make status
```

---

### Docker 一键部署

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # Facilitator (可选)
  facilitator:
    build:
      context: ./examples/typescript/facilitator
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - EVM_PRIVATE_KEY=${FACILITATOR_PRIVATE_KEY}
      - SUPPORTED_NETWORKS=${NETWORKS}
      - PORT=3000
    restart: unless-stopped

  # 资源服务器
  resource-server:
    build:
      context: ./examples/typescript/servers/express
      dockerfile: Dockerfile
    ports:
      - "4021:4021"
    environment:
      - ADDRESS=${MERCHANT_ADDRESS}
      - FACILITATOR_URL=${FACILITATOR_URL:-http://facilitator:3000/facilitator}
      - NETWORK=${NETWORK}
      - PORT=4021
    depends_on:
      - facilitator
    restart: unless-stopped

networks:
  default:
    name: x402-network
```

创建 `.env.docker`:

```bash
# 商户地址
MERCHANT_ADDRESS=0xYourMerchantAddress

# Facilitator 私钥（如果自己运行）
FACILITATOR_PRIVATE_KEY=0xYourFacilitatorKey

# 网络
NETWORK=base-sepolia
NETWORKS=base-sepolia,hashkey-testnet

# Facilitator URL（公共或本地）
# FACILITATOR_URL=https://x402-facilitator.coinbase.com  # 使用公共服务
FACILITATOR_URL=http://facilitator:3000/facilitator  # 使用本地 Facilitator
```

**创建 Dockerfile**:

```dockerfile
# examples/typescript/servers/express/Dockerfile
FROM node:24-alpine

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制必要文件
COPY package*.json pnpm-lock.yaml ./
COPY ../../package*.json ../../pnpm-workspace.yaml ../../

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源码
COPY . .

# 构建
RUN pnpm build

EXPOSE 4021

CMD ["pnpm", "start"]
```

**使用 Docker 部署**:

```bash
# 1. 配置环境
cp .env.docker .env
nano .env  # 编辑配置

# 2. 启动服务
docker-compose up -d

# 3. 查看日志
docker-compose logs -f

# 4. 停止服务
docker-compose down
```

---

## 🎨 自定义您的 API

### 添加新的付费端点

编辑 `servers/express/index.ts`:

```typescript
import express from 'express';
import { paymentMiddleware } from '@coinbase/x402-express';

const app = express();

// 配置支付中间件
app.use(
  paymentMiddleware(
    process.env.ADDRESS!,
    {
      // 添加您的端点和价格
      "/api/weather": "$0.01",
      "/api/stocks": "$0.05",
      "/api/ai-chat": "$0.10",
      "/api/premium": "$1.00",
    },
    {
      facilitatorUrl: process.env.FACILITATOR_URL,
      network: process.env.NETWORK || 'base-sepolia',
    }
  )
);

// 定义您的 API
app.get('/api/weather', (req, res) => {
  res.json({
    city: "San Francisco",
    temperature: "72°F",
    condition: "Sunny"
  });
});

app.get('/api/stocks', async (req, res) => {
  // 调用您的数据源
  const stockData = await fetchStockData(req.query.symbol);
  res.json(stockData);
});

app.post('/api/ai-chat', async (req, res) => {
  // AI API 示例
  const response = await callOpenAI(req.body.message);
  res.json({ response });
});

app.get('/api/premium', async (req, res) => {
  // 高级数据
  const analysis = await generateAnalysis();
  res.json(analysis);
});

const PORT = process.env.PORT || 4021;
app.listen(PORT, () => {
  console.log(`✅ 服务器运行在 http://localhost:${PORT}`);
});
```

### 动态定价

```typescript
// 根据用户、时间或资源动态设置价格
app.use((req, res, next) => {
  const hour = new Date().getHours();
  
  // 高峰时段加价
  const isPeakHours = hour >= 9 && hour <= 17;
  res.locals.priceMultiplier = isPeakHours ? 2 : 1;
  
  next();
});

app.use(
  paymentMiddleware(
    process.env.ADDRESS!,
    {
      "/api/data": (req, res) => {
        const basePrice = 0.01;
        const finalPrice = basePrice * res.locals.priceMultiplier;
        return `$${finalPrice}`;
      },
    }
  )
);
```

---

## 🌐 支持的网络

| 网络 | Network ID | Chain ID | RPC URL | USDC 地址 |
|------|-----------|----------|---------|----------|
| **Base Sepolia** | `base-sepolia` | 84532 | https://sepolia.base.org | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| **HashKey Testnet** | `hashkey-testnet` | 133 | https://testnet.hsk.xyz | `0x7c2a7C56a4A873c0087FCfA3B1491C6e31211E15` |
| **Polygon Amoy** | `polygon-amoy` | 80002 | https://rpc-amoy.polygon.technology | 待部署 |

### 添加其他网络

如果您想在其他 EVM 链上使用 x402，需要：

1. 部署 EIP-3009 兼容的 USDC 合约（参考 [DEPLOY_EIP3009_USDC.md](./DEPLOY_EIP3009_USDC.md)）
2. 配置网络参数到 x402

---

## 🚀 生产环境部署

### 安全检查清单

- [ ] ✅ **私钥管理**
  - 使用环境变量，不要硬编码
  - 使用密钥管理服务（AWS KMS, HashiCorp Vault）
  - 定期轮换密钥

- [ ] ✅ **网络配置**
  - 使用主网 USDC 合约
  - 配置正确的 Chain ID
  - 使用可靠的 RPC 提供商

- [ ] ✅ **服务器安全**
  - 启用 HTTPS
  - 配置 CORS
  - 添加速率限制
  - 设置防火墙规则

- [ ] ✅ **监控和日志**
  - 记录所有支付交易
  - 设置错误告警
  - 监控 gas 费用
  - 跟踪服务可用性

- [ ] ✅ **备份和恢复**
  - 备份配置文件
  - 准备灾难恢复计划
  - 测试恢复流程

### 生产环境配置

```bash
# .env.production
NODE_ENV=production

# 商户地址（收款）
MERCHANT_ADDRESS=0xYourProductionAddress

# Facilitator
FACILITATOR_URL=https://your-facilitator.com/facilitator
# 或使用 Coinbase 的生产 Facilitator
# FACILITATOR_URL=https://x402-facilitator.coinbase.com

# 网络（主网）
NETWORK=base-mainnet
# Base 主网 Chain ID: 8453
# Base 主网 USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

# 服务器
PORT=443
HOST=0.0.0.0

# 安全
CORS_ORIGINS=https://yourdomain.com,https://api.yourdomain.com
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# 日志
LOG_LEVEL=info
LOG_FILE=/var/log/x402/server.log

# 监控
SENTRY_DSN=https://your-sentry-dsn
METRICS_PORT=9090
```

### Kubernetes 部署

创建 `k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: x402-server
  labels:
    app: x402-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: x402-server
  template:
    metadata:
      labels:
        app: x402-server
    spec:
      containers:
      - name: server
        image: your-registry/x402-server:latest
        ports:
        - containerPort: 4021
        env:
        - name: MERCHANT_ADDRESS
          valueFrom:
            secretKeyRef:
              name: x402-secrets
              key: merchant-address
        - name: FACILITATOR_URL
          valueFrom:
            configMapKeyRef:
              name: x402-config
              key: facilitator-url
        - name: NETWORK
          value: "base-mainnet"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 4021
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 4021
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: x402-server
spec:
  selector:
    app: x402-server
  ports:
  - port: 80
    targetPort: 4021
  type: LoadBalancer
```

**部署到 Kubernetes**:

```bash
# 创建配置
kubectl create configmap x402-config \
  --from-literal=facilitator-url=https://x402-facilitator.coinbase.com

# 创建密钥
kubectl create secret generic x402-secrets \
  --from-literal=merchant-address=0xYourAddress

# 部署
kubectl apply -f k8s/deployment.yaml

# 查看状态
kubectl get pods -l app=x402-server
kubectl logs -f deployment/x402-server
```

---

## 🔧 故障排查

### 常见问题

#### 1. 客户端报错："insufficient funds"

**原因**: 客户端账户 USDC 余额不足

**解决**:
```bash
# 检查余额
cast balance --erc20 0x036CbD53842c5426634e7929541eC2318f3dCF7e 0xYourAddress --rpc-url https://sepolia.base.org

# 获取测试 USDC（需要从其他账户转账或使用 faucet）
```

#### 2. Facilitator 报错："insufficient gas"

**原因**: Facilitator 账户 ETH 不足支付 gas

**解决**:
```bash
# 检查 ETH 余额
cast balance 0xYourFacilitatorAddress --rpc-url https://sepolia.base.org

# 获取测试 ETH
# 访问: https://www.alchemy.com/faucets/base-sepolia
```

#### 3. 服务器返回 402，但客户端没有支付

**原因**: 客户端配置错误或网络不匹配

**解决**:
```bash
# 检查客户端 .env
echo $PRIVATE_KEY
echo $RESOURCE_SERVER_URL

# 确保网络匹配
# 服务器 NETWORK=base-sepolia
# 客户端也应该使用 base-sepolia
```

#### 4. 交易提交后一直 pending

**原因**: Gas 价格太低或网络拥堵

**解决**:
```typescript
// 在 Facilitator 中调整 gas 设置
const tx = await contract.transferWithAuthorization(
  from, to, value, validAfter, validBefore, nonce, v, r, s,
  {
    gasLimit: 200000,  // 增加 gas limit
    gasPrice: await provider.getGasPrice().then(p => p.mul(120).div(100))  // 提高 20%
  }
);
```

#### 5. "Invalid signature" 错误

**原因**: 签名参数不正确

**解决**:
```typescript
// 检查 EIP-712 domain
const domain = {
  name: "USD Coin",  // 必须匹配合约
  version: "2",      // 必须匹配合约
  chainId: 84532,    // 必须匹配网络
  verifyingContract: "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
};

// 确保使用正确的类型
const types = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ]
};
```

### 调试模式

启用详细日志：

```bash
# 服务器
DEBUG=x402:* pnpm dev

# Facilitator
DEBUG=x402:*,ethers:* pnpm dev

# 客户端
DEBUG=x402:* pnpm dev
```

### 测试 Facilitator 端点

```bash
# 检查支持的网络
curl http://localhost:3000/facilitator/supported

# 测试 verify
curl -X POST http://localhost:3000/facilitator/verify \
  -H "Content-Type: application/json" \
  -d '{
    "x402Version": 1,
    "paymentHeader": "...",
    "paymentRequirements": {...}
  }'

# 测试 settle
curl -X POST http://localhost:3000/facilitator/settle \
  -H "Content-Type: application/json" \
  -d '{
    "x402Version": 1,
    "paymentHeader": "...",
    "paymentRequirements": {...}
  }'
```

---

## 📚 更多资源

### 文档

- **协议规范**: [specs/x402-specification.md](./specs/x402-specification.md)
- **流程详解**: [X402_FLOW_EXPLAINED.md](./X402_FLOW_EXPLAINED.md)
- **部署 USDC**: [DEPLOY_EIP3009_USDC.md](./DEPLOY_EIP3009_USDC.md)
- **HashKey 集成**: [HASHKEY_INTEGRATION_GUIDE.md](./HASHKEY_INTEGRATION_GUIDE.md)

### 示例代码

- [Express 服务器](./examples/typescript/servers/express)
- [Hono 服务器](./examples/typescript/servers/hono)
- [Axios 客户端](./examples/typescript/clients/axios)
- [Fetch 客户端](./examples/typescript/clients/fetch)
- [Python 示例](./examples/python)

### 社区

- **官网**: https://x402.org
- **GitHub**: https://github.com/coinbase/x402
- **Discord**: https://discord.gg/x402
- **Twitter**: https://twitter.com/x402protocol

---

## 🎯 快速参考

### 环境变量速查

```bash
# 资源服务器 (servers/express/.env)
ADDRESS=0x...              # 收款地址（必需）
FACILITATOR_URL=https://...  # Facilitator URL（必需）
NETWORK=base-sepolia       # 网络（必需）
PORT=4021                  # 端口（可选，默认 4021）

# Facilitator (facilitator/.env)
EVM_PRIVATE_KEY=0x...      # 私钥（必需，需要 ETH）
SUPPORTED_NETWORKS=base-sepolia  # 支持的网络（可选）
PORT=3000                  # 端口（可选，默认 3000）

# 客户端 (clients/axios/.env)
PRIVATE_KEY=0x...          # 私钥（必需，需要 USDC）
RESOURCE_SERVER_URL=http://...  # 服务器地址（必需）
ENDPOINT_PATH=/weather     # 端点路径（必需）
```

### 命令速查

```bash
# 安装
pnpm install && pnpm build

# 启动服务器
cd servers/express && pnpm dev

# 启动 Facilitator
cd facilitator && pnpm dev

# 测试客户端
cd clients/axios && pnpm dev

# 检查余额
cast balance --erc20 <USDC_ADDRESS> <YOUR_ADDRESS> --rpc-url <RPC_URL>

# 查看交易
cast tx <TX_HASH> --rpc-url <RPC_URL>
```

---

## 🎉 开始使用

选择您的部署模式：

### 🚀 快速开始（5 分钟）

```bash
git clone https://github.com/coinbase/x402.git
cd x402/examples/typescript
pnpm install && pnpm build
cd servers/express && echo "ADDRESS=0xYour..." > .env && pnpm dev
```

### 📦 一键部署（推荐）

```bash
./deploy-x402.sh
./start-x402.sh
```

### 🐳 Docker 部署

```bash
docker-compose up -d
```

**祝您使用 x402 顺利！** 💰

---

**最后更新**: 2025-10-27  
**版本**: 2.0.0  
**维护者**: x402 Community
