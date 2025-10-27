# HashKey Chain x402 快速启动

这个示例帮助你快速在 HashKey Chain 上使用 x402。

## 🚀 5 分钟快速启动

### 前置条件

1. **HashKey Chain 账户**
   - 访问 [HashKey Chain](https://hashkeychain.io) 创建钱包
   - 获取测试网 HSK: [水龙头地址]

2. **EIP-3009 USDC**
   - 确认 HashKey Chain 上的 USDC 合约地址
   - 确保支持 `transferWithAuthorization` 方法

3. **Node.js 环境**
   ```bash
   node --version  # 需要 v20+
   pnpm --version  # 需要 v10+
   ```

## 📦 安装

```bash
# 从项目根目录
cd examples/typescript
pnpm install
pnpm build

# 进入 hashkey 快速启动目录
cd hashkey-quickstart
```

## ⚙️ 配置

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入你的配置
nano .env
```

**必填项**:
- `PAY_TO_ADDRESS`: 你的收款地址
- `CLIENT_PRIVATE_KEY`: 客户端私钥（用于支付）
- `FACILITATOR_PRIVATE_KEY`: Facilitator 私钥（用于支付 gas）
- `HASHKEY_TESTNET_USDC`: HashKey 测试网 USDC 地址

## 🎬 运行

### 终端 1: 启动 Facilitator

```bash
# 在 hashkey-quickstart 目录
pnpm facilitator
```

Facilitator 将运行在 `http://localhost:3000`

### 终端 2: 启动资源服务器

```bash
# 在 hashkey-quickstart 目录
pnpm server
```

服务器将运行在 `http://localhost:4021`

提供的端点：
- `GET /weather` - 需要支付 $0.001
- `GET /premium` - 需要支付 $0.01

### 终端 3: 运行客户端测试

```bash
# 在 hashkey-quickstart 目录
pnpm client
```

客户端会自动：
1. 请求 `/weather` 端点
2. 收到 402 响应和支付要求
3. 签名并发送支付授权
4. 获取天气数据和交易哈希

## 📊 预期输出

**终端 1 (Facilitator)**:
```
Server listening at http://localhost:3000
POST /verify - Verification request received
POST /settle - Settlement request received
```

**终端 2 (Server)**:
```
Server running on http://localhost:4021
Payment verified for 0x...
Payment settled: 0xTransactionHash...
```

**终端 3 (Client)**:
```
Response: { weather: 'sunny', temperature: 25 }
Payment Transaction: 0xTransactionHash...
Network: hashkey-testnet
```

## 🔍 验证交易

访问 HashKey Chain 区块浏览器查看交易：
- **测试网**: https://testnet.hashkeyscan.io/tx/0xYourTransactionHash
- **主网**: https://hashkeyscan.io/tx/0xYourTransactionHash

## 📝 脚本说明

### `pnpm facilitator`
启动本地 Facilitator 服务器，提供：
- `/verify` - 验证支付
- `/settle` - 结算支付
- `/supported` - 返回支持的网络

### `pnpm server`
启动资源服务器，使用 x402 中间件保护端点

### `pnpm client`
运行测试客户端，自动处理支付流程

## 🛠 自定义

### 修改价格

编辑 `server.ts`:
```typescript
{
  "GET /weather": {
    price: "$0.005",  // 改为 0.5 美分
    network: "hashkey-testnet",
  }
}
```

### 添加新端点

```typescript
app.use(
  paymentMiddleware(
    process.env.PAY_TO_ADDRESS!,
    {
      "GET /custom": {
        price: "$0.10",
        network: "hashkey-testnet",
      }
    }
  )
);

app.get("/custom", (req, res) => {
  res.json({ data: "Custom data" });
});
```

## 🐛 故障排查

### 问题 1: Facilitator 无法启动

**错误**: `Missing EVM_PRIVATE_KEY`

**解决**:
```bash
# 检查 .env 文件
cat .env | grep FACILITATOR_PRIVATE_KEY
# 确保私钥格式正确 (0x...)
```

### 问题 2: 客户端支付失败

**错误**: `insufficient_funds`

**解决**:
1. 检查客户端钱包余额
   ```bash
   # 访问区块浏览器
   https://testnet.hashkeyscan.io/address/0xYourAddress
   ```
2. 确保有足够的 USDC
3. 从水龙头获取测试币

### 问题 3: 验证失败

**错误**: `invalid_signature`

**可能原因**:
- USDC 合约地址错误
- 网络配置错误
- EIP-712 domain 信息不匹配

**解决**:
1. 验证 USDC 合约地址
2. 检查网络配置
3. 确认 EIP-3009 支持

### 问题 4: Gas 不足

**错误**: `transaction failed: out of gas`

**解决**:
```bash
# 确保 Facilitator 钱包有 HSK
# 获取测试 HSK: [水龙头 URL]
```

## 📖 相关文档

- [完整集成指南](../../../HASHKEY_INTEGRATION_GUIDE.md)
- [x402 协议规范](../../../specs/x402-specification.md)
- [代码理解文档](../../../CODE_UNDERSTANDING.md)

## 🤝 获取帮助

遇到问题？
1. 查看 [故障排查](#故障排查)
2. 阅读 [完整文档](../../../HASHKEY_INTEGRATION_GUIDE.md)
3. 在 [GitHub Issues](https://github.com/coinbase/x402/issues) 提问

## ✅ 检查清单

部署前确认：

- [ ] 在测试网上成功运行
- [ ] 验证 USDC 合约地址正确
- [ ] Facilitator 有足够的 gas
- [ ] 客户端可以成功支付
- [ ] 交易在区块浏览器上可见
- [ ] 错误处理正常工作

## 🎯 下一步

1. **测试更多场景**: 余额不足、签名错误等
2. **部署到生产**: 使用 HashKey 主网
3. **监控**: 添加日志和指标
4. **优化**: 调整 gas 价格、超时时间等

---

祝你集成顺利！🚀

