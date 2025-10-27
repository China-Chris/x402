# 测试 Facilitator 快速指南

## 方案 A：运行本地 Facilitator 服务器

### 1. 启动 Facilitator 服务器

```bash
cd examples/typescript/facilitator

# 创建 .env 文件
cat > .env << EOF
EVM_PRIVATE_KEY=你的EVM私钥
SVM_PRIVATE_KEY=你的Solana私钥（可选）
PORT=3000
EOF

# 安装依赖并运行
pnpm install
pnpm dev
```

服务器将运行在 `http://localhost:3000`

### 2. 测试 Facilitator 端点

```bash
# 测试 /supported 端点
curl http://localhost:3000/supported

# 应该返回：
# {
#   "kinds": [
#     {
#       "x402Version": 1,
#       "scheme": "exact",
#       "network": "base-sepolia"
#     }
#   ]
# }
```

### 3. 配置你的服务器使用本地 Facilitator

**Python (FastAPI):**
```python
from x402.fastapi.middleware import require_payment
from x402.facilitator import FacilitatorConfig

app.middleware("http")(
    require_payment(
        path="/weather",
        price="$0.001",
        pay_to_address="0xYourAddress",
        network="base-sepolia",
        facilitator_config=FacilitatorConfig(
            url="http://localhost:3000"  # 使用本地 Facilitator
        )
    )
)
```

**TypeScript (Express):**
```typescript
import { paymentMiddleware } from "x402-express";

app.use(
  paymentMiddleware(
    "0xYourAddress",
    {
      "GET /weather": {
        price: "$0.001",
        network: "base-sepolia",
      }
    },
    {
      url: "http://localhost:3000"  // 使用本地 Facilitator
    }
  )
);
```

---

## 方案 B：使用公共 Facilitator

### 无需配置，直接使用默认的 x402.org Facilitator

**Python:**
```python
# 不传 facilitator_config，自动使用 https://x402.org/facilitator
app.middleware("http")(
    require_payment(
        path="/weather",
        price="$0.001",
        pay_to_address="0xYourAddress",
        network="base-sepolia",
        # 不传 facilitator_config 参数
    )
)
```

**TypeScript:**
```typescript
// 不传第三个参数，自动使用公共 Facilitator
app.use(
  paymentMiddleware(
    "0xYourAddress",
    {
      "GET /weather": { price: "$0.001", network: "base-sepolia" }
    }
    // 不传 facilitator config
  )
);
```

---

## 方案 C：使用 Coinbase 生产级 Facilitator

### 1. 获取 Coinbase API 密钥

访问 [Coinbase Developer Platform](https://portal.cdp.coinbase.com/)

### 2. 配置使用 Coinbase Facilitator

**TypeScript:**
```typescript
import { createFacilitatorConfig } from "coinbase-x402";
import { paymentMiddleware } from "x402-express";

const facilitatorConfig = createFacilitatorConfig(
  process.env.CDP_API_KEY_ID,
  process.env.CDP_API_KEY_SECRET
);

app.use(
  paymentMiddleware(
    "0xYourAddress",
    {
      "GET /weather": { price: "$0.01", network: "base" }  // 生产网络
    },
    facilitatorConfig  // 使用 Coinbase Facilitator
  )
);
```

---

## 完整测试流程

### 终端 1：运行 Facilitator
```bash
cd examples/typescript/facilitator
pnpm dev
```

### 终端 2：运行资源服务器
```bash
cd examples/typescript/servers/express
# 配置 .env
echo "ADDRESS=0xYourReceivingAddress" > .env
echo "FACILITATOR_URL=http://localhost:3000" >> .env

pnpm dev
```

### 终端 3：运行客户端
```bash
cd examples/typescript/clients/axios
# 配置 .env
echo "PRIVATE_KEY=0xYourPayingPrivateKey" > .env
echo "RESOURCE_SERVER_URL=http://localhost:4021" >> .env
echo "ENDPOINT_PATH=/weather" >> .env

pnpm dev
```

### 观察流程

1. **客户端**：发送请求到资源服务器
2. **资源服务器**：调用 Facilitator 验证支付
3. **Facilitator**：验证签名和余额，返回验证结果
4. **资源服务器**：如果验证通过，处理请求
5. **资源服务器**：调用 Facilitator 结算支付到区块链
6. **Facilitator**：提交交易，返回交易哈希
7. **资源服务器**：返回资源和交易详情给客户端

---

## Facilitator 的 API 端点

### GET /supported
返回支持的支付方式

**响应：**
```json
{
  "kinds": [
    {
      "x402Version": 1,
      "scheme": "exact",
      "network": "base-sepolia",
      "extra": {}
    }
  ]
}
```

### POST /verify
验证支付授权

**请求：**
```json
{
  "paymentPayload": { /* PaymentPayload */ },
  "paymentRequirements": { /* PaymentRequirements */ }
}
```

**响应：**
```json
{
  "isValid": true,
  "payer": "0x..."
}
```

### POST /settle
结算支付到区块链

**请求：**
```json
{
  "paymentPayload": { /* PaymentPayload */ },
  "paymentRequirements": { /* PaymentRequirements */ }
}
```

**响应：**
```json
{
  "success": true,
  "transaction": "0x...",
  "network": "base-sepolia",
  "payer": "0x..."
}
```

---

## 调试技巧

### 查看 Facilitator 日志
```bash
# Facilitator 会打印所有请求
cd examples/typescript/facilitator
pnpm dev

# 你会看到：
# POST /verify - 验证请求
# POST /settle - 结算请求
```

### 测试 Facilitator 的 verify 端点
```bash
curl -X POST http://localhost:3000/verify \
  -H "Content-Type: application/json" \
  -d '{
    "paymentPayload": {...},
    "paymentRequirements": {...}
  }'
```

### 检查 Facilitator 是否在运行
```bash
curl http://localhost:3000/supported
```

---

## 常见问题

### Q: Facilitator 需要持有 ETH 吗？
**A:** 是的，Facilitator 需要持有 ETH 来支付 gas 费用（代表用户提交交易）。

### Q: 可以运行多个 Facilitator 吗？
**A:** 可以！你可以为不同的网络或用途运行多个 Facilitator。

### Q: Facilitator 会收费吗？
**A:** 本地运行的 Facilitator 不收费（只需支付 gas）。Coinbase Facilitator 的定价请查看官方文档。

### Q: Facilitator 安全吗？
**A:** Facilitator 只能按照用户的签名授权执行转账，无法擅自移动资金。采用 EIP-3009 标准，安全可靠。

---

## 下一步

- 📖 阅读 [Facilitator 接口规范](../specs/x402-specification.md#7-facilitator-interface)
- 🔧 自定义 Facilitator 的验证逻辑
- 🌐 部署 Facilitator 到生产环境
- 🔐 添加认证和授权机制

---

**提示**: 对于学习和测试，推荐使用本地 Facilitator。对于生产环境，推荐使用 Coinbase 的 Facilitator 或仔细审计后的自托管版本。

