# 🎉 HashKey Chain x402 部署指南

> **状态**: ✅ 已部署 | **最后更新**: 2025-10-24

---

## 🎯 快速开始

### 当前部署状态
✅ **EIP-3009 USDC 合约已部署**
- 合约地址: `0x7c2a7C56a4A873c0087FCfA3B1491C6e31211E15`
- 网络: HashKey Chain Testnet (Chain ID: 133)
- RPC: https://testnet.hsk.xyz
- 浏览器: https://testnet.hashkeyscan.io/address/0x7c2a7C56a4A873c0087FCfA3B1491C6e31211E15

✅ **x402 配置已更新**
- Python: `networks.py`, `chains.py`
- TypeScript: `network.ts`, `wallet.ts`
- 所有包已构建

---

## 🚀 立即使用

### 方式一：一键启动
```bash
./hashkey-quickstart.sh
```

### 方式二：手动启动

#### 启动 Facilitator (选择一个)

**TypeScript Express**
```bash
cd examples/typescript/servers/express
npm install
NETWORK=hashkey-testnet npm start
```

**TypeScript Hono**
```bash
cd examples/typescript/servers/hono
npm install
NETWORK=hashkey-testnet npm start
```

**Python FastAPI**
```bash
cd python/x402
uv run examples/facilitator.py
```

#### 运行客户端 (新终端)

**TypeScript axios**
```bash
cd examples/typescript/clients/axios
npm install
NETWORK=hashkey-testnet npm start
```

**TypeScript fetch**
```bash
cd examples/typescript/clients/fetch
npm install
NETWORK=hashkey-testnet npm start
```

**Python httpx**
```bash
cd examples/python/clients/httpx
uv run main.py
```

---

## 📋 管理工具

### 查询余额
```bash
cd hashkey-deployment
npm run balance
```

### 铸造测试 USDC
```bash
cd hashkey-deployment
npm run mint
```

### 测试 EIP-3009
```bash
cd hashkey-deployment
export USDC_ADDRESS=0x7c2a7C56a4A873c0087FCfA3B1491C6e31211E15
npm run test
```

---

## 📚 完整文档索引

### 核心文档
1. **[HASHKEY_DEPLOYMENT_SUCCESS.md](./HASHKEY_DEPLOYMENT_SUCCESS.md)** 📖 **← 查看这个！**
   - ✅ 部署完成状态
   - 📝 所有配置更改
   - 🚀 使用指南
   - 🔧 管理工具

2. **[CODE_UNDERSTANDING.md](./CODE_UNDERSTANDING.md)**
   - x402 项目架构
   - 核心概念解释
   - 代码结构分析

3. **[X402_FLOW_EXPLAINED.md](./X402_FLOW_EXPLAINED.md)**
   - 支付流程详解
   - EIP-3009 原理
   - 常见问题

### 部署相关
4. **[DEPLOY_EIP3009_USDC.md](./DEPLOY_EIP3009_USDC.md)**
   - 合约源代码
   - 部署脚本
   - 测试方法

5. **[HASHKEY_INTEGRATION_GUIDE.md](./HASHKEY_INTEGRATION_GUIDE.md)**
   - 详细集成步骤
   - 代码修改指南
   - 生产环境清单

### 快速参考
6. **[HASHKEY_QUICK_REFERENCE.md](./HASHKEY_QUICK_REFERENCE.md)**
   - 网络参数
   - 快速命令
   - 故障排除

7. **[HASHKEY_QUICKSTART.md](./HASHKEY_QUICKSTART.md)**
   - 快速配置
   - 代码示例
   - 立即开始

---

## 🔑 关键信息

### 网络配置
```bash
# 环境变量
NETWORK=hashkey-testnet
USDC_ADDRESS=0x7c2a7C56a4A873c0087FCfA3B1491C6e31211E15
RPC_URL=https://testnet.hsk.xyz
CHAIN_ID=133
```

### 合约信息
```json
{
  "network": "hashkey-testnet",
  "chainId": "133",
  "contractAddress": "0x7c2a7C56a4A873c0087FCfA3B1491C6e31211E15",
  "tokenName": "USD Coin",
  "tokenSymbol": "USDC",
  "decimals": 6,
  "domainSeparator": "0x1ffb0fde3a60e3e1f9c48ecc2e55ec23893a3e612ce84a65b7b44d1e20c05585"
}
```

### Python 配置
```python
# python/x402/src/x402/networks.py
SupportedNetworks = Literal[..., "hashkey-testnet"]
EVM_NETWORK_TO_CHAIN_ID = {..., "hashkey-testnet": 133}

# python/x402/src/x402/chains.py
KNOWN_TOKENS = {
    "133": [{
        "human_name": "usdc",
        "address": "0x7c2a7C56a4A873c0087FCfA3B1491C6e31211E15",
        "name": "USD Coin",
        "decimals": 6,
        "version": "2",
    }]
}
```

### TypeScript 配置
```typescript
// typescript/packages/x402/src/types/shared/network.ts
export const NetworkSchema = z.enum([..., "hashkey-testnet"]);
export const EvmNetworkToChainId = new Map([
  ...,
  ["hashkey-testnet", 133],
]);

// typescript/packages/x402/src/types/shared/evm/wallet.ts
const hashkeyTestnet = defineChain({
  id: 133,
  name: 'HashKey Chain Testnet',
  rpcUrls: { default: { http: ['https://testnet.hsk.xyz'] } },
  // ...
});
```

