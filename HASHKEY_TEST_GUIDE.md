# 🧪 HashKey Chain x402 测试指南

## 🎯 测试目标

验证 x402 在 HashKey Chain 测试网上的完整支付流程。

---

## ⚡ 快速测试 (5 分钟)

### 方法 1: 使用快速启动脚本

```bash
# 在项目根目录
./hashkey-quickstart.sh
```

按提示选择 Facilitator 类型即可。

---

## 📋 完整测试流程

### 步骤 1: 准备工作

#### 1.1 验证部署状态
```bash
cd hashkey-deployment
npm run balance
```

**预期输出**:
```
📍 地址: 0x319749f49C884a2F0141e53187dd1454E217786f
🪙 原生代币 (HSK): ~60 HSK
💵 USDC: 1,001,000 USDC
```

#### 1.2 检查环境
```bash
# 确认在项目根目录
pwd
# 应输出: /Users/zhoumenghan/Documents/GitHub/x402
```

---

### 步骤 2: 启动 Facilitator

打开**第一个终端**，选择一个 Facilitator：

#### 选项 A: TypeScript Express (推荐)
```bash
cd examples/typescript/servers/express
npm install  # 首次运行需要
NETWORK=hashkey-testnet npm start
```

#### 选项 B: TypeScript Hono
```bash
cd examples/typescript/servers/hono
npm install  # 首次运行需要
NETWORK=hashkey-testnet npm start
```

#### 选项 C: Python FastAPI
```bash
cd python/x402
uv run examples/facilitator.py
```

**预期输出**:
```
✅ Facilitator 启动成功
🌐 监听端口: 3000
📍 支持网络: hashkey-testnet
💰 USDC 地址: 0x7c2a7C56a4A873c0087FCfA3B1491C6e31211E15
```

---

### 步骤 3: 启动资源服务器 (可选)

如果要测试完整流程，在**第二个终端**启动资源服务器：

```bash
cd examples/typescript/servers/express
PORT=3001 NETWORK=hashkey-testnet npm start
```

或使用同一个服务器（简化测试）。

---

### 步骤 4: 运行客户端测试

打开**第三个终端**（或新终端），运行客户端：

#### 选项 A: TypeScript axios (推荐)
```bash
cd examples/typescript/clients/axios

# 首次运行需要安装依赖
npm install

# 配置环境变量
export NETWORK=hashkey-testnet
export FACILITATOR_URL=http://localhost:3000
export RESOURCE_URL=http://localhost:3001  # 如果有资源服务器

# 运行客户端
npm start
```

#### 选项 B: TypeScript fetch
```bash
cd examples/typescript/clients/fetch
npm install
NETWORK=hashkey-testnet npm start
```

#### 选项 C: Python httpx
```bash
cd examples/python/clients/httpx
uv run main.py
```

**预期输出**:
```
✅ 连接到 Facilitator
📝 创建支付授权
✍️  签名 EIP-3009 授权
📤 发送支付 payload
✅ 支付验证成功
✅ 代币转账成功
🎉 测试完成！
```

---

## 🔍 验证测试结果

### 1. 检查终端输出

**Facilitator 终端应显示**:
```
收到 verify 请求
✓ 签名验证通过
✓ EIP-3009 授权有效
收到 settle 请求
✓ 交易已提交
✓ 转账成功
```

**客户端终端应显示**:
```
✅ 支付成功
Transaction Hash: 0x...
浏览器查看: https://testnet.hashkeyscan.io/tx/0x...
```

### 2. 在区块链浏览器验证

复制交易哈希，访问：
```
https://testnet.hashkeyscan.io/tx/[你的交易哈希]
```

应该看到：
- ✅ 状态: Success
- ✅ From: 客户端地址
- ✅ To: USDC 合约 (0x7c2a7C56a4A873c0087FCfA3B1491C6e31211E15)
- ✅ 方法: transferWithAuthorization

### 3. 检查余额变化

