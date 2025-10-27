# 🚀 HashKey Chain 部署说明

## 一键部署流程

### 步骤 1: 安装依赖（2分钟）

```bash
cd hashkey-deployment
npm install
```

### 步骤 2: 配置私钥（1分钟）

```bash
# 复制模板
cp .env.example .env

# 编辑文件，填入你的私钥
# 在 Mac/Linux:
nano .env

# 或者直接命令行设置
echo "DEPLOYER_PRIVATE_KEY=0xYour_Private_Key_Here" >> .env
```

⚠️ **重要**: 私钥账户需要有 HSK 代币支付 gas！

### 步骤 3: 获取测试 HSK

访问 HashKey Chain 水龙头或联系团队获取测试币。

检查余额：
```bash
npm run balance
```

### 步骤 4: 部署（2分钟）

```bash
npm run deploy
```

你会看到：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 HashKey Chain - EIP-3009 USDC 部署
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 网络信息:
  网络名称: hashkey-testnet
  Chain ID: 133
  部署账户: 0x...
  账户余额: 1.5 HSK

💵 代币参数:
  名称: USD Coin
  符号: USDC
  精度: 6
  初始供应: 1000000 USDC

⏳ 正在部署合约...
📤 部署交易已发送
⏳ 等待确认...

✅ 合约部署成功!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 合约地址: 0xYourUSDCAddress
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**保存这个地址！** 你需要它来配置 x402。

### 步骤 5: 测试（1分钟）

```bash
# 设置合约地址（从上一步获取）
export USDC_ADDRESS=0xYourUSDCAddress

# 运行测试
npm run test
```

成功输出：
```
🧪 测试 EIP-3009 USDC

✅ 交易确认!
💰 最终余额:
  付款人: 999990.0 USDC
  收款人: 10.0 USDC

🎉 测试完成!
```

### 步骤 6: 铸造代币（30秒）

```bash
npm run mint
```

现在你有 1000 USDC 可以测试了！

---

## 🎯 完成！

你现在已经：
- ✅ 部署了 EIP-3009 USDC 合约
- ✅ 测试了 transferWithAuthorization
- ✅ 有了测试代币

## 📝 下一步

### 配置 x402

你需要将 USDC 地址添加到 x402 配置文件。

#### Python 配置

编辑 `python/x402/src/x402/chains.py`:

```python
# 在 KNOWN_TOKENS 中添加
"133": [
    {
        "human_name": "usdc",
        "address": "0xYourUSDCAddress",  # 👈 替换这里
        "decimals": 6,
        "name": "USDC",
        "version": "2",
    }
],
```

#### TypeScript 网络配置

编辑 `typescript/packages/x402/src/types/shared/network.ts`:

```typescript
export const NetworkSchema = z.enum([
  // ... 其他网络
  "hashkey-testnet",  // 👈 添加这行
]);

export const SupportedEVMNetworks: Network[] = [
  // ... 其他网络
  "hashkey-testnet",  // 👈 添加这行
];

export const EvmNetworkToChainId = new Map<Network, number>([
  // ... 其他网络
  ["hashkey-testnet", 133],  // 👈 添加这行
]);
```

#### TypeScript Chain 定义

编辑 `typescript/packages/x402/src/types/shared/evm/wallet.ts`:

```typescript
import { defineChain } from "viem";

// 添加 HashKey Testnet 定义
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
export function getChainFromNetwork(network: string | undefined): Chain {
  // ... 其他 case
  case "hashkey-testnet":
    return hashkeyTestnet;
  // ...
}
```

### 重新构建 x402

```bash
cd ../typescript
pnpm install
pnpm build
```

### 测试完整流程

```bash
# 终端 1: Facilitator
cd examples/typescript/facilitator
echo "EVM_PRIVATE_KEY=0xYour..." > .env
pnpm dev

# 终端 2: 服务器
cd examples/typescript/servers/express
# 修改代码使用 hashkey-testnet
pnpm dev

# 终端 3: 客户端
cd examples/typescript/clients/axios
echo "PRIVATE_KEY=0xYour..." > .env
pnpm dev
```

---

## 🔗 快速参考

### 重要地址

- **合约地址**: `deployment.json` 中查看
- **区块浏览器**: https://testnet.hashkeyscan.io

### 常用命令

```bash
npm run deploy      # 部署合约
npm run test        # 测试 EIP-3009
npm run mint        # 铸造代币
npm run balance     # 查询余额
```

### 环境变量

```bash
export USDC_ADDRESS=0x...        # USDC 合约地址
export RECIPIENT=0x...           # 铸造代币的接收人
export AMOUNT=1000               # 铸造数量
```

---

## 🆘 遇到问题？

### 余额不足

```bash
npm run balance
# 如果 HSK 为 0，需要获取测试币
```

### 部署失败

```bash
# 检查网络连接
curl https://testnet.hashkeychain.io

# 检查私钥格式（应该以 0x 开头）
cat .env | grep PRIVATE_KEY
```

### 测试失败

```bash
# 确保已设置合约地址
echo $USDC_ADDRESS

# 确保有 USDC 余额
npm run balance
npm run mint
```

---

## 📚 完整文档

- [START_HERE.md](../START_HERE.md) - 主导航
- [X402_FLOW_EXPLAINED.md](../X402_FLOW_EXPLAINED.md) - 流程详解
- [HASHKEY_INTEGRATION_GUIDE.md](../HASHKEY_INTEGRATION_GUIDE.md) - 集成指南

---

**祝部署顺利！** 🎉

有问题随时查看文档或提问。


