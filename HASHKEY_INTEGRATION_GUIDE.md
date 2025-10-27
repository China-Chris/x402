# 在 HashKey Chain 上使用 x402

本指南将帮助你在 HashKey Chain 上集成 x402 支付协议。

## 📋 目录
1. [HashKey Chain 信息](#hashkey-chain-信息)
2. [前置条件](#前置条件)
3. [快速开始](#快速开始)
4. [添加 HashKey 网络支持](#添加-hashkey-网络支持)
5. [完整示例](#完整示例)
6. [部署 Facilitator](#部署-facilitator)
7. [常见问题](#常见问题)

---

## HashKey Chain 信息

### HashKey Chain 网络参数

| 网络 | Chain ID | RPC URL | 区块浏览器 |
|------|----------|---------|-----------|
| **HSK Mainnet** | 177 | https://mainnet.hashkeychain.io | https://hashkeyscan.io |
| **HSK Testnet** | 133 | https://testnet.hashkeychain.io | https://testnet.hashkeyscan.io |

### USDC 合约地址（需要确认）

⚠️ **重要**: HashKey Chain 需要部署支持 **EIP-3009** 的 USDC 合约才能使用 x402。

如果 HashKey Chain 还没有 EIP-3009 兼容的 USDC：
1. 可以部署自己的 EIP-3009 兼容代币
2. 或者使用其他支持 EIP-3009 的代币

---

## 前置条件

### 1. 安装依赖

```bash
# TypeScript 项目
cd examples/typescript
pnpm install

# Python 项目
cd python/x402
pip install -e .
```

### 2. 准备环境

- ✅ HashKey Chain 账户地址（收款用）
- ✅ 私钥（支付用）
- ✅ HashKey Chain 原生代币（支付 gas 费）
- ✅ EIP-3009 兼容的 USDC 或其他代币

---

## 快速开始

### 方案 A：使用现有网络配置（推荐）

如果你只是想快速测试，可以先在已支持的网络（如 Base Sepolia）上测试：

```bash
# 1. 启动测试 Facilitator
cd examples/typescript/facilitator
cp .env.example .env
# 编辑 .env，填入你的私钥
pnpm dev

# 2. 启动服务器
cd ../servers/express
cp .env.example .env
# 编辑 .env
pnpm dev

# 3. 测试客户端
cd ../clients/axios
cp .env.example .env
# 编辑 .env
pnpm dev
```

### 方案 B：添加 HashKey 网络支持

如果你要在 HashKey Chain 上使用，需要修改代码添加网络支持。

---

## 添加 HashKey 网络支持

### 步骤 1: 修改 TypeScript 网络配置

编辑 `typescript/packages/x402/src/types/shared/network.ts`:

```typescript
export const NetworkSchema = z.enum([
  "base-sepolia",
  "base",
  "avalanche-fuji",
  "avalanche",
  "iotex",
  "solana-devnet",
  "solana",
  "sei",
  "sei-testnet",
  "polygon",
  "polygon-amoy",
  "peaq",
  // ⭐ 添加 HashKey
  "hashkey",
  "hashkey-testnet",
]);

export const SupportedEVMNetworks: Network[] = [
  "base-sepolia",
  "base",
  "avalanche-fuji",
  "avalanche",
  "iotex",
  "sei",
  "sei-testnet",
  "polygon",
  "polygon-amoy",
  "peaq",
  // ⭐ 添加 HashKey
  "hashkey",
  "hashkey-testnet",
];

export const EvmNetworkToChainId = new Map<Network, number>([
  ["base-sepolia", 84532],
  ["base", 8453],
  ["avalanche-fuji", 43113],
  ["avalanche", 43114],
  ["iotex", 4689],
  ["sei", 1329],
  ["sei-testnet", 1328],
  ["polygon", 137],
  ["polygon-amoy", 80002],
  ["peaq", 3338],
  // ⭐ 添加 HashKey
  ["hashkey", 177],
  ["hashkey-testnet", 133],
]);
```

### 步骤 2: 添加 HashKey Chain 对象

编辑 `typescript/packages/x402/src/types/shared/evm/wallet.ts`:

首先在文件顶部导入或定义 HashKey Chain：

```typescript
import { defineChain } from "viem";

// 定义 HashKey Chain
const hashkey = defineChain({
  id: 177,
  name: 'HashKey Chain',
  network: 'hashkey',
  nativeCurrency: {
    decimals: 18,
    name: 'HSK',
    symbol: 'HSK',
  },
  rpcUrls: {
    default: {
      http: ['https://mainnet.hashkeychain.io'],
    },
    public: {
      http: ['https://mainnet.hashkeychain.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'HashKey Chain Explorer',
      url: 'https://hashkeyscan.io',
    },
  },
});

const hashkeyTestnet = defineChain({
  id: 133,
  name: 'HashKey Chain Testnet',
  network: 'hashkey-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'HSK',
    symbol: 'HSK',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.hashkeychain.io'],
    },
    public: {
      http: ['https://testnet.hashkeychain.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'HashKey Chain Testnet Explorer',
      url: 'https://testnet.hashkeyscan.io',
    },
  },
  testnet: true,
});
```

然后在 `getChainFromNetwork` 函数中添加：

```typescript
export function getChainFromNetwork(network: string | undefined): Chain {
  if (!network) {
    throw new Error("NETWORK environment variable is not set");
  }

  switch (network) {
    case "base":
      return base;
    case "base-sepolia":
      return baseSepolia;
    case "avalanche":
      return avalanche;
    case "avalanche-fuji":
      return avalancheFuji;
    case "sei":
      return sei;
    case "sei-testnet":
      return seiTestnet;
    case "polygon":
      return polygon;
    case "polygon-amoy":
      return polygonAmoy;
    case "peaq":
      return peaq;
    case "iotex":
      return iotex;
    // ⭐ 添加 HashKey
    case "hashkey":
      return hashkey;
    case "hashkey-testnet":
      return hashkeyTestnet;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}
```

### 步骤 3: 修改 Python 网络配置

编辑 `python/x402/src/x402/networks.py`:

```python
from typing import Literal

SupportedNetworks = Literal[
    "base", 
    "base-sepolia", 
    "avalanche-fuji", 
    "avalanche",
    "hashkey",  # ⭐ 添加
    "hashkey-testnet",  # ⭐ 添加
]

EVM_NETWORK_TO_CHAIN_ID = {
    "base-sepolia": 84532,
    "base": 8453,
    "avalanche-fuji": 43113,
    "avalanche": 43114,
    "hashkey": 177,  # ⭐ 添加
    "hashkey-testnet": 133,  # ⭐ 添加
}
```

编辑 `python/x402/src/x402/chains.py`:

```python
NETWORK_TO_ID = {
    "base-sepolia": "84532",
    "base": "8453",
    "avalanche-fuji": "43113",
    "avalanche": "43114",
    "hashkey": "177",  # ⭐ 添加
    "hashkey-testnet": "133",  # ⭐ 添加
}

KNOWN_TOKENS = {
    "84532": [
        {
            "human_name": "usdc",
            "address": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
            "decimals": 6,
            "name": "USDC",
            "version": "2",
        }
    ],
    # ⭐ 添加 HashKey 测试网 USDC（需要实际部署后填写）
    "133": [
        {
            "human_name": "usdc",
            "address": "0xYourUSDCContractAddress",  # 需要替换
            "decimals": 6,
            "name": "USDC",
            "version": "2",
        }
    ],
    # ⭐ 添加 HashKey 主网 USDC（需要实际部署后填写）
    "177": [
        {
            "human_name": "usdc",
            "address": "0xYourUSDCContractAddress",  # 需要替换
            "decimals": 6,
            "name": "USDC",
            "version": "2",
        }
    ],
}
```

### 步骤 4: 重新构建项目

```bash
# TypeScript
cd typescript
pnpm install
pnpm build

# Python
cd python/x402
pip install -e .
```

---

## 完整示例

### 服务器端 (Express.js)

```typescript
import express from "express";
import { paymentMiddleware } from "x402-express";

const app = express();

app.use(
  paymentMiddleware(
    "0xYourHashKeyAddress",  // 你的 HashKey 地址
    {
      "GET /weather": {
        price: "$0.001",
        network: "hashkey-testnet",  // 使用 HashKey 测试网
      },
      "GET /premium": {
        price: "$0.01",
        network: "hashkey",  // 使用 HashKey 主网
      },
    },
    {
      url: "http://localhost:3000",  // 你的 Facilitator URL
    }
  )
);

app.get("/weather", (req, res) => {
  res.json({ weather: "sunny", temperature: 25 });
});

app.listen(4021, () => {
  console.log("Server running on http://localhost:4021");
});
```

### 服务器端 (FastAPI)

```python
from fastapi import FastAPI
from x402.fastapi.middleware import require_payment

app = FastAPI()

app.middleware("http")(
    require_payment(
        path="/weather",
        price="$0.001",
        pay_to_address="0xYourHashKeyAddress",
        network="hashkey-testnet",  # 使用 HashKey 测试网
        facilitator_config={"url": "http://localhost:3000"}
    )
)

@app.get("/weather")
async def get_weather():
    return {"weather": "sunny", "temperature": 25}
```

### 客户端 (Axios)

```typescript
import axios from "axios";
import { withPaymentInterceptor, createSigner } from "x402-axios";

const signer = await createSigner("hashkey-testnet", "0xYourPrivateKey");

const api = withPaymentInterceptor(
  axios.create({ baseURL: "http://localhost:4021" }),
  signer
);

const response = await api.get("/weather");
console.log(response.data);
```

### 客户端 (Python)

```python
from x402.clients.httpx import PaymentClient

client = PaymentClient(
    private_key="0xYourPrivateKey",
    network="hashkey-testnet",
)

response = await client.get("http://localhost:4021/weather")
print(response.json())
```

---

## 部署 Facilitator

### 为 HashKey Chain 部署 Facilitator

```bash
cd examples/typescript/facilitator

# 创建 .env 文件
cat > .env << EOF
EVM_PRIVATE_KEY=0xYourHashKeyPrivateKey
PORT=3000
EOF

# 启动 Facilitator
pnpm install
pnpm dev
```

Facilitator 需要：
- ✅ HashKey Chain 上的 ETH/HSK（支付 gas）
- ✅ 能够调用 EIP-3009 合约

---

## 常见问题

### Q1: HashKey Chain 是否支持 EIP-3009？

**A:** 需要确认 HashKey Chain 上是否有 EIP-3009 兼容的 USDC 合约。

检查步骤：
1. 访问 [HashKey Chain Explorer](https://hashkeyscan.io)
2. 搜索 USDC 合约地址
3. 检查合约是否实现了 `transferWithAuthorization` 方法

### Q2: 如果没有 EIP-3009 USDC 怎么办？

**A:** 你有两个选择：

**选项 1: 部署自己的代币**
```solidity
// 部署支持 EIP-3009 的代币合约
// 可以使用 Circle 的 USDC 实现作为参考
```

**选项 2: 使用其他支持 EIP-3009 的代币**
```typescript
price: {
  amount: "10000",
  asset: {
    address: "0xYourEIP3009TokenAddress",
    decimals: 6,
    eip712: {
      name: "YourToken",
      version: "1",
    },
  },
}
```

### Q3: RPC URL 应该使用哪个？

**A:** HashKey Chain 的官方 RPC：
- **测试网**: `https://testnet.hashkeychain.io`
- **主网**: `https://mainnet.hashkeychain.io`

你也可以使用自己的 RPC 节点以获得更好的性能。

### Q4: 如何获取测试代币？

**A:** 
1. 访问 HashKey Chain 测试网水龙头
2. 获取测试 HSK（用于 gas）
3. 部署或铸造测试 USDC

### Q5: Gas 费用由谁支付？

**A:** Facilitator 支付 gas 费用。确保 Facilitator 的钱包有足够的 HSK。

### Q6: 可以自定义 RPC URL 吗？

**A:** 可以！在创建 Facilitator 或客户端时传入配置：

```typescript
const config = {
  rpcUrl: "https://your-custom-rpc.hashkeychain.io"
};
```

---

## 生产环境检查清单

在 HashKey Chain 主网部署前，请确认：

- [ ] ✅ 已经充分测试测试网集成
- [ ] ✅ 确认 USDC 合约地址和 EIP-3009 兼容性
- [ ] ✅ Facilitator 钱包有足够的 HSK（gas）
- [ ] ✅ 配置了监控和告警
- [ ] ✅ 实现了错误处理和重试逻辑
- [ ] ✅ 测试了各种边界情况（余额不足、签名错误等）
- [ ] ✅ 审计了智能合约和代码
- [ ] ✅ 准备了回滚计划

---

## 下一步

1. **测试集成**: 先在 HashKey 测试网上测试
2. **部署合约**: 如果需要，部署 EIP-3009 代币
3. **配置 Facilitator**: 运行自己的 Facilitator 或使用托管服务
4. **监控**: 设置日志和监控
5. **上线**: 部署到 HashKey 主网

---

## 获取帮助

- 📖 [x402 文档](https://x402.org)
- 💬 [x402 Discord](https://discord.gg/x402)
- 🐛 [提交 Issue](https://github.com/coinbase/x402/issues)
- 📧 HashKey Chain 技术支持

---

## 贡献

如果你成功在 HashKey Chain 上集成了 x402，欢迎：
1. 提交 PR 将 HashKey 添加到官方支持的网络列表
2. 分享你的经验和最佳实践
3. 帮助其他开发者集成

---

**更新时间**: 2025-10-24
**作者**: x402 社区

