# x402 完整流程详解

## 📖 目录
1. [核心概念](#核心概念)
2. [完整流程图](#完整流程图)
3. [详细步骤解析](#详细步骤解析)
4. [EIP-3009 原理](#eip-3009-原理)
5. [实际代码流程](#实际代码流程)
6. [问题与解答](#问题与解答)

---

## 核心概念

### 三个角色

```
┌─────────────────┐
│   Client        │  付款方（你的用户或 AI Agent）
│  (付款方)        │  - 想要访问付费资源
└─────────────────┘  - 签名支付授权（不发送交易）
        │            - 持有 USDC 代币
        │
        ▼
┌─────────────────┐
│ Resource Server │  资源提供方（你的 API 服务器）
│  (资源服务器)    │  - 提供付费 API/资源
└─────────────────┘  - 检查支付并提供服务
        │            - 不需要管理钱包
        │
        ▼
┌─────────────────┐
│  Facilitator    │  支付处理器（中间服务）
│  (支付处理器)    │  - 验证支付授权
└─────────────────┘  - 提交交易到区块链
                     - 支付 gas 费用
```

---

## 完整流程图

```
时间线：从请求到支付完成
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

步骤 1️⃣: 客户端首次请求（没有支付）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Client                    Resource Server
  │
  │  GET /api/weather
  │  (没有 X-PAYMENT 头)
  │─────────────────────────►
  │                          │
  │                          │ 检查: 没有支付头
  │                          │
  │  402 Payment Required    │
  │  + PaymentRequirements   │
  │◄─────────────────────────│
  │                          │
  │  {
  │    "scheme": "exact",
  │    "network": "hashkey-testnet",
  │    "maxAmountRequired": "1000",  // 0.001 USDC (6 decimals)
  │    "asset": "0xUSDCAddress",
  │    "payTo": "0xServerAddress",
  │    "resource": "http://localhost:4021/api/weather",
  │    "extra": { "name": "USDC", "version": "2" }
  │  }


步骤 2️⃣: 客户端创建支付授权
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Client (本地操作，不上链)
  │
  │ 1. 检查余额
  │    - 查询 USDC 合约
  │    - 确认有足够的 USDC
  │
  │ 2. 生成随机 nonce
  │    - nonce = crypto.randomBytes(32)
  │    - 防止重放攻击
  │
  │ 3. 准备 EIP-3009 授权数据
  │    authorization = {
  │      from: "0xClientAddress",      // 付款人
  │      to: "0xServerAddress",        // 收款人
  │      value: "1000",                // 金额
  │      validAfter: "1740000000",     // 有效期开始
  │      validBefore: "1740000060",    // 有效期结束（60秒后）
  │      nonce: "0xrandom..."          // 随机数
  │    }
  │
  │ 4. 使用 EIP-712 签名
  │    - 构造 EIP-712 消息
  │    - 使用私钥签名
  │    - 得到签名 signature
  │
  │ 5. 构造 PaymentPayload
  │    payload = {
  │      x402Version: 1,
  │      scheme: "exact",
  │      network: "hashkey-testnet",
  │      payload: {
  │        signature: "0x...",
  │        authorization: { ... }
  │      }
  │    }
  │
  │ 6. Base64 编码
  │    paymentHeader = base64(JSON.stringify(payload))


步骤 3️⃣: 客户端发送带支付的请求
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Client                    Resource Server
  │
  │  GET /api/weather
  │  X-PAYMENT: eyJzY2hlbWUi...  (Base64 编码的 PaymentPayload)
  │─────────────────────────►
  │                          │
  │                          │ 1. 解码 X-PAYMENT 头
  │                          │    payload = base64Decode(header)
  │                          │
  │                          │ 2. 提取支付信息
  │                          │    - 检查 scheme, network
  │                          │    - 提取 signature, authorization
  │                          │


步骤 4️⃣: 服务器验证支付
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Resource Server           Facilitator           Blockchain
  │                          │                        │
  │  POST /verify            │                        │
  │  {                       │                        │
  │    paymentPayload,       │                        │
  │    paymentRequirements   │                        │
  │  }                       │                        │
  │─────────────────────────►│                        │
  │                          │                        │
  │                          │ 验证步骤：              │
  │                          │                        │
  │                          │ 1. 验证签名            │
  │                          │    ✓ 使用 EIP-712      │
  │                          │    ✓ 恢复签名者地址     │
  │                          │    ✓ 确认是 from 地址   │
  │                          │                        │
  │                          │ 2. 查询余额            │
  │                          │    USDC.balanceOf()    │
  │                          │───────────────────────►│
  │                          │                        │
  │                          │    余额: 10000         │
  │                          │◄───────────────────────│
  │                          │    ✓ 余额 >= 1000      │
  │                          │                        │
  │                          │ 3. 检查金额            │
  │                          │    ✓ value >= required │
  │                          │                        │
  │                          │ 4. 检查时间窗口         │
  │                          │    ✓ 当前时间在有效期内  │
  │                          │                        │
  │                          │ 5. 检查收款地址         │
  │                          │    ✓ to == payTo       │
  │                          │                        │
  │                          │ 6. 模拟交易            │
  │                          │    simulate            │
  │                          │    transferWithAuth()   │
  │                          │───────────────────────►│
  │                          │                        │
  │                          │    模拟成功             │
  │                          │◄───────────────────────│
  │                          │                        │
  │  { isValid: true }       │                        │
  │◄─────────────────────────│                        │
  │                          │                        │


步骤 5️⃣: 服务器处理业务逻辑
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Resource Server
  │
  │ 验证通过！开始处理请求
  │
  │ 执行业务逻辑：
  │  - 查询天气数据
  │  - 生成报告
  │  - 准备响应
  │
  │ weatherData = {
  │   weather: "sunny",
  │   temperature: 25
  │ }


步骤 6️⃣: 服务器结算支付（上链！）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Resource Server           Facilitator           Blockchain (HashKey)
  │                          │                        │
  │  POST /settle            │                        │
  │  {                       │                        │
  │    paymentPayload,       │                        │
  │    paymentRequirements   │                        │
  │  }                       │                        │
  │─────────────────────────►│                        │
  │                          │                        │
  │                          │ 1. 准备交易            │
  │                          │    contract = USDC     │
  │                          │    method =            │
  │                          │      transferWithAuth  │
  │                          │                        │
  │                          │ 2. 发送交易            │
  │                          │    (Facilitator 签名)  │
  │                          │    (Facilitator 付 gas)│
  │                          │───────────────────────►│
  │                          │                        │
  │                          │                        │ 链上执行：
  │                          │                        │ 
  │                          │                        │ 1. 验证签名
  │                          │                        │    ✓ 恢复签名者
  │                          │                        │    ✓ 检查 nonce
  │                          │                        │    ✓ 检查时间
  │                          │                        │
  │                          │                        │ 2. 转账
  │                          │                        │    USDC: 
  │                          │                        │    0xClient
  │                          │                        │      → 0xServer
  │                          │                        │    金额: 1000
  │                          │                        │
  │                          │                        │ 3. 标记 nonce
  │                          │                        │    已使用，防重放
  │                          │                        │
  │                          │    交易成功!            │
  │                          │    txHash: 0x123...    │
  │                          │◄───────────────────────│
  │                          │                        │
  │  {                       │                        │
  │    success: true,        │                        │
  │    transaction: "0x123", │                        │
  │    network: "hashkey"    │                        │
  │  }                       │                        │
  │◄─────────────────────────│                        │
  │                          │                        │


步骤 7️⃣: 服务器返回响应
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Resource Server             Client
  │                          │
  │  200 OK                  │
  │  X-PAYMENT-RESPONSE:     │
  │    eyJ0cmFuc2FjdGlvbiI6  │
  │                          │
  │  Body:                   │
  │  {                       │
  │    weather: "sunny",     │
  │    temperature: 25       │
  │  }                       │
  │─────────────────────────►│
  │                          │
  │                          │ 1. 收到数据
  │                          │ 2. 解码 X-PAYMENT-RESPONSE
  │                          │ 3. 获取交易哈希
  │                          │ 4. 可以在区块浏览器查看
```

---

## EIP-3009 原理

### 为什么需要 EIP-3009？

**传统 ERC-20 转账的问题**：
```solidity
// 传统方式需要两步：
1. approve(spender, amount)    // 用户发交易，需要 gas
2. transferFrom(from, to, amt) // 第三方发交易，需要 gas

// 问题：
- 用户必须持有 ETH 支付 gas
- 需要两笔交易
- 用户体验差
```

**EIP-3009 的解决方案**：
```solidity
// 一步完成，用户不需要 gas：
transferWithAuthorization(
  from,          // 付款人
  to,            // 收款人
  value,         // 金额
  validAfter,    // 有效期开始
  validBefore,   // 有效期结束
  nonce,         // 随机数（防重放）
  v, r, s        // EIP-712 签名
)

// 优势：
✓ 用户只需签名（不发交易）
✓ 第三方（Facilitator）代为提交
✓ 用户不需要 ETH/gas
✓ 一笔交易完成
```

### EIP-3009 签名过程

```javascript
// 1. 定义 EIP-712 Domain
const domain = {
  name: "USDC",
  version: "2",
  chainId: 133,  // HashKey Testnet
  verifyingContract: "0xUSDCAddress"
};

// 2. 定义消息类型
const types = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" }
  ]
};

// 3. 准备消息
const message = {
  from: "0xClientAddress",
  to: "0xServerAddress",
  value: "1000",
  validAfter: Math.floor(Date.now() / 1000),
  validBefore: Math.floor(Date.now() / 1000) + 60,
  nonce: crypto.randomBytes(32)
};

// 4. 签名
const signature = await wallet._signTypedData(domain, types, message);
// 得到: "0x2d6a7588..."
```

### 链上验证

```solidity
contract USDC {
    // 存储已使用的 nonce
    mapping(address => mapping(bytes32 => bool)) public authorizationState;
    
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        // 1. 检查时间窗口
        require(block.timestamp > validAfter, "未到有效期");
        require(block.timestamp < validBefore, "已过有效期");
        
        // 2. 检查 nonce 是否已使用
        require(!authorizationState[from][nonce], "授权已使用");
        
        // 3. 恢复签名者地址
        bytes32 digest = keccak256(abi.encodePacked(
            "\x19\x01",
            DOMAIN_SEPARATOR,
            keccak256(abi.encode(
                TRANSFER_WITH_AUTHORIZATION_TYPEHASH,
                from, to, value, validAfter, validBefore, nonce
            ))
        ));
        address recoveredAddress = ecrecover(digest, v, r, s);
        
        // 4. 验证签名者是付款人
        require(recoveredAddress == from, "签名无效");
        
        // 5. 标记 nonce 已使用
        authorizationState[from][nonce] = true;
        
        // 6. 执行转账
        _transfer(from, to, value);
        
        emit AuthorizationUsed(from, nonce);
    }
}
```

---

## 实际代码流程

### 客户端代码（TypeScript）

```typescript
import axios from "axios";
import { withPaymentInterceptor, createSigner } from "x402-axios";

// 1. 创建签名器
const signer = await createSigner("hashkey-testnet", privateKey);

// 2. 创建带支付拦截器的 axios 实例
const api = withPaymentInterceptor(
  axios.create({ baseURL: "http://localhost:4021" }),
  signer
);

// 3. 发送请求 - 拦截器自动处理支付！
try {
  // 第一次请求 - 会收到 402
  // 拦截器自动：
  //   - 创建签名
  //   - 重试请求并带上 X-PAYMENT 头
  const response = await api.get("/weather");
  
  console.log("天气数据:", response.data);
  
  // 4. 获取交易信息
  const paymentResponse = decodeXPaymentResponse(
    response.headers["x-payment-response"]
  );
  console.log("交易哈希:", paymentResponse.transaction);
  
} catch (error) {
  console.error("请求失败:", error);
}
```

**拦截器内部流程**：

```typescript
// x402-axios 内部实现
axios.interceptors.response.use(
  response => response,
  async error => {
    // 检查是否是 402 响应
    if (error.response?.status === 402) {
      const paymentRequirements = error.response.data.accepts[0];
      
      // 创建支付头
      const paymentHeader = await createPaymentHeader(
        signer,
        1,  // x402Version
        paymentRequirements
      );
      
      // 重试请求，带上支付头
      return axios({
        ...error.config,
        headers: {
          ...error.config.headers,
          'X-PAYMENT': paymentHeader
        }
      });
    }
    throw error;
  }
);
```

### 服务器代码（Express）

```typescript
import express from "express";
import { paymentMiddleware } from "x402-express";

const app = express();

// 应用支付中间件
app.use(
  paymentMiddleware(
    "0xYourAddress",  // 收款地址
    {
      "GET /weather": {
        price: "$0.001",
        network: "hashkey-testnet",
      }
    },
    {
      url: "http://localhost:3000"  // Facilitator URL
    }
  )
);

// 定义路由
app.get("/weather", (req, res) => {
  // 中间件已经验证和结算了支付
  // 这里直接返回数据
  res.json({
    weather: "sunny",
    temperature: 25
  });
});
```

**中间件内部流程**：

```typescript
// x402-express 内部实现
async function paymentMiddleware(req, res, next) {
  // 1. 检查是否有支付头
  const paymentHeader = req.headers['x-payment'];
  
  if (!paymentHeader) {
    // 返回 402 和支付要求
    return res.status(402).json({
      x402Version: 1,
      accepts: [paymentRequirements],
      error: "Payment required"
    });
  }
  
  // 2. 解码支付头
  const payload = JSON.parse(base64Decode(paymentHeader));
  
  // 3. 验证支付
  const facilitator = new FacilitatorClient({ url: facilitatorUrl });
  const verifyResult = await facilitator.verify(payload, paymentRequirements);
  
  if (!verifyResult.isValid) {
    return res.status(402).json({
      x402Version: 1,
      accepts: [paymentRequirements],
      error: verifyResult.invalidReason
    });
  }
  
  // 4. 处理请求
  await next();
  
  // 5. 结算支付
  const settleResult = await facilitator.settle(payload, paymentRequirements);
  
  // 6. 添加支付响应头
  res.setHeader('X-PAYMENT-RESPONSE', 
    base64Encode(JSON.stringify(settleResult))
  );
}
```

---

## 问题与解答

### Q1: 客户端签名后，钱会立即转走吗？

**A**: 不会！客户端只是**签名授权**，并没有发送交易。

流程：
1. 客户端签名 ✍️（本地，不上链）
2. 发送签名给服务器 📤
3. 服务器验证签名 ✅
4. 服务器提供服务 🎁
5. **然后**服务器通过 Facilitator 提交交易 ⛓️
6. 链上才真正转账 💸

### Q2: Facilitator 会不会拿走我的钱？

**A**: 不会！因为：

1. **签名限制了参数**：
   ```javascript
   signature = sign({
     from: "0xClient",    // 只能从客户端地址
     to: "0xServer",      // 只能转到服务器地址
     value: "1000",       // 只能转这么多
     nonce: "0xrandom"    // 这个 nonce 只能用一次
   })
   ```

2. **链上验证**：
   - 智能合约会验证签名
   - 确保转账符合签名的参数
   - Facilitator 无法修改任何参数

3. **Facilitator 只是代发交易**：
   - 就像你写了一张支票
   - Facilitator 只是帮你投递
   - 但支票金额、收款人都是你写死的

### Q3: 如果 Facilitator 不结算怎么办？

**A**: 你有几个选项：

1. **服务器不提供服务**：
   - 服务器在结算成功后才返回数据
   - 如果 Facilitator 不结算，客户端收不到数据

2. **签名有时间限制**：
   ```javascript
   validBefore: now + 60 seconds
   ```
   - 60 秒后签名失效
   - 客户端的钱不会被锁定

3. **客户端可以重试**：
   - 用新的 nonce 重新签名
   - 尝试另一个 Facilitator

### Q4: 为什么需要 Facilitator？服务器直接提交交易不行吗？

**A**: 可以，但 Facilitator 提供了更好的架构：

**没有 Facilitator**：
```
服务器需要：
❌ 管理钱包和私钥（安全风险）
❌ 持有 ETH/HSK 支付 gas
❌ 运行区块链节点或 RPC
❌ 处理交易失败、重试
❌ 监控链上状态
```

**有 Facilitator**：
```
服务器只需要：
✅ 调用 HTTP API (verify/settle)
✅ 专注业务逻辑
✅ 不需要管理密钥
✅ 不需要持有 gas
✅ 不需要懂区块链
```

### Q5: 整个流程哪些步骤是链上的？

**A**: 只有最后一步！

```
❌ 客户端签名          - 本地，不上链
❌ 发送签名到服务器    - HTTP，不上链
❌ 服务器验证签名      - Facilitator 通过 RPC 查询，但不发交易
❌ 服务器处理业务      - 本地，不上链
✅ Facilitator 结算    - 发送交易到链上！⛓️
```

**链上只有一笔交易**：
```solidity
USDC.transferWithAuthorization(
  from, to, value, validAfter, validBefore, nonce, v, r, s
)
```

### Q6: Gas 费用多少？谁支付？

**A**: 

**Gas 费用**：
- 一次 `transferWithAuthorization` 调用
- 大约 80,000 - 120,000 gas
- 在 HashKey Chain 上，Gas 费应该很便宜

**谁支付**：
- **Facilitator** 支付！
- 客户端不需要持有 HSK
- 服务器也不需要持有 HSK
- 这就是 "Gasless" 的含义

**Facilitator 怎么盈利**：
- 可以收取服务费（从 USDC 支付中抽成）
- 或者作为基础设施免费提供
- Coinbase 的 Facilitator 是免费的（测试网）

---

## 总结

### 核心流程（7 步）

1. **客户端请求** → 收到 402 和支付要求
2. **客户端签名** → 创建 EIP-712 签名（本地，不上链）
3. **客户端重试** → 带 X-PAYMENT 头重新请求
4. **服务器验证** → 通过 Facilitator 验证签名和余额
5. **服务器处理** → 执行业务逻辑
6. **Facilitator 结算** → 提交交易到区块链（唯一的链上操作）
7. **服务器响应** → 返回数据和交易哈希

### 关键点

✅ **只有一笔链上交易** - 高效
✅ **客户端无需 gas** - 用户友好  
✅ **服务器无需钱包** - 架构简单
✅ **签名限制参数** - 安全可靠
✅ **Facilitator 可替换** - 去中心化

### 下一步

阅读 [EIP-3009 USDC 部署指南](./DEPLOY_EIP3009_USDC.md) 了解如何在 HashKey Chain 上部署合约。

---

**创建时间**: 2025-10-24