---

## 🧪 测试流程

### 端到端测试

#### 三终端测试流程

**终端 1: 启动 Facilitator**
```bash
cd examples/typescript/servers/express
NETWORK=hashkey-testnet npm start
# Facilitator 运行在 http://localhost:3000
```

**终端 2: 启动资源服务器**
```bash
cd examples/typescript/servers/express
NETWORK=hashkey-testnet npm start
# 资源服务器运行在 http://localhost:3001
```

**终端 3: 运行客户端**
```bash
cd examples/typescript/clients/axios
NETWORK=hashkey-testnet FACILITATOR_URL=http://localhost:3000 npm start
```

### 单元测试

```bash
# e2e 测试
cd e2e
./test-all.sh

# Python 测试
cd python/x402
uv run pytest

# TypeScript 测试
cd typescript
npx pnpm test
```

---

## 🎯 下一步

### 1. 开发你的应用
- 集成 x402 到你的应用
- 参考 `examples/` 目录中的示例
- 使用 HashKey Testnet 进行测试

### 2. 扩展功能
- 实现自定义支付逻辑
- 添加更多支付方案
- 集成其他区块链网络

### 3. 准备生产环境
- 审查安全最佳实践
- 设置监控和日志
- 准备主网部署

---

## ⚠️ 重要提示

### 安全
- ⚠️ **测试环境**: 当前部署仅用于测试
- ⚠️ **私钥管理**: 不要在生产环境使用测试私钥
- ⚠️ **代码审计**: 生产环境前需要安全审计

### 限制
- 仅支持 HashKey Chain Testnet
- USDC 测试代币无实际价值
- 网络可能不稳定

### 资源
- [x402 GitHub](https://github.com/coinbase/x402)
- [HashKey Chain 文档](https://docs.hashkey.com)
- [EIP-3009 规范](https://eips.ethereum.org/EIPS/eip-3009)

---

## 🐛 故障排除

### 常见问题

**Q: RPC 连接失败**
```bash
# 验证 RPC
curl -X POST https://testnet.hsk.xyz \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

**Q: Gas 费用不足**
```bash
# 检查余额
cd hashkey-deployment && npm run balance
# 获取测试 HSK（查询官方水龙头）
```

**Q: 构建错误**
```bash
# 清理重建
cd typescript
rm -rf node_modules
npx pnpm install
npx pnpm build
```

**Q: Facilitator 无法启动**
```bash
# 检查环境变量
echo $NETWORK
echo $USDC_ADDRESS

# 验证配置
cat .env
```

更多问题？查看 [HASHKEY_QUICK_REFERENCE.md](./HASHKEY_QUICK_REFERENCE.md)

---

## 📞 获取帮助

- **文档问题**: 查看上述文档索引
- **技术问题**: 在 [GitHub Issues](https://github.com/coinbase/x402/issues) 创建问题
- **部署问题**: 参考 [HASHKEY_DEPLOYMENT_SUCCESS.md](./HASHKEY_DEPLOYMENT_SUCCESS.md)

---

## 📈 项目结构

```
x402/
├── hashkey-deployment/          # 🆕 HashKey 部署项目
│   ├── contracts/               # 智能合约
│   ├── scripts/                 # 部署脚本
│   ├── deployment.json          # 部署信息
│   └── .env                     # 环境变量
│
├── python/x402/                 # Python 实现
│   └── src/x402/
│       ├── networks.py          # ✏️ 已更新
│       └── chains.py            # ✏️ 已更新
│
├── typescript/                  # TypeScript 实现
│   └── packages/x402/
│       └── src/types/shared/
│           ├── network.ts       # ✏️ 已更新
│           └── evm/wallet.ts    # ✏️ 已更新
│
├── examples/                    # 示例代码
│   ├── typescript/              # TypeScript 示例
│   └── python/                  # Python 示例
│
└── 📚 文档
    ├── HASHKEY_README.md              # ⭐ 你在这里
    ├── HASHKEY_DEPLOYMENT_SUCCESS.md  # ✅ 部署完成
    ├── CODE_UNDERSTANDING.md          # 📖 代码理解
    ├── X402_FLOW_EXPLAINED.md         # 🔄 流程解析
    ├── DEPLOY_EIP3009_USDC.md         # 🚀 部署指南
    ├── HASHKEY_INTEGRATION_GUIDE.md   # 🔧 集成指南
    ├── HASHKEY_QUICKSTART.md          # ⚡ 快速开始
    └── HASHKEY_QUICK_REFERENCE.md     # 📋 快速参考
```

---

## 🎉 完成！

你现在已经拥有：
- ✅ 在 HashKey Testnet 上运行的 EIP-3009 USDC 合约
- ✅ 完整配置的 x402 项目
- ✅ 可工作的 Facilitator 和客户端示例
- ✅ 完整的文档和工具

**开始构建你的支付应用吧！** 🚀

---

*有问题？查看 [HASHKEY_DEPLOYMENT_SUCCESS.md](./HASHKEY_DEPLOYMENT_SUCCESS.md) 获取完整的部署信息和故障排除指南。*
