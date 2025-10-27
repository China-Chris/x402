# 🧪 超简单测试指南

## 🎯 最快测试方法

### 前提条件
- ✅ 合约已部署: `0x7c2a7C56a4A873c0087FCfA3B1491C6e31211E15`
- ✅ 你有 60 HSK 和 1,001,000 USDC
- ✅ TypeScript 包已构建

---

## 📝 测试步骤

### 第 1 步: 准备环境（5 分钟）

#### 在项目根目录运行：
```bash
cd /Users/zhoumenghan/Documents/GitHub/x402

# 安装 examples 依赖
cd examples/typescript
npx pnpm install
```

等待安装完成（可能需要几分钟）。

---

### 第 2 步: 启动 Facilitator（1 分钟）

#### 打开新终端 1，运行：
```bash
cd /Users/zhoumenghan/Documents/GitHub/x402/examples/typescript/servers/express

# 创建配置文件
cat > .env << 'EOF'
NETWORK=hashkey-testnet
FACILITATOR_URL=http://localhost:3000/facilitator
ADDRESS=0x319749f49C884a2F0141e53187dd1454E217786f
USDC_ADDRESS=0x7c2a7C56a4A873c0087FCfA3B1491C6e31211E15
RPC_URL=https://testnet.hsk.xyz
PRIVATE_KEY=0x8ad5b3c82c433bb80dda9510959e94a695b1ff5d8ae01da4fac55b05494aa0f5
EOF

# 启动 Facilitator
npx tsx index.ts
```

**预期输出**:
```
🚀 x402 Express Facilitator
✅ 网络: hashkey-testnet
✅ USDC: 0x7c2a7C56a4A873c0087FCfA3B1491C6e31211E15
🌐 监听: http://localhost:3000
```

---

### 第 3 步: 运行客户端测试（1 分钟）

#### 打开新终端 2，运行：
```bash
cd /Users/zhoumenghan/Documents/GitHub/x402/examples/typescript/clients/axios

# 创建配置文件
cat > .env << 'EOF'
NETWORK=hashkey-testnet
FACILITATOR_URL=http://localhost:3000/facilitator
USDC_ADDRESS=0x7c2a7C56a4A873c0087FCfA3B1491C6e31211E15
RPC_URL=https://testnet.hsk.xyz
PRIVATE_KEY=0x8ad5b3c82c433bb80dda9510959e94a695b1ff5d8ae01da4fac55b05494aa0f5
EOF

# 运行测试
npx tsx index.ts
```

**预期输出**:
```
✅ 连接到 Facilitator
✅ 获取支持信息
✅ 创建支付授权
✅ 签名 EIP-3009
✅ 提交支付
✅ 支付成功！
🔗 交易: https://testnet.hashkeyscan.io/tx/0x...
```

---

## 🎉 成功标志

如果你看到：
- ✅ Facilitator 正常启动
- ✅ 客户端连接成功
- ✅ 支付交易提交
- ✅ 区块链浏览器可以看到交易

**恭喜！测试通过！** 🎊

---

## 🐛 常见问题

### Q1: Facilitator 启动失败

**错误**: `Error: Cannot find module 'x402'`

**解决**:
```bash
cd /Users/zhoumenghan/Documents/GitHub/x402/typescript
npx pnpm install
npx pnpm build
```

### Q2: 客户端连接失败

**错误**: `ECONNREFUSED 127.0.0.1:3000`

**解决**:
```bash
# 确认 Facilitator 正在运行
lsof -i :3000

# 如果没有，返回步骤 2 重新启动
```

### Q3: 交易失败

**错误**: `Transaction reverted`

**解决**:
```bash
# 检查余额
cd /Users/zhoumenghan/Documents/GitHub/x402/hashkey-deployment
npm run balance

# 确认有足够的 HSK (gas 费) 和 USDC
```

### Q4: RPC 连接超时

**错误**: `Failed to connect to RPC`

**解决**:
```bash
# 测试 RPC 连接
curl -X POST https://testnet.hsk.xyz \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# 应返回: {"jsonrpc":"2.0","id":1,"result":"0x85"}
```

---

## 🔄 重复测试

想再次测试？

```bash
# 终端 2 直接运行
cd /Users/zhoumenghan/Documents/GitHub/x402/examples/typescript/clients/axios
npx tsx index.ts
```

每次测试都会用新的 nonce，所以可以多次运行。

---

## 📊 查看测试结果

### 在区块链浏览器查看
复制终端输出的交易哈希，访问：
```
https://testnet.hashkeyscan.io/tx/[你的交易哈希]
```

### 检查余额变化
```bash
cd /Users/zhoumenghan/Documents/GitHub/x402/hashkey-deployment
npm run balance
```

---

## 🎯 下一步

测试通过后，你可以：

1. **查看代码**
   ```bash
   # Facilitator 实现
   cat examples/typescript/servers/express/index.ts
   
   # 客户端实现
   cat examples/typescript/clients/axios/index.ts
   ```

2. **修改支付金额**
   编辑 `examples/typescript/clients/axios/index.ts`，找到：
   ```typescript
   const amount = "1000000"; // 1 USDC (6 decimals)
   ```
   改为你想要的金额。

3. **集成到你的应用**
   参考示例代码，实现你自己的支付逻辑。

---

## 📚 完整文档

- [HASHKEY_README.md](./HASHKEY_README.md) - 完整指南
- [HASHKEY_TEST_GUIDE.md](./HASHKEY_TEST_GUIDE.md) - 详细测试流程
- [CODE_UNDERSTANDING.md](./CODE_UNDERSTANDING.md) - 代码解析

---

## 💡 快捷命令

### 一键命令（需要两个终端）

**终端 1**:
```bash
cd /Users/zhoumenghan/Documents/GitHub/x402/examples/typescript/servers/express && cat > .env << 'EOF'
NETWORK=hashkey-testnet
FACILITATOR_URL=http://localhost:3000/facilitator
ADDRESS=0x319749f49C884a2F0141e53187dd1454E217786f
USDC_ADDRESS=0x7c2a7C56a4A873c0087FCfA3B1491C6e31211E15
RPC_URL=https://testnet.hsk.xyz
PRIVATE_KEY=0x8ad5b3c82c433bb80dda9510959e94a695b1ff5d8ae01da4fac55b05494aa0f5
EOF
npx tsx index.ts
```

**终端 2**:
```bash
cd /Users/zhoumenghan/Documents/GitHub/x402/examples/typescript/clients/axios && cat > .env << 'EOF'
NETWORK=hashkey-testnet
FACILITATOR_URL=http://localhost:3000/facilitator
USDC_ADDRESS=0x7c2a7C56a4A873c0087FCfA3B1491C6e31211E15
RPC_URL=https://testnet.hsk.xyz
PRIVATE_KEY=0x8ad5b3c82c433bb80dda9510959e94a695b1ff5d8ae01da4fac55b05494aa0f5
EOF
npx tsx index.ts
```

---

**就这么简单！开始测试吧！** 🚀