```bash
cd hashkey-deployment
npm run balance
```

应该看到 USDC 余额有相应变化。

---

## 🧪 测试场景

### 场景 1: 基础支付测试 ✅

**目标**: 验证基本的支付流程

```bash
# 终端 1: Facilitator
cd examples/typescript/servers/express
NETWORK=hashkey-testnet npm start

# 终端 2: 客户端
cd examples/typescript/clients/axios
NETWORK=hashkey-testnet npm start
```

**验证点**:
- [ ] Facilitator 正常启动
- [ ] 客户端成功连接
- [ ] 支付请求被创建
- [ ] EIP-3009 签名生成
- [ ] Facilitator 验证签名
- [ ] 交易成功提交
- [ ] 代币转账完成

---

### 场景 2: 多次支付测试

**目标**: 验证连续多次支付

```bash
# 运行客户端 3 次
for i in {1..3}; do
  echo "测试 #$i"
  cd examples/typescript/clients/axios
  NETWORK=hashkey-testnet npm start
  sleep 5
done
```

**验证点**:
- [ ] 所有支付都成功
- [ ] 每次使用不同的 nonce
- [ ] 余额正确累计

---

### 场景 3: 错误处理测试

#### 测试 A: 余额不足
```bash
# 修改客户端代码，请求大额支付（超过余额）
# 应该收到错误: Insufficient balance
```

#### 测试 B: 无效签名
```bash
# 修改客户端代码，使用错误的私钥签名
# 应该收到错误: Invalid signature
```

#### 测试 C: 重复 nonce
```bash
# 使用相同的 nonce 再次支付
# 应该收到错误: Authorization already used
```

---

### 场景 4: 完整端到端流程

**目标**: 测试从请求资源到支付完成的完整流程

```bash
# 终端 1: Facilitator
cd examples/typescript/servers/express
NETWORK=hashkey-testnet PORT=3000 npm start

# 终端 2: 资源服务器
cd examples/typescript/servers/express
NETWORK=hashkey-testnet PORT=3001 npm start

# 终端 3: 客户端
cd examples/typescript/clients/axios
export NETWORK=hashkey-testnet
export FACILITATOR_URL=http://localhost:3000
export RESOURCE_URL=http://localhost:3001
npm start
```

**完整流程**:
1. 客户端请求受保护的资源
2. 服务器返回 402 + Payment Required
3. 客户端查询 Facilitator 支持信息
4. 客户端创建支付授权并签名
5. 客户端提交给 Facilitator 验证
6. Facilitator 验证签名和余额
7. Facilitator 提交链上交易
8. 交易确认，支付完成
9. 客户端获得资源访问权限

---

## 📊 测试检查表

### 基础功能
- [ ] Facilitator 正常启动
- [ ] 客户端能连接 Facilitator
- [ ] 支持的网络包含 hashkey-testnet
- [ ] USDC 地址正确配置

### 支付流程
- [ ] `/supported` 端点返回正确信息
- [ ] 客户端能创建支付授权
- [ ] EIP-3009 签名格式正确
- [ ] `/verify` 验证通过
- [ ] `/settle` 提交成功
- [ ] 链上交易确认

### 代币操作
- [ ] 余额查询正确
- [ ] 转账金额准确
- [ ] Gas 费用合理
- [ ] 交易可在浏览器查看

### 错误处理
- [ ] 余额不足时正确报错
- [ ] 无效签名被拒绝
- [ ] 重复 nonce 被检测
- [ ] 网络错误有友好提示

---

## 🐛 故障排除

### 问题 1: Facilitator 无法启动

**症状**: 
```
Error: Cannot find module 'x402'
```

**解决**:
```bash
# 重新构建 TypeScript 包
cd typescript
npx pnpm install
npx pnpm build
```

---

### 问题 2: 客户端连接失败

**症状**:
```
Error: ECONNREFUSED 127.0.0.1:3000
```

