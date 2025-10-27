# 🎯 HashKey Chain x402 快速部署卡片

> 一张卡片，包含所有你需要的命令！

## ⚡ 超快速部署（3 命令）

```bash
cd hashkey-deployment
npm install
./deploy-all.sh  # 一键部署！🚀
```

**或者手动执行**:

```bash
cd hashkey-deployment
npm install
echo "DEPLOYER_PRIVATE_KEY=0xYour..." > .env
npm run deploy
```

---

## 📋 所有命令速查

### 部署项目命令

```bash
# 进入部署目录
cd hashkey-deployment

# 安装依赖
npm install

# 配置私钥
echo "DEPLOYER_PRIVATE_KEY=0xYour..." > .env

# 检查余额
npm run balance

# 部署合约
npm run deploy

# 测试合约
export USDC_ADDRESS=0xYourAddress
npm run test

# 铸造代币
npm run mint

# 为他人铸造
RECIPIENT=0xOther AMOUNT=5000 npm run mint
```

### x402 配置命令

```bash
# 回到项目根目录
cd ..

# TypeScript: 重新构建
cd typescript
pnpm install && pnpm build

# Python: 重新安装
cd python/x402
pip install -e .
```

### 测试完整流程

```bash
# 终端 1: Facilitator
cd examples/typescript/facilitator
echo "EVM_PRIVATE_KEY=0xYour..." > .env
pnpm dev

# 终端 2: 服务器
cd examples/typescript/servers/express
pnpm dev

# 终端 3: 客户端
cd examples/typescript/clients/axios
echo "PRIVATE_KEY=0xYour..." > .env
pnpm dev
```

---

## 📍 需要修改的文件（4个）

### 1. Python 网络配置
**文件**: `python/x402/src/x402/networks.py`
```python
SupportedNetworks = Literal["base", "base-sepolia", "hashkey-testnet"]
EVM_NETWORK_TO_CHAIN_ID = {"hashkey-testnet": 133}
```

### 2. Python 代币配置
**文件**: `python/x402/src/x402/chains.py`
```python
NETWORK_TO_ID = {"hashkey-testnet": "133"}
KNOWN_TOKENS = {
    "133": [{
        "human_name": "usdc",
        "address": "0xYourUSDCAddress",
        "decimals": 6,
        "name": "USDC",
        "version": "2",
    }]
}
```

### 3. TypeScript 网络配置
**文件**: `typescript/packages/x402/src/types/shared/network.ts`
```typescript
export const NetworkSchema = z.enum(["hashkey-testnet"]);
export const SupportedEVMNetworks: Network[] = ["hashkey-testnet"];
export const EvmNetworkToChainId = new Map([["hashkey-testnet", 133]]);
```

### 4. TypeScript Chain 定义
**文件**: `typescript/packages/x402/src/types/shared/evm/wallet.ts`
```typescript
import { defineChain } from "viem";

const hashkeyTestnet = defineChain({
  id: 133,
  name: 'HashKey Chain Testnet',
  network: 'hashkey-testnet',
  nativeCurrency: { decimals: 18, name: 'HSK', symbol: 'HSK' },
  rpcUrls: {
    default: { http: ['https://testnet.hashkeychain.io'] }
  },
  blockExplorers: {
    default: { name: 'HashKeyScan', url: 'https://testnet.hashkeyscan.io' }
  },
  testnet: true,
});

// 在 getChainFromNetwork 中添加
case "hashkey-testnet": return hashkeyTestnet;
```

---

## 🌐 HashKey Chain 信息

| 参数 | 值 |
|------|---|
| **Chain ID** | 133 |
| **Network** | hashkey-testnet |
| **RPC** | https://testnet.hashkeychain.io |
| **浏览器** | https://testnet.hashkeyscan.io |
| **代币** | HSK |

---

## 💻 使用示例

### 服务器 (Express)
```typescript
app.use(paymentMiddleware("0xYourAddress", {
  "/weather": { price: "$0.001", network: "hashkey-testnet" }
}));
```

### 服务器 (FastAPI)
```python
app.middleware("http")(require_payment(
    path="/weather", price="$0.001",
    pay_to_address="0xYourAddress",
    network="hashkey-testnet"
))
```

### 客户端 (TypeScript)
```typescript
const signer = await createSigner("hashkey-testnet", privateKey);
const api = withPaymentInterceptor(axios.create({...}), signer);
```

### 客户端 (Python)
```python
client = PaymentClient(private_key="0x...", network="hashkey-testnet")
```

---

## 🔗 重要链接

| 链接 | 说明 |
|------|------|
| [DEPLOY_NOW.md](DEPLOY_NOW.md) | 立即开始部署 |
| [START_HERE.md](START_HERE.md) | 总导航 |
| [X402_FLOW_EXPLAINED.md](X402_FLOW_EXPLAINED.md) | 流程详解 |
| [HASHKEY_INTEGRATION_GUIDE.md](HASHKEY_INTEGRATION_GUIDE.md) | 完整指南 |
| [部署项目 README](hashkey-deployment/README.md) | 部署说明 |

---

## 🆘 故障排查速查

| 问题 | 解决 |
|------|------|
| 余额不足 | `npm run balance` → 获取测试 HSK |
| 部署失败 | 检查私钥格式 (0x...) |
| 测试失败 | `npm run mint` 铸造代币 |
| 找不到合约 | `cat deployment.json` |
| 签名错误 | 检查 Chain ID 是否为 133 |

---

## ✅ 部署检查清单

- [ ] ✅ 安装依赖 (`npm install`)
- [ ] ✅ 配置私钥 (`.env`)
- [ ] ✅ 账户有 HSK
- [ ] ✅ 部署成功
- [ ] ✅ 保存合约地址
- [ ] ✅ 测试通过
- [ ] ✅ 铸造代币
- [ ] ✅ 修改 4 个配置文件
- [ ] ✅ 重新构建项目
- [ ] ✅ 完整流程测试

---

## 📊 预期时间

| 步骤 | 时间 |
|------|------|
| 安装依赖 | 2 分钟 |
| 配置环境 | 1 分钟 |
| 部署合约 | 2 分钟 |
| 测试功能 | 1 分钟 |
| 修改配置 | 5 分钟 |
| 重新构建 | 3 分钟 |
| 完整测试 | 5 分钟 |
| **总计** | **~20 分钟** |

---

## 🎉 完成标志

你知道成功了当：

1. ✅ 看到 "合约部署成功" 和合约地址
2. ✅ 测试输出显示 "测试完成"
3. ✅ 余额显示有 USDC
4. ✅ 在区块浏览器上能看到合约
5. ✅ 完整的 x402 流程运行成功

---

## 💡 Pro 技巧

**一键部署**:
```bash
cd hashkey-deployment && ./deploy-all.sh
```

**快速铸造**:
```bash
AMOUNT=10000 npm run mint
```

**查看部署信息**:
```bash
cat deployment.json | jq
```

**查看合约**:
```bash
ADDR=$(node -p "require('./deployment.json').contractAddress")
open "https://testnet.hashkeyscan.io/address/$ADDR"
```

---

## 🎯 记住这些

1. **部署一次** - USDC 合约只需部署一次
2. **保存地址** - 合约地址在 `deployment.json`
3. **配置 4 个文件** - 才能使用 HashKey 网络
4. **重新构建** - 修改配置后必须重新构建
5. **测试完整流程** - 确保一切正常

---

**保存这张卡片！** 📌

打印或保存为书签，随时查看。

---

**快速开始** → [DEPLOY_NOW.md](DEPLOY_NOW.md)

