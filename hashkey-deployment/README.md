# HashKey Chain - x402 部署项目

在 HashKey 测试链上部署 EIP-3009 USDC 合约，用于 x402 协议。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件
nano .env
```

**必填项**:
```
DEPLOYER_PRIVATE_KEY=0xYourPrivateKey  # 你的私钥（需要有 HSK）
```

### 3. 检查余额

```bash
npm run balance
```

确保账户有足够的 HSK 支付 gas（建议至少 0.1 HSK）。

### 4. 部署 USDC 合约

```bash
npm run deploy
```

部署成功后会显示合约地址，并自动更新 `.env` 文件。

### 5. 测试 EIP-3009 功能

```bash
export USDC_ADDRESS=0xYourDeployedAddress  # 从部署输出中获取
npm run test
```

### 6. 铸造测试代币

```bash
# 为自己铸造 1000 USDC
npm run mint

# 为他人铸造
RECIPIENT=0xOtherAddress AMOUNT=5000 npm run mint
```

## 📋 可用命令

```bash
npm run deploy      # 部署 USDC 合约
npm run test        # 测试 EIP-3009 功能
npm run mint        # 铸造测试代币
npm run balance     # 查询余额
npm run verify      # 验证合约（需要 API key）
```

## 📝 部署信息

部署成功后，所有信息会保存在 `deployment.json` 文件中，包括：
- 合约地址
- 部署者地址
- 代币信息
- Domain Separator
- 区块浏览器链接

## 🔗 有用链接

- **区块浏览器**: https://testnet.hashkeyscan.io
- **HashKey Chain 文档**: https://docs.hashkeychain.io
- **获取测试币**: [联系 HashKey 团队]

## 🔧 集成到 x402

部署完成后，需要将 USDC 地址添加到 x402 配置：

### Python 配置

编辑 `python/x402/src/x402/chains.py`:

```python
KNOWN_TOKENS = {
    # ...
    "133": [  # HashKey Testnet
        {
            "human_name": "usdc",
            "address": "0xYourUSDCAddress",  # 替换为实际地址
            "decimals": 6,
            "name": "USDC",
            "version": "2",
        }
    ],
}
```

### TypeScript 配置

已自动从链上读取，但建议在使用时明确指定：

```typescript
const paymentRequirements = {
  asset: "0xYourUSDCAddress",
  // ...
};
```

## 🐛 故障排查

### 问题: 部署失败 - insufficient funds

**解决**:
```bash
# 检查余额
npm run balance

# 获取测试 HSK
# 联系 HashKey 团队或使用水龙头
```

### 问题: 测试失败 - 余额为 0

**解决**:
```bash
# 铸造代币
npm run mint
```

### 问题: 签名验证失败

**原因**: Chain ID 或 Domain Separator 不匹配

**解决**:
```bash
# 重新部署合约
npm run deploy
```

## 📖 下一步

1. ✅ 部署 USDC 合约
2. ✅ 测试 EIP-3009 功能
3. ✅ 铸造测试代币
4. ⏭️ 修改 x402 配置
5. ⏭️ 测试完整 x402 流程

查看完整文档：[HASHKEY_INTEGRATION_GUIDE.md](../HASHKEY_INTEGRATION_GUIDE.md)

## 🤝 获取帮助

- 查看主文档: [START_HERE.md](../START_HERE.md)
- 流程说明: [X402_FLOW_EXPLAINED.md](../X402_FLOW_EXPLAINED.md)
- GitHub Issues: https://github.com/coinbase/x402/issues

