# 🚀 在 HashKey Chain 上使用 x402 - 快速指南

## ⚡ 最快上手方式

你有两个选择：

### 选项 A: 先在支持的网络上测试（推荐新手）

```bash
# 1. 启动 Facilitator
cd examples/typescript/facilitator
echo "EVM_PRIVATE_KEY=0xYour..." > .env
pnpm install && pnpm dev

# 2. 启动服务器（新终端）
cd examples/typescript/servers/express
echo "ADDRESS=0xYour..." > .env
echo "FACILITATOR_URL=http://localhost:3000" >> .env
pnpm dev

# 3. 运行客户端（新终端）
cd examples/typescript/clients/axios
echo "PRIVATE_KEY=0xYour..." > .env
echo "RESOURCE_SERVER_URL=http://localhost:4021" >> .env
echo "ENDPOINT_PATH=/weather" >> .env
pnpm dev
```

### 选项 B: 直接添加 HashKey 支持（需要修改代码）

## 📝 添加 HashKey Chain 支持的步骤

### 步骤 1: 修改网络配置（TypeScript）

编辑文件：`typescript/packages/x402/src/types/shared/network.ts`

```typescript
export const NetworkSchema = z.enum([
  "base-sepolia",
  "base",
  // ... 其他网络
  "hashkey",           // ⭐ 添加这行
  "hashkey-testnet",   // ⭐ 添加这行
]);

export const SupportedEVMNetworks: Network[] = [
  "base-sepolia",
  "base",
  // ... 其他网络
  "hashkey",           // ⭐ 添加这行
  "hashkey-testnet",   // ⭐ 添加这行
];

export const EvmNetworkToChainId = new Map<Network, number>([
  ["base-sepolia", 84532],
  ["base", 8453],
  // ... 其他网络
  ["hashkey", 177],           // ⭐ 添加这行
  ["hashkey-testnet", 133],   // ⭐ 添加这行
]);
```

### 步骤 2: 添加 Chain 定义

编辑文件：`typescript/packages/x402/src/types/shared/evm/wallet.ts`

在文件顶部添加：

```typescript
import { defineChain } from "viem";

// ⭐ 添加 HashKey Chain 定义
const hashkey = defineChain({
  id: 177,
  name: 'HashKey Chain',
  network: 'hashkey',
  nativeCurrency: { decimals: 18, name: 'HSK', symbol: 'HSK' },
  rpcUrls: {
    default: { http: ['https://mainnet.hashkeychain.io'] },
    public: { http: ['https://mainnet.hashkeychain.io'] },
  },
  blockExplorers: {
    default: { name: 'HashKeyScan', url: 'https://hashkeyscan.io' },
  },
});

const hashkeyTestnet = defineChain({
  id: 133,
  name: 'HashKey Chain Testnet',
  network: 'hashkey-testnet',
  nativeCurrency: { decimals: 18, name: 'HSK', symbol: 'HSK' },
  rpcUrls: {
    default: { http: ['https://testnet.hashkeychain.io'] },
    public: { http: ['https://testnet.hashkeychain.io'] },
  },
  blockExplorers: {
    default: { name: 'HashKeyScan', url: 'https://testnet.hashkeyscan.io' },
  },
  testnet: true,
});
```

在 `getChainFromNetwork` 函数中添加：

```typescript
export function getChainFromNetwork(network: string | undefined): Chain {
  switch (network) {
    case "base": return base;
    case "base-sepolia": return baseSepolia;
    // ... 其他网络
    case "hashkey": return hashkey;              // ⭐ 添加
    case "hashkey-testnet": return hashkeyTestnet; // ⭐ 添加
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}
```

### 步骤 3: 修改 Python 配置

编辑文件：`python/x402/src/x402/networks.py`

```python
SupportedNetworks = Literal[
    "base", 
    "base-sepolia", 
    "avalanche-fuji", 
    "avalanche",
    "hashkey",          # ⭐ 添加
    "hashkey-testnet",  # ⭐ 添加
]

EVM_NETWORK_TO_CHAIN_ID = {
    "base-sepolia": 84532,
    "base": 8453,
    "avalanche-fuji": 43113,
    "avalanche": 43114,
    "hashkey": 177,          # ⭐ 添加
    "hashkey-testnet": 133,  # ⭐ 添加
}
```

### 步骤 4: 配置 USDC 合约

编辑文件：`python/x402/src/x402/chains.py`

