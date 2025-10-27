# x402 协议代码深度解析

## 📋 目录
1. [项目概述](#项目概述)
2. [核心概念](#核心概念)
3. [架构设计](#架构设计)
4. [技术流程](#技术流程)
5. [代码结构](#代码结构)
6. [关键实现](#关键实现)
7. [使用示例](#使用示例)
8. [扩展性](#扩展性)

---

## 项目概述

**x402** 是一个开源的互联网支付协议，旨在让开发者只用 **1 行代码** 就能接受数字货币支付。

### 核心特点
- ✅ **无手续费** - 不收取交易手续费
- ⚡ **2秒结算** - 快速的区块链交易确认
- 💰 **$0.001 最小支付** - 支持微支付，不像信用卡有高额最低限额
- 🔓 **开放标准** - 完全开源，不依赖单一服务商
- 🌐 **HTTP 原生** - 无缝集成到现有 HTTP 服务中
- ⛓️ **链和代币无关** - 支持多条区块链和多种代币

### 核心理念

> "互联网上的支付从根本上是有缺陷的。信用卡摩擦力大、接入难、最小支付额太高，不符合互联网的程序化本质。是时候建立一个开放的、互联网原生的支付形式了。"

---

## 核心概念

### 1. 三个核心角色

```
┌─────────────┐         ┌──────────────────┐         ┌──────────────┐
│   Client    │◄───────►│ Resource Server  │◄───────►│ Facilitator  │
│  (付款方)    │         │   (资源服务器)     │         │  (支付处理器)  │
└─────────────┘         └──────────────────┘         └──────────────┘
      │                         │                            │
      │  1. 请求资源             │                            │
      │─────────────────────────►│                            │
      │                         │                            │
      │  2. 返回 402 + 支付要求   │                            │
      │◄─────────────────────────│                            │
      │                         │                            │
      │  3. 发送支付授权          │                            │
      │─────────────────────────►│                            │
      │                         │  4. 验证支付                 │
      │                         │───────────────────────────►│
      │                         │                            │
      │                         │  5. 返回验证结果             │
      │                         │◄───────────────────────────│
      │                         │                            │
      │                         │  6. 结算支付到区块链          │
      │                         │───────────────────────────►│
      │                         │                            │
      │  7. 返回资源 + 交易哈希    │  8. 返回交易详情             │
      │◄─────────────────────────│◄───────────────────────────│
      └─────────────────────────┘                            │
```

- **Client (客户端)**: 想要付费获取资源的实体（人类用户或 AI Agent）
- **Resource Server (资源服务器)**: 提供 API 或其他资源的 HTTP 服务器
- **Facilitator (促进者/支付处理器)**: 处理支付验证和区块链交易的服务器

### 2. 核心 HTTP 状态码和头部

- **HTTP 402 Payment Required**: 指示需要付款
- **X-PAYMENT** 请求头: 客户端发送支付授权
- **X-PAYMENT-RESPONSE** 响应头: 服务器返回交易详情

### 3. 三层架构

x402 采用分层设计，使协议具有高度的可扩展性：

```
┌────────────────────────────────────────────────────┐
│  Representation Layer (表示层)                      │
│  传输机制: HTTP, MCP, A2A                           │
│  决定如何传输和信号支付数据                          │
└────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────┐
│  Types Layer (类型层)                               │
│  核心数据结构: PaymentRequirements, PaymentPayload │
│  独立于传输和支付方案                                │
└────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────┐
│  Logic Layer (逻辑层)                               │
│  支付方案: exact, deferred (规划中)                 │
│  网络: EVM, SVM, 等                                 │
└────────────────────────────────────────────────────┘
```

---

## 架构设计

### 数据类型定义

#### 1. PaymentRequirements (支付要求)

服务器告诉客户端如何付款：

```typescript
{
  scheme: "exact",                    // 支付方案
  network: "base-sepolia",            // 区块链网络
  maxAmountRequired: "10000",         // 要求的金额 (原子单位)
  asset: "0x036CbD...",              // 代币合约地址
  payTo: "0x209693...",              // 收款地址
  resource: "https://api.example.com/data",  // 资源 URL
  description: "Premium market data", // 资源描述
  mimeType: "application/json",      // 响应类型
  maxTimeoutSeconds: 60,             // 最大超时时间
  extra: {                           // 额外信息 (方案特定)
    name: "USDC",
    version: "2"
  }
}
```

#### 2. PaymentPayload (支付负载)

客户端发送的支付授权：

```typescript
{
  x402Version: 1,
  scheme: "exact",
  network: "base-sepolia",
  payload: {
    signature: "0x2d6a75...",        // EIP-712 签名
    authorization: {
      from: "0x857b06...",           // 付款人地址
      to: "0x209693...",             // 收款人地址
      value: "10000",                // 金额
      validAfter: "1740672089",      // 有效期开始
      validBefore: "1740672154",     // 有效期结束
      nonce: "0xf37466..."          // 防重放攻击的随机数
    }
  }
}
```

#### 3. SettlementResponse (结算响应)

服务器返回的交易信息：

```typescript
{
  success: true,
  transaction: "0x1234567890abcdef...", // 交易哈希
  network: "base-sepolia",
  payer: "0x857b06..."
}
```

---

## 技术流程

### 完整的支付流程

```
步骤 1-2: 发现支付要求 (可选，如果客户端已知可跳过)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
客户端                                     服务器
  │                                         │
  │  GET /api/data                          │
  │────────────────────────────────────────►│
  │                                         │
  │  402 Payment Required                   │
  │  {                                      │
  │    x402Version: 1,                      │
  │    accepts: [PaymentRequirements],      │
  │    error: "Payment required"            │
  │  }                                      │
  │◄────────────────────────────────────────│
  │                                         │

步骤 3-7: 支付和资源获取
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
客户端                服务器                促进者
  │                  │                    │
  │ 创建签名授权       │                    │
  │                  │                    │
  │ GET /api/data    │                    │
  │ X-PAYMENT: {...} │                    │
  │─────────────────►│                    │
  │                  │ POST /verify       │
  │                  │ {payload, reqs}    │
  │                  │───────────────────►│
  │                  │                    │
  │                  │ {isValid: true}    │
  │                  │◄───────────────────│
  │                  │                    │
  │                  │ 处理请求            │
  │                  │                    │
  │                  │ POST /settle       │
  │                  │ {payload, reqs}    │
  │                  │───────────────────►│
  │                  │                    │ 提交到区块链
  │                  │                    │ 等待确认
  │                  │ {success, txHash}  │
  │                  │◄───────────────────│
  │                  │                    │
  │ 200 OK           │                    │
  │ X-PAYMENT-RESPONSE: {...}             │
  │ {资源数据}        │                    │
  │◄─────────────────│                    │
  │                  │                    │
```

### 关键技术点

#### 1. EIP-3009: 授权转账

x402 使用 EIP-3009 标准，这是一种**gasless**（无需 gas 费）的转账方式：

- 用户签名授权，但不发送交易
- 服务器（通过 Facilitator）代表用户提交交易
- 用户不需要持有 ETH 来支付 gas
- 使用 nonce 防止重放攻击

```javascript
// EIP-3009 授权结构
TransferWithAuthorization {
  from: address,      // 付款人
  to: address,        // 收款人
  value: uint256,     // 金额
  validAfter: uint256,  // 有效期开始
  validBefore: uint256, // 有效期结束
  nonce: bytes32      // 随机数
}
```

#### 2. 安全机制

**防重放攻击**:
- 每个授权包含唯一的 32 字节 nonce
- EIP-3009 合约在区块链层面防止 nonce 重用
- 时间窗口限制（validAfter/validBefore）

**信任最小化**:
- Facilitator 不能移动资金（只能按客户意图执行）
- 客户签名明确指定金额和收款人
- 服务器无法修改支付参数

---

## 代码结构

### TypeScript 包结构

```
typescript/packages/
├── x402/                    # 核心库
│   ├── client/              # 客户端逻辑
│   │   ├── createPaymentHeader.ts    # 创建支付头
│   │   └── selectPaymentRequirements.ts  # 选择支付方案
│   ├── schemes/             # 支付方案实现
│   │   └── exact/
│   │       ├── evm/         # EVM 链实现
│   │       └── svm/         # Solana 实现
│   ├── facilitator/         # Facilitator 客户端
│   ├── types/               # 类型定义
│   └── verify/              # 验证逻辑
│
├── x402-express/            # Express.js 中间件
├── x402-fastapi/            # FastAPI 中间件 (Python)
├── x402-axios/              # Axios 拦截器
├── x402-fetch/              # Fetch 包装器
└── coinbase-x402/           # Coinbase 的 Facilitator 实现
```

### Python 包结构

```
python/x402/src/x402/
├── types.py                 # 类型定义
├── facilitator.py           # Facilitator 客户端
├── exact.py                 # Exact 方案实现
├── clients/                 # HTTP 客户端适配器
│   ├── httpx.py
│   └── requests.py
├── fastapi/                 # FastAPI 中间件
│   └── middleware.py
└── flask/                   # Flask 中间件
    └── middleware.py
```

---

## 关键实现

### 1. 服务器端中间件 (Python FastAPI)

```python
# python/x402/src/x402/fastapi/middleware.py

@validate_call
def require_payment(
    price: Price,                    # 价格 (如 "$0.01" 或 TokenAmount)
    pay_to_address: str,             # 收款地址
    path: str | list[str] = "*",     # 路径匹配
    network: str = "base-sepolia",   # 区块链网络
    facilitator_config: Optional[FacilitatorConfig] = None,
    # ... 其他参数
):
    """生成 FastAPI 中间件来为端点设置支付门槛"""
    
    # 验证网络是否支持
    if network not in supported_networks:
        raise ValueError(f"Unsupported network: {network}")
    
    # 处理价格并转换为原子单位
    max_amount_required, asset_address, eip712_domain = \
        process_price_to_atomic_amount(price, network)
    
    # 创建 Facilitator 客户端
    facilitator = FacilitatorClient(facilitator_config)
    
    async def middleware(request: Request, call_next: Callable):
        # 检查路径是否匹配
        if not path_is_match(path, request.url.path):
            return await call_next(request)
        
        # 构造支付要求
        payment_requirements = [PaymentRequirements(...)]
        
        # 检查是否有支付头
        payment_header = request.headers.get("X-PAYMENT", "")
        if payment_header == "":
            return x402_response("No X-PAYMENT header provided")
        
        # 解码支付头
        payment = PaymentPayload(**json.loads(safe_base64_decode(payment_header)))
        
        # 验证支付
        verify_response = await facilitator.verify(payment, payment_requirements)
        if not verify_response.is_valid:
            return x402_response(f"Invalid payment: {verify_response.invalid_reason}")
        
        # 处理请求
        response = await call_next(request)
        
        # 如果响应成功，结算支付
        if 200 <= response.status_code < 300:
            settle_response = await facilitator.settle(payment, payment_requirements)
            if settle_response.success:
                # 添加支付响应头
                response.headers["X-PAYMENT-RESPONSE"] = base64.b64encode(
                    settle_response.model_dump_json(by_alias=True).encode("utf-8")
                ).decode("utf-8")
        
        return response
    
    return middleware
```

### 2. 客户端支付创建 (TypeScript)

```typescript
// typescript/packages/x402/src/client/createPaymentHeader.ts

export async function createPaymentHeader(
  client: Signer | MultiNetworkSigner,
  x402Version: number,
  paymentRequirements: PaymentRequirements,
  config?: X402Config,
): Promise<string> {
  // 根据支付方案路由
  if (paymentRequirements.scheme === "exact") {
    // 根据网络路由 (EVM 或 SVM)
    if (SupportedEVMNetworks.includes(paymentRequirements.network)) {
      const evmClient = isMultiNetworkSigner(client) ? client.evm : client;
      return await createPaymentHeaderExactEVM(
        evmClient,
        x402Version,
        paymentRequirements,
      );
    }
    
    if (SupportedSVMNetworks.includes(paymentRequirements.network)) {
      const svmClient = isMultiNetworkSigner(client) ? client.svm : client;
      return await createPaymentHeaderExactSVM(
        svmClient,
        x402Version,
        paymentRequirements,
        config,
      );
    }
    
    throw new Error("Unsupported network");
  }
  
  throw new Error("Unsupported scheme");
}
```

### 3. Facilitator 客户端

```python
# python/x402/src/x402/facilitator.py

class FacilitatorClient:
    def __init__(self, config: Optional[FacilitatorConfig] = None):
        if config is None:
            config = {"url": "https://x402.org/facilitator"}
        self.config = config
    
    async def verify(
        self, 
        payment: PaymentPayload, 
        payment_requirements: PaymentRequirements
    ) -> VerifyResponse:
        """验证支付是否有效"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.config['url']}/verify",
                json={
                    "x402Version": payment.x402_version,
                    "paymentPayload": payment.model_dump(by_alias=True),
                    "paymentRequirements": payment_requirements.model_dump(by_alias=True),
                },
            )
            return VerifyResponse(**response.json())
    
    async def settle(
        self,
        payment: PaymentPayload,
        payment_requirements: PaymentRequirements
    ) -> SettleResponse:
        """结算支付到区块链"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.config['url']}/settle",
                json={
                    "x402Version": payment.x402_version,
                    "paymentPayload": payment.model_dump(by_alias=True),
                    "paymentRequirements": payment_requirements.model_dump(by_alias=True),
                },
            )
            return SettleResponse(**response.json())
```

---

## 使用示例

### 服务器端：Express.js

```typescript
import express from "express";
import { paymentMiddleware } from "x402-express";

const app = express();

// 只需一行代码添加支付门槛！
app.use(
  paymentMiddleware(
    "0xYourAddress",  // 收款地址
    {
      "GET /weather": {
        price: "$0.001",           // 只需 0.1 美分
        network: "base-sepolia",
      },
      "/premium/*": {
        price: "$0.01",
        network: "base-sepolia",
      },
    },
  ),
);

// 正常定义你的路由
app.get("/weather", (req, res) => {
  res.send({ weather: "sunny", temperature: 70 });
});

app.listen(4021);
```

### 服务器端：FastAPI (Python)

```python
from fastapi import FastAPI
from x402.fastapi.middleware import require_payment

app = FastAPI()

# 为特定路由应用支付中间件
app.middleware("http")(
    require_payment(
        path="/weather",
        price="$0.001",
        pay_to_address="0xYourAddress",
        network="base-sepolia",
    )
)

@app.get("/weather")
async def get_weather():
    return {"weather": "sunny", "temperature": 70}
```

### 客户端：Axios

```typescript
import axios from "axios";
import { withPaymentInterceptor, createSigner } from "x402-axios";

// 创建签名器
const signer = await createSigner("base-sepolia", privateKey);

// 添加支付拦截器
const api = withPaymentInterceptor(
  axios.create({ baseURL: "https://api.example.com" }),
  signer,
);

// 正常发送请求，拦截器自动处理支付！
const response = await api.get("/weather");
console.log(response.data);

// 获取支付信息
const paymentResponse = decodeXPaymentResponse(
  response.headers["x-payment-response"]
);
console.log(paymentResponse); // { success: true, transaction: "0x...", ... }
```

### 客户端：Python httpx

```python
from x402.clients.httpx import PaymentClient

# 创建支付客户端
client = PaymentClient(
    private_key="0x...",
    network="base-sepolia",
)

# 自动处理支付
response = await client.get("https://api.example.com/weather")
print(response.json())
```

---

## 扩展性

### 1. 支付方案 (Payment Schemes)

当前实现的方案：
- **exact**: 精确金额转账（使用 EIP-3009）

规划中的方案：
- **upto**: 按使用量付费（适合 LLM API）
- **deferred**: 延迟支付（先使用后付费）
- **commerce**: 电商方案（支持退款/托管）

### 2. 区块链网络

当前支持：
- **EVM 链**: Base, Base Sepolia, Avalanche, Avalanche Fuji, IoTeX
- **Solana**: Solana Devnet, Mainnet

添加新网络的步骤：
1. 在 `networks.ts` 添加网络配置
2. 实现特定网络的客户端逻辑
3. 实现 Facilitator 的验证和结算逻辑

### 3. 传输层 (Transport)

当前支持：
- **HTTP**: REST API (最常见)
- **MCP**: Model Context Protocol (AI Agent)
- **A2A**: Agent-to-Agent (智能体间通信)

可扩展到：
- WebSocket
- gRPC
- 自定义协议

### 4. 框架集成

**已实现**:
- Express.js, Hono, Next.js (TypeScript)
- FastAPI, Flask (Python)
- Gin (Go)

**社区贡献机会**:
- Spring Boot (Java)
- Django (Python)
- Rails (Ruby)
- 等等...

---

## 发现和市场 (Bazaar)

x402 包含一个**发现机制**，允许客户端找到可用的 x402 资源：

```typescript
// 列出所有可用的 x402 资源
GET /discovery/resources?type=http&limit=10

// 响应
{
  "x402Version": 1,
  "items": [
    {
      "resource": "https://api.example.com/premium-data",
      "type": "http",
      "accepts": [PaymentRequirements],
      "lastUpdated": 1703123456,
      "metadata": {
        "category": "finance",
        "provider": "Example Corp"
      }
    }
  ]
}
```

这使得可以创建 **x402 市场** (Bazaar)，用户可以：
- 按类别浏览 API
- 比较价格和功能
- 发现新的 x402 服务

---

## 技术优势

### 1. 对开发者友好
- **1 行代码**集成到服务器
- **1 个函数**集成到客户端
- 不需要深入理解区块链细节

### 2. Gasless (无 Gas 费)
- 客户端和服务器都不需要持有 ETH
- Facilitator 代为支付 gas
- 用户体验更好

### 3. 微支付友好
- 最低 $0.001
- 适合 AI Agent 按需付费
- 适合内容创作者

### 4. 安全可靠
- EIP-3009 标准，经过验证
- 防重放攻击
- 时间窗口限制
- 信任最小化设计

### 5. 高度可扩展
- 模块化架构
- 支持多链
- 支持多种传输层
- 社区可贡献新方案

---

## 路线图亮点

### 现在正在做
- ✅ x402 Bazaar 已上线
- 🔨 按使用量付费方案 (Usage-based)
- 🔨 MCP 支持

### 接下来
- 开源 CDP Go Facilitator
- Bazaar 支持外部 Facilitator
- Solana 支持
- A2A 和 MCP 在 Bazaar 中的支持
- 身份解决方案集成

### 未来
- ERC-8004 集成（智能体信誉）
- 电商方案（退款/托管）
- 任意代币支持（Permit/Permit2）
- XMTP 支持
- Facilitator 路由器

---

## 适用场景

### 1. AI Agent 集成
AI 智能体可以自主支付资源：
- 自动支付 API 调用
- 资源发现
- 预算管理
- 跨协议支付

### 2. 内容货币化
- 按文章付费
- 订阅模式
- 视频/音频内容
- 数据下载

### 3. API 货币化
- 天气数据
- 金融数据
- AI 模型推理
- 图片处理

### 4. 微服务收费
- RPC 节点
- IPFS 网关
- CDN 服务
- 计算资源

---

## 总结

x402 是一个革命性的互联网支付协议，它：

1. **简化集成** - 1 行代码即可开始接受支付
2. **降低门槛** - 支持微支付，最低 $0.001
3. **提升体验** - Gasless，2 秒结算
4. **保证安全** - 基于成熟的区块链标准
5. **高度开放** - 完全开源，社区驱动

它为互联网带来了真正的程序化支付能力，特别适合：
- AI Agent 自主交易
- 内容创作者货币化
- API 服务商收费
- 微服务架构

这是一个正在快速发展的生态系统，欢迎社区贡献！

---

## 参考资源

- [官方网站](https://x402.org)
- [GitHub 仓库](https://github.com/coinbase/x402)
- [规范文档](./specs/x402-specification.md)
- [路线图](./ROADMAP.md)
- [贡献指南](./CONTRIBUTING.md)

---

**创建时间**: 2025-10-24
**维护者**: x402 社区

