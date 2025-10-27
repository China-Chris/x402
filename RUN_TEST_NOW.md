# 🚀 立即运行测试 - 2 步完成

## ✅ 前提条件
- USDC 合约已部署: `0x7c2a7C56a4A873c0087FCfA3B1491C6e31211E15`
- TypeScript 包已构建
- 端口 4021 可用

---

## 📝 测试步骤

### 步骤 1: 启动 Facilitator

在**当前终端**运行：

```bash
cd /Users/zhoumenghan/Documents/GitHub/x402/examples/typescript/servers/express

# 创建配置文件
cat > .env << 'EOF'
NETWORK=hashkey-testnet
FACILITATOR_URL=http://localhost:4021/facilitator
ADDRESS=0x319749f49C884a2F0141e53187dd1454E217786f
USDC_ADDRESS=0x7c2a7C56a4A873c0087FCfA3B1491C6e31211E15
RPC_URL=https://testnet.hsk.xyz
PRIVATE_KEY=0x8ad5b3c82c433bb80dda9510959e94a695b1ff5d8ae01da4fac55b05494aa0f5
EOF

# 启动 Facilitator
npx tsx index-hashkey.ts
```

**预期输出**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 x402 Express Facilitator for HashKey Chain
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Network: hashkey-testnet
💰 Pay To: 0x319749f49C884a2F0141e53187dd1454E217786f
💵 USDC: 0x7c2a7C56a4A873c0087FCfA3B1491C6e31211E15
🌐 Facilitator URL: http://localhost:4021/facilitator
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Server listening at http://localhost:4021
📡 Test endpoint: http://localhost:4021/weather
```

**保持这个终端运行！**

---

### 步骤 2: 运行客户端测试

打开**新终端**，运行：

```bash
cd /Users/zhoumenghan/Documents/GitHub/x402/examples/typescript/clients/axios

# 创建配置文件
cat > .env << 'EOF'
NETWORK=hashkey-testnet
RESOURCE_SERVER_URL=http://localhost:4021
ENDPOINT_PATH=/weather
USDC_ADDRESS=0x7c2a7C56a4A873c0087FCfA3B1491C6e31211E15
RPC_URL=https://testnet.hsk.xyz
PRIVATE_KEY=0x8ad5b3c82c433bb80dda9510959e94a695b1ff5d8ae01da4fac55b05494aa0f5
EOF

# 运行测试
npx tsx test-hashkey.ts
```

**预期输出**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 HashKey Chain x402 客户端测试
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 网络: hashkey-testnet
🌐 资源服务器: http://localhost:4021
📡 端点: /weather

1️⃣  创建签名器...
✅ 签名器已创建

2️⃣  配置 axios 拦截器...
✅ 拦截器已配置

3️⃣  发送请求...
✅ 请求成功！

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 响应数据:
{
  "report": {
    "weather": "sunny on HashKey Chain",
    "temperature": 70,
    "network": "hashkey-testnet",
    "timestamp": "..."
  }
}

💳 支付信息:
{
  ...
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 测试成功！
```

---

## 🎉 成功！

如果看到"🎉 测试成功！"，恭喜你！x402 已经在 HashKey Chain 上成功运行！

### 查看结果

1. **查看余额变化**:
   ```bash
   cd /Users/zhoumenghan/Documents/GitHub/x402/hashkey-deployment
   npm run balance
   ```

2. **查看交易**:
   检查终端输出的交易哈希，访问：
   ```
   https://testnet.hashkeyscan.io/tx/[交易哈希]
   ```

3. **再次测试**:
   在客户端终端直接运行：
   ```bash
   npx tsx test-hashkey.ts
   ```

---

## 🐛 故障排除

### 问题: Facilitator 启动失败

**错误**: `Error: listen EADDRINUSE`

**解决**:
```bash
# 杀掉占用端口的进程
lsof -ti:4021 | xargs kill -9
# 重新启动 Facilitator
```

### 问题: "Unable to get default asset"

**原因**: TypeScript 包未重新构建

**解决**:
```bash
cd /Users/zhoumenghan/Documents/GitHub/x402/typescript
npx pnpm build
```

### 问题: RPC 连接失败

**解决**:
```bash
# 测试 RPC 连接
curl -X POST https://testnet.hsk.xyz \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

---

## 📚 更多信息

- [SIMPLE_TEST_GUIDE.md](./SIMPLE_TEST_GUIDE.md) - 详细测试指南
- [HASHKEY_TEST_GUIDE.md](./HASHKEY_TEST_GUIDE.md) - 完整测试文档
- [HASHKEY_DEPLOYMENT_SUCCESS.md](./HASHKEY_DEPLOYMENT_SUCCESS.md) - 部署详情

---

**现在就开始测试吧！** 🚀

