# 🚀 立即部署到 HashKey Chain

## 快速开始 - 3 步完成

### 📦 步骤 1: 安装依赖

```bash
cd hashkey-deployment
npm install
```

### 🔑 步骤 2: 配置私钥

```bash
# 方式 A: 使用命令行
echo "DEPLOYER_PRIVATE_KEY=0xYourPrivateKeyHere" > .env

# 方式 B: 复制模板并编辑
cp .env.example .env
nano .env
```

⚠️ **重要**: 
- 私钥格式: `0x...` (66个字符)
- 账户需要有 HSK 代币（支付 gas）
- 不要将 `.env` 提交到 git

### 🚀 步骤 3: 部署

```bash
npm run deploy
```

**就这么简单！** 🎉

---

## 📋 完整流程

```bash
# 1. 进入部署目录
cd hashkey-deployment

# 2. 安装依赖
npm install

# 3. 配置私钥
echo "DEPLOYER_PRIVATE_KEY=0xYour..." > .env

# 4. 检查余额（确保有 HSK）
npm run balance

# 5. 部署合约
npm run deploy

# 6. 测试功能
export USDC_ADDRESS=0xYourDeployedAddress  # 从部署输出获取
npm run test

# 7. 铸造测试代币
npm run mint
```

---

## ✅ 预期输出

### 部署成功

```
🚀 HashKey Chain - EIP-3009 USDC 部署
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 网络信息:
  网络名称: hashkey-testnet
  Chain ID: 133
  部署账户: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
  账户余额: 1.5 HSK

💵 代币参数:
  名称: USD Coin
  符号: USDC
  精度: 6
  初始供应: 1000000 USDC

⏳ 正在部署合约...
✅ 合约部署成功!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 合约地址: 0x1234567890123456789012345678901234567890
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 下一步:
1️⃣  查看合约: https://testnet.hashkeyscan.io/address/0x...
2️⃣  测试合约: npm run test
3️⃣  铸造代币: npm run mint
4️⃣  配置 x402
```

保存 **合约地址**！

### 测试成功

```
🧪 测试 EIP-3009 USDC

✍️  付款人签名中...
✅ 签名完成

⏳ 中继者执行 transferWithAuthorization...
📤 交易已发送: 0xabcd...
✅ 交易确认!

💰 最终余额:
  付款人: 999990.0 USDC
  收款人: 10.0 USDC

🎉 测试完成!
```

---

## 🎯 完成后做什么

### 1. 配置 x402（5分钟）

#### Python

编辑 `python/x402/src/x402/chains.py`:

```python
KNOWN_TOKENS = {
    # ... 其他网络
    "133": [{
        "human_name": "usdc",
        "address": "0xYourUSDCAddress",  # 👈 替换
        "decimals": 6,
        "name": "USDC",
        "version": "2",
    }],
}
```

编辑 `python/x402/src/x402/networks.py`:

```python
SupportedNetworks = Literal[
    "base", "base-sepolia", 
    "hashkey-testnet",  # 👈 添加
]

EVM_NETWORK_TO_CHAIN_ID = {
    "base-sepolia": 84532,
    "base": 8453,
    "hashkey-testnet": 133,  # 👈 添加
}
```

#### TypeScript

编辑 `typescript/packages/x402/src/types/shared/network.ts`:

```typescript
export const NetworkSchema = z.enum([
  "base-sepolia", "base",
  "hashkey-testnet",  // 👈 添加
]);

export const SupportedEVMNetworks: Network[] = [
  "base-sepolia", "base",
  "hashkey-testnet",  // 👈 添加
];

export const EvmNetworkToChainId = new Map<Network, number>([
  ["base-sepolia", 84532],
  ["base", 8453],
  ["hashkey-testnet", 133],  // 👈 添加
]);
```

编辑 `typescript/packages/x402/src/types/shared/evm/wallet.ts`:

```typescript
import { defineChain } from "viem";

const hashkeyTestnet = defineChain({
  id: 133,
  name: 'HashKey Chain Testnet',
  network: 'hashkey-testnet',
  nativeCurrency: { decimals: 18, name: 'HSK', symbol: 'HSK' },
  rpcUrls: {
    default: { http: ['https://testnet.hashkeychain.io'] },
  },
  blockExplorers: {
    default: { name: 'HashKeyScan', url: 'https://testnet.hashkeyscan.io' },
  },
  testnet: true,
});

// 在 getChainFromNetwork 中添加
case "hashkey-testnet":
  return hashkeyTestnet;
```

