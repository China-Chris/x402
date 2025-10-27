# HashKey Chain x402 快速参考

> 这是一个快速参考指南，帮助你在 HashKey Chain 上使用 x402。

## 🎯 三步走

### 步骤 1: 理解流程
📖 阅读：[X402_FLOW_EXPLAINED.md](./X402_FLOW_EXPLAINED.md)

**关键点**：
- 客户端签名授权（不上链）
- 服务器验证支付
- Facilitator 提交交易
- 只有一笔链上交易

### 步骤 2: 部署 USDC
🚀 跟随：[DEPLOY_EIP3009_USDC.md](./DEPLOY_EIP3009_USDC.md)

**快速命令**：
```bash
# 1. 创建项目
mkdir hashkey-usdc && cd hashkey-usdc
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts dotenv

# 2. 复制合约代码（从文档中）
# 3. 配置 hardhat.config.ts
# 4. 部署
npx hardhat run scripts/deploy.ts --network hashkey-testnet

# 5. 测试
export USDC_ADDRESS=0xYourAddress
npx hardhat run scripts/test-eip3009.ts --network hashkey-testnet
```

### 步骤 3: 集成 x402
⚙️ 参考：[HASHKEY_INTEGRATION_GUIDE.md](./HASHKEY_INTEGRATION_GUIDE.md)

**修改代码**：
1. 添加网络配置（3个文件）
2. 添加 USDC 地址（1个文件）
3. 重新构建项目
4. 运行测试

---

## 📝 HashKey Chain 信息

### 网络参数

| 参数 | 测试网 | 主网 |
|------|--------|------|
| Chain ID | 133 | 177 |
| 网络名称 | hashkey-testnet | hashkey |
| RPC URL | https://testnet.hashkeychain.io | https://mainnet.hashkeychain.io |
| 区块浏览器 | https://testnet.hashkeyscan.io | https://hashkeyscan.io |
| 原生代币 | HSK | HSK |

### 添加到 MetaMask

```javascript
{
  "chainId": "0x85",  // 133 的十六进制
  "chainName": "HashKey Chain Testnet",
  "nativeCurrency": {
    "name": "HSK",
    "symbol": "HSK",
    "decimals": 18
  },
  "rpcUrls": ["https://testnet.hashkeychain.io"],
  "blockExplorerUrls": ["https://testnet.hashkeyscan.io"]
}
```

---

## 🔧 关键配置文件

### 1. TypeScript 网络配置

**文件**: `typescript/packages/x402/src/types/shared/network.ts`

```typescript
export const NetworkSchema = z.enum([
  // ... 其他网络
  "hashkey",
  "hashkey-testnet",
]);

export const SupportedEVMNetworks: Network[] = [
  // ... 其他网络
  "hashkey",
  "hashkey-testnet",
];

export const EvmNetworkToChainId = new Map<Network, number>([
  // ... 其他网络
  ["hashkey", 177],
  ["hashkey-testnet", 133],
]);
```

### 2. TypeScript Chain 定义

**文件**: `typescript/packages/x402/src/types/shared/evm/wallet.ts`

```typescript
import { defineChain } from "viem";

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
    default: { http: ['https://testnet.hashkeychain.io'] },
    public: { http: ['https://testnet.hashkeychain.io'] },
  },
  blockExplorers: {
    default: {
      name: 'HashKeyScan',
      url: 'https://testnet.hashkeyscan.io',
    },
  },
  testnet: true,
});

// 在 getChainFromNetwork 函数中添加
case "hashkey-testnet":
  return hashkeyTestnet;
```

### 3. Python 网络配置

**文件**: `python/x402/src/x402/networks.py`

```python
SupportedNetworks = Literal[
    "base", "base-sepolia", "avalanche-fuji", "avalanche",
    "hashkey", "hashkey-testnet",
]

EVM_NETWORK_TO_CHAIN_ID = {
    "base-sepolia": 84532,
    "base": 8453,
    "avalanche-fuji": 43113,
    "avalanche": 43114,
    "hashkey": 177,
    "hashkey-testnet": 133,
}
```

### 4. Python USDC 配置

**文件**: `python/x402/src/x402/chains.py`

```python
NETWORK_TO_ID = {
    # ... 其他网络
    "hashkey": "177",
    "hashkey-testnet": "133",
}

KNOWN_TOKENS = {
    # ... 其他网络
    "133": [  # HashKey Testnet
        {
            "human_name": "usdc",
            "address": "0xYourDeployedUSDCAddress",
            "decimals": 6,
            "name": "USDC",
            "version": "2",
        }
    ],
}
```

---

## 💻 使用示例

### 服务器 (Express)

```typescript
import { paymentMiddleware } from "x402-express";

app.use(
  paymentMiddleware(
    "0xYourAddress",
    {
      "/weather": {
        price: "$0.001",
        network: "hashkey-testnet",
      }
    }
  )
);
```

### 服务器 (FastAPI)

```python
from x402.fastapi.middleware import require_payment

app.middleware("http")(
    require_payment(
        path="/weather",
        price="$0.001",
        pay_to_address="0xYourAddress",
        network="hashkey-testnet",
    )
)
```

### 客户端 (TypeScript)

```typescript
import { withPaymentInterceptor, createSigner } from "x402-axios";

const signer = await createSigner("hashkey-testnet", privateKey);
const api = withPaymentInterceptor(axios.create({...}), signer);
const response = await api.get("/weather");
```