```python
KNOWN_TOKENS = {
    "84532": [...],  # base-sepolia
    # ⭐ 添加 HashKey 测试网
    "133": [
        {
            "human_name": "usdc",
            "address": "0xYourUSDCAddress",  # 需要确认实际地址
            "decimals": 6,
            "name": "USDC",
            "version": "2",
        }
    ],
    # ⭐ 添加 HashKey 主网
    "177": [
        {
            "human_name": "usdc",
            "address": "0xYourUSDCAddress",  # 需要确认实际地址
            "decimals": 6,
            "name": "USDC",
            "version": "2",
        }
    ],
}
```

### 步骤 5: 重新构建

```bash
# TypeScript
cd typescript
pnpm install
pnpm build

# Python
cd python/x402
pip install -e .
```

## 🎯 使用 HashKey Chain

修改完成后，就可以使用了：

### 服务器端

```typescript
// Express.js
app.use(
  paymentMiddleware(
    "0xYourAddress",
    {
      "/weather": {
        price: "$0.001",
        network: "hashkey-testnet",  // ⭐ 使用 HashKey
      }
    }
  )
);
```

```python
# FastAPI
app.middleware("http")(
    require_payment(
        path="/weather",
        price="$0.001",
        pay_to_address="0xYourAddress",
        network="hashkey-testnet",  # ⭐ 使用 HashKey
    )
)
```

### 客户端

```typescript
// TypeScript
const signer = await createSigner("hashkey-testnet", privateKey);
const api = withPaymentInterceptor(axios.create({...}), signer);
```

```python
# Python
client = PaymentClient(
    private_key="0x...",
    network="hashkey-testnet",
)
```

## ⚠️ 重要提示

### 1. USDC 合约地址

你需要确认 HashKey Chain 上 **EIP-3009 兼容**的 USDC 地址。

**检查方式**：
```bash
# 访问区块浏览器
https://testnet.hashkeyscan.io

# 搜索 USDC 合约
# 检查是否有 transferWithAuthorization 方法
```

**如果没有 EIP-3009 USDC**：
- 可以部署自己的 EIP-3009 兼容代币
- 或使用其他支持的代币

### 2. Facilitator 需要 HSK

运行 Facilitator 需要：
- ✅ HashKey Chain 账户
- ✅ HSK 代币（支付 gas）

获取测试 HSK：
```
访问 HashKey Chain 测试网水龙头
[需要找到官方水龙头链接]
```

### 3. 网络信息

| 网络 | Chain ID | RPC | 浏览器 |
|------|----------|-----|--------|
| 测试网 | 133 | https://testnet.hashkeychain.io | https://testnet.hashkeyscan.io |
| 主网 | 177 | https://mainnet.hashkeychain.io | https://hashkeyscan.io |

## 📦 完整示例文件

我已经为你创建了完整的文件：

1. **HASHKEY_INTEGRATION_GUIDE.md** - 完整集成指南
2. **examples/typescript/hashkey-quickstart/** - 快速启动示例
   - README.md - 使用说明
   - package.json - 依赖配置
   - .env.example - 环境变量模板

## 🔧 故障排查

### 问题：找不到 USDC 合约

**解决方案**：
1. 联系 HashKey Chain 团队确认 USDC 地址
2. 或部署你自己的 EIP-3009 代币

### 问题：交易失败

**可能原因**：
- Gas 不足
- USDC 余额不足
- 签名错误

**检查**：
```bash
# 查看 Facilitator 余额
https://testnet.hashkeyscan.io/address/0xFacilitatorAddress

# 查看客户端 USDC 余额
https://testnet.hashkeyscan.io/token/0xUSDCAddress?a=0xClientAddress
```

## 📚 相关文档

- [完整集成指南](./HASHKEY_INTEGRATION_GUIDE.md) - 详细步骤
- [代码理解文档](./CODE_UNDERSTANDING.md) - 理解架构
- [x402 规范](./specs/x402-specification.md) - 协议详情

## 🤝 需要帮助？

1. 查看 [HASHKEY_INTEGRATION_GUIDE.md](./HASHKEY_INTEGRATION_GUIDE.md)
2. 在 GitHub Issues 提问
3. 加入 x402 Discord 社区

---

## ✅ 快速检查清单

开始前确认：

- [ ] 了解 HashKey Chain 的 Chain ID (177/133)
- [ ] 确认 USDC 合约地址和 EIP-3009 支持
- [ ] 有 HSK 代币（用于 gas）
- [ ] 修改了网络配置文件
- [ ] 重新构建了项目
- [ ] 在测试网上测试

---

**祝你在 HashKey Chain 上使用 x402 顺利！** 🚀

如有问题，随时查看详细文档或提问。