### 2. 重新构建（2分钟）

```bash
cd typescript
pnpm install
pnpm build
```

### 3. 测试完整流程（10分钟）

```bash
# 终端 1: 启动 Facilitator
cd examples/typescript/facilitator
echo "EVM_PRIVATE_KEY=0xYour..." > .env
pnpm dev

# 终端 2: 启动服务器
cd examples/typescript/servers/express
# 编辑 index.ts，使用 hashkey-testnet
pnpm dev

# 终端 3: 运行客户端
cd examples/typescript/clients/axios
echo "PRIVATE_KEY=0xYour..." > .env
echo "RESOURCE_SERVER_URL=http://localhost:4021" >> .env
echo "ENDPOINT_PATH=/weather" >> .env
pnpm dev
```

---

## 📚 项目结构

```
hashkey-deployment/
├── contracts/
│   └── EIP3009USDC.sol       # USDC 合约
├── scripts/
│   ├── deploy.ts              # 部署脚本
│   ├── test-eip3009.ts        # 测试脚本
│   ├── mint.ts                # 铸造脚本
│   └── check-balance.ts       # 查询余额
├── hardhat.config.ts          # Hardhat 配置
├── package.json               # 依赖配置
├── .env.example               # 环境变量模板
└── README.md                  # 说明文档
```

---

## 🔧 可用命令

| 命令 | 说明 |
|------|------|
| `npm run deploy` | 部署 USDC 合约 |
| `npm run test` | 测试 EIP-3009 功能 |
| `npm run mint` | 铸造测试代币 |
| `npm run balance` | 查询余额 |
| `npm run verify` | 验证合约（需要 API key） |

---

## 🆘 常见问题

### Q: 我没有测试 HSK

**A**: 
1. 联系 HashKey Chain 团队
2. 寻找测试网水龙头
3. 或在社区申请

### Q: 部署失败 - insufficient funds

**A**:
```bash
# 检查余额
npm run balance

# 确保有至少 0.1 HSK
```

### Q: 如何获取私钥？

**A**:
```javascript
// 在 MetaMask 中:
// 账户详情 → 导出私钥

// 或生成新账户:
node -e "console.log(require('ethers').Wallet.createRandom().privateKey)"
```

### Q: 测试失败 - USDC 余额为 0

**A**:
```bash
npm run mint
```

### Q: 如何查看合约？

**A**:
```bash
# 查看 deployment.json
cat deployment.json

# 或访问区块浏览器
# https://testnet.hashkeyscan.io/address/0xYourAddress
```

---

## 📖 详细文档

| 文档 | 说明 |
|------|------|
| [DEPLOY_INSTRUCTIONS.md](hashkey-deployment/DEPLOY_INSTRUCTIONS.md) | 详细部署说明 |
| [README.md](hashkey-deployment/README.md) | 项目说明 |
| [START_HERE.md](START_HERE.md) | 总导航 |
| [X402_FLOW_EXPLAINED.md](X402_FLOW_EXPLAINED.md) | 流程详解 |
| [HASHKEY_INTEGRATION_GUIDE.md](HASHKEY_INTEGRATION_GUIDE.md) | 集成指南 |

---

## ✅ 检查清单

部署完成后检查：

- [ ] ✅ 合约成功部署
- [ ] ✅ 保存了合约地址
- [ ] ✅ 测试通过
- [ ] ✅ 铸造了测试代币
- [ ] ✅ 在区块浏览器上可见
- [ ] ✅ 更新了 x402 配置
- [ ] ✅ 重新构建了项目
- [ ] ✅ 完整流程测试通过

---

## 🎉 成功！

现在你已经：
- ✅ 在 HashKey Chain 上部署了 EIP-3009 USDC
- ✅ 测试了 transferWithAuthorization 功能
- ✅ 有了测试代币
- ✅ 准备好集成 x402

**下一步**: 配置 x402 并运行完整测试！

查看: [HASHKEY_INTEGRATION_GUIDE.md](HASHKEY_INTEGRATION_GUIDE.md)

---

**祝你部署顺利！** 🚀

有问题随时查看文档或提问。