### 客户端 (Python)

```python
from x402.clients.httpx import PaymentClient

client = PaymentClient(
    private_key="0x...",
    network="hashkey-testnet",
)
response = await client.get("http://localhost:4021/weather")
```

---

## 🧪 测试命令

```bash
# 1. 安装依赖
cd examples/typescript
pnpm install && pnpm build

# 2. 启动 Facilitator (终端 1)
cd facilitator
echo "EVM_PRIVATE_KEY=0xYour..." > .env
pnpm dev

# 3. 启动服务器 (终端 2)
cd ../servers/express
# 修改代码使用 hashkey-testnet
pnpm dev

# 4. 运行客户端 (终端 3)
cd ../clients/axios
echo "PRIVATE_KEY=0xYour..." > .env
echo "RESOURCE_SERVER_URL=http://localhost:4021" >> .env
echo "ENDPOINT_PATH=/weather" >> .env
pnpm dev
```

---

## 📚 EIP-3009 核心方法

### transferWithAuthorization

```solidity
function transferWithAuthorization(
    address from,        // 付款人
    address to,          // 收款人
    uint256 value,       // 金额
    uint256 validAfter,  // 有效期开始
    uint256 validBefore, // 有效期结束
    bytes32 nonce,       // 随机数
    uint8 v,             // 签名
    bytes32 r,           // 签名
    bytes32 s            // 签名
) external;
```

### EIP-712 签名

```javascript
const domain = {
  name: "USDC",
  version: "2",
  chainId: 133,
  verifyingContract: "0xUSDCAddress"
};

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

const message = {
  from: "0xClient",
  to: "0xServer",
  value: "1000",
  validAfter: Math.floor(Date.now() / 1000),
  validBefore: Math.floor(Date.now() / 1000) + 60,
  nonce: crypto.randomBytes(32)
};

const signature = await wallet._signTypedData(domain, types, message);
```

---

## 🚨 常见问题速查

### Q: 没有测试币怎么办？
**A**: 联系 HashKey Chain 团队或寻找水龙头

### Q: 部署合约需要多少 gas？
**A**: 约 2-3M gas，根据网络 gas price 计算费用

### Q: USDC 地址在哪里？
**A**: 需要自己部署 EIP-3009 USDC 合约

### Q: 如何验证 EIP-3009 支持？
**A**: 
```bash
# 检查合约方法
cast interface 0xContractAddress transferWithAuthorization
```

### Q: Facilitator 需要多少 HSK？
**A**: 建议至少 0.1 HSK，用于支付 gas

### Q: 如何查看交易？
**A**: 访问 https://testnet.hashkeyscan.io/tx/0xTxHash

---

## 📖 完整文档

1. **[X402_FLOW_EXPLAINED.md](./X402_FLOW_EXPLAINED.md)**
   - 完整流程图解
   - EIP-3009 原理
   - 代码流程详解

2. **[DEPLOY_EIP3009_USDC.md](./DEPLOY_EIP3009_USDC.md)**
   - 完整合约代码
   - 部署脚本
   - 测试脚本

3. **[HASHKEY_INTEGRATION_GUIDE.md](./HASHKEY_INTEGRATION_GUIDE.md)**
   - 详细集成步骤
   - 生产环境检查清单
   - 故障排查

4. **[CODE_UNDERSTANDING.md](./CODE_UNDERSTANDING.md)**
   - x402 架构解析
   - 核心概念
   - 使用示例

---

## ✅ 检查清单

### 部署前
- [ ] 了解 x402 工作流程
- [ ] 准备部署账户和 HSK
- [ ] 准备好合约代码
- [ ] 配置好 Hardhat

### 部署后
- [ ] 合约部署成功
- [ ] 测试 transferWithAuthorization
- [ ] 铸造测试代币
- [ ] 更新 x402 配置

### 集成前
- [ ] 修改网络配置
- [ ] 添加 USDC 地址
- [ ] 重新构建项目
- [ ] 运行本地测试

### 生产前
- [ ] 在测试网充分测试
- [ ] 部署生产合约
- [ ] 配置监控
- [ ] 准备应急方案

---

## 🎓 学习路径

### 初学者
1. 阅读 [X402_FLOW_EXPLAINED.md](./X402_FLOW_EXPLAINED.md)
2. 在 Base Sepolia 上测试（已有 USDC）
3. 理解完整流程

### 中级
1. 部署 EIP-3009 USDC 到 HashKey 测试网
2. 修改 x402 配置
3. 运行完整测试

### 高级
1. 自定义 Facilitator
2. 优化 gas 使用
3. 添加监控和日志
4. 部署到生产环境

---

## 🔗 有用链接

- **HashKey Chain 官网**: https://hashkeychain.io
- **HashKey 区块浏览器**: https://testnet.hashkeyscan.io
- **x402 官网**: https://x402.org
- **x402 GitHub**: https://github.com/coinbase/x402
- **EIP-3009 规范**: https://eips.ethereum.org/EIPS/eip-3009

---

## 🤝 获取帮助

1. **查看文档** - 详细指南在上面
2. **GitHub Issues** - https://github.com/coinbase/x402/issues
3. **HashKey 支持** - 联系 HashKey Chain 团队

---

**更新时间**: 2025-10-24
**版本**: 1.0

祝你在 HashKey Chain 上使用 x402 顺利！🚀