**解决**:
```bash
# 1. 确认 Facilitator 正在运行
lsof -i :3000

# 2. 检查环境变量
echo $FACILITATOR_URL

# 3. 确认防火墙设置
```

---

### 问题 3: 签名验证失败

**症状**:
```
Error: Invalid signature
```

**解决**:
```bash
# 1. 检查私钥配置
cat examples/typescript/clients/axios/.env

# 2. 确认网络配置正确
echo $NETWORK

# 3. 验证 USDC 地址
echo $USDC_ADDRESS
```

---

### 问题 4: 交易失败

**症状**:
```
Error: Transaction reverted
```

**解决**:
```bash
# 1. 检查 Gas 余额
cd hashkey-deployment && npm run balance

# 2. 检查 USDC 余额
# 3. 查看链上交易详情
# 4. 检查合约是否 paused
```

---

### 问题 5: RPC 连接问题

**症状**:
```
Error: Failed to connect to RPC
```

**解决**:
```bash
# 验证 RPC 可用性
curl -X POST https://testnet.hsk.xyz \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# 应返回: {"jsonrpc":"2.0","id":1,"result":"0x85"}  (133 的十六进制)
```

---

## 📈 性能测试

### 测试吞吐量
```bash
# 使用 Apache Bench 测试
ab -n 100 -c 10 http://localhost:3000/facilitator/supported

# 使用 wrk 测试
wrk -t12 -c400 -d30s http://localhost:3000/facilitator/supported
```

### 测试延迟
```bash
# 使用 curl 测试响应时间
time curl http://localhost:3000/facilitator/supported

# 多次测试取平均值
for i in {1..10}; do
  time curl -s http://localhost:3000/facilitator/supported > /dev/null
done
```

---

## 📝 测试日志

### 启用详细日志

**TypeScript**:
```bash
export DEBUG=x402:*
export LOG_LEVEL=debug
npm start
```

**Python**:
```bash
export LOG_LEVEL=DEBUG
uv run main.py
```

### 查看日志
```bash
# 实时查看
tail -f /tmp/x402-facilitator.log

# 搜索错误
grep ERROR /tmp/x402-facilitator.log

# 统计请求数
grep "Payment request" /tmp/x402-facilitator.log | wc -l
```

---

## ✅ 测试通过标准

一个成功的测试应该：

1. **启动阶段**
   - ✅ Facilitator 无错误启动
   - ✅ 正确加载 HashKey 网络配置
   - ✅ USDC 合约地址正确

2. **连接阶段**
   - ✅ 客户端成功连接
   - ✅ `/supported` 返回正确信息
   - ✅ 网络参数匹配

3. **支付阶段**
   - ✅ 支付授权创建成功
   - ✅ EIP-3009 签名验证通过
   - ✅ 交易提交到链上
   - ✅ 交易确认（1-3 个区块）

4. **验证阶段**
   - ✅ 余额正确变化
   - ✅ 交易在浏览器可见
   - ✅ 无错误日志

---

## 🎯 下一步

测试通过后，你可以：

1. **集成到应用**
   - 参考客户端代码
   - 实现自己的支付逻辑
   - 添加业务逻辑

2. **扩展功能**
   - 添加多币种支持
   - 实现订阅支付
   - 集成其他链

3. **准备生产**
   - 安全审计
   - 性能优化
   - 监控告警

---

## 📞 获取帮助

- **测试失败**: 查看上方"故障排除"部分
- **性能问题**: 检查网络和 RPC 配置
- **集成问题**: 参考 `examples/` 目录
- **其他问题**: 创建 GitHub Issue

---

## 🎉 测试完成！

如果所有测试都通过，恭喜！🎊

你的 x402 部署已经可以使用了。开始构建你的支付应用吧！

---

*需要更多帮助？查看 [HASHKEY_README.md](./HASHKEY_README.md) 或 [HASHKEY_DEPLOYMENT_SUCCESS.md](./HASHKEY_DEPLOYMENT_SUCCESS.md)*

