# 在 HashKey Chain 上部署 EIP-3009 USDC

## 📋 目录
1. [什么是 EIP-3009](#什么是-eip-3009)
2. [准备工作](#准备工作)
3. [合约代码](#合约代码)
4. [部署步骤](#部署步骤)
5. [测试合约](#测试合约)
6. [集成到 x402](#集成到-x402)

---

## 什么是 EIP-3009

EIP-3009 是一个 ERC-20 代币扩展标准，允许用户通过签名授权第三方代表他们执行转账，而无需用户自己支付 gas 费用。

### 核心方法

```solidity
function transferWithAuthorization(
    address from,        // 付款人地址
    address to,          // 收款人地址
    uint256 value,       // 转账金额
    uint256 validAfter,  // 授权生效时间
    uint256 validBefore, // 授权失效时间
    bytes32 nonce,       // 防重放攻击的随机数
    uint8 v,             // 签名参数
    bytes32 r,           // 签名参数
    bytes32 s            // 签名参数
) external;
```

### 为什么需要 EIP-3009？

**传统 ERC-20 的问题**：
- 用户必须持有 ETH 支付 gas
- 需要两笔交易（approve + transferFrom）
- 用户体验差

**EIP-3009 的优势**：
- ✅ 用户只需签名，不发送交易
- ✅ 第三方代付 gas
- ✅ 一笔交易完成
- ✅ 完美适配 x402 协议

---

## 准备工作

### 1. 安装依赖

```bash
# 创建项目目录
mkdir hashkey-usdc
cd hashkey-usdc

# 初始化项目
npm init -y

# 安装依赖
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts
npm install dotenv
```

### 2. 初始化 Hardhat

```bash
npx hardhat init
# 选择: Create a TypeScript project
```

### 3. 配置环境变量

创建 `.env` 文件：

```bash
# HashKey Chain 配置
HASHKEY_TESTNET_RPC=https://testnet.hashkeychain.io
HASHKEY_MAINNET_RPC=https://mainnet.hashkeychain.io

# 部署者私钥（不要泄露！）
DEPLOYER_PRIVATE_KEY=0xYourPrivateKey

# 代币配置
TOKEN_NAME=USD Coin
TOKEN_SYMBOL=USDC
TOKEN_DECIMALS=6
INITIAL_SUPPLY=1000000000000  # 1,000,000 USDC (6 decimals)

# 浏览器 API Key（用于验证合约，可选）
HASHKEY_API_KEY=your-api-key
```

### 4. 配置 Hardhat

编辑 `hardhat.config.ts`:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    "hashkey-testnet": {
      url: process.env.HASHKEY_TESTNET_RPC || "",
      chainId: 133,
      accounts: process.env.DEPLOYER_PRIVATE_KEY 
        ? [process.env.DEPLOYER_PRIVATE_KEY] 
        : [],
    },
    "hashkey-mainnet": {
      url: process.env.HASHKEY_MAINNET_RPC || "",
      chainId: 177,
      accounts: process.env.DEPLOYER_PRIVATE_KEY 
        ? [process.env.DEPLOYER_PRIVATE_KEY] 
        : [],
    },
  },
  etherscan: {
    apiKey: {
      "hashkey-testnet": process.env.HASHKEY_API_KEY || "",
      "hashkey-mainnet": process.env.HASHKEY_API_KEY || "",
    },
    customChains: [
      {
        network: "hashkey-testnet",
        chainId: 133,
        urls: {
          apiURL: "https://testnet.hashkeyscan.io/api",
          browserURL: "https://testnet.hashkeyscan.io"
        }
      },
      {
        network: "hashkey-mainnet",
        chainId: 177,
        urls: {
          apiURL: "https://hashkeyscan.io/api",
          browserURL: "https://hashkeyscan.io"
        }
      }
    ]
  }
};

export default config;
```

### 5. 获取测试币

在 HashKey 测试网上部署需要 HSK 代币：

```bash
# 访问水龙头（需要找到官方水龙头地址）
# 或联系 HashKey 团队获取测试币
```

---

## 合约代码

### 创建合约文件

创建 `contracts/EIP3009USDC.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EIP3009USDC
 * @notice ERC-20 token with EIP-3009 support (transferWithAuthorization)
 * @dev Implements Circle's USDC transferWithAuthorization method
 */
contract EIP3009USDC is ERC20, Ownable {
    // EIP-712 Domain
    bytes32 public DOMAIN_SEPARATOR;
    
    // EIP-3009 typehash
    bytes32 public constant TRANSFER_WITH_AUTHORIZATION_TYPEHASH = 
        keccak256(
            "TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)"
        );
    
    // Track used authorization nonces
    mapping(address => mapping(bytes32 => bool)) public authorizationState;
    
    // Events
    event AuthorizationUsed(address indexed authorizer, bytes32 indexed nonce);
    event AuthorizationCanceled(address indexed authorizer, bytes32 indexed nonce);
    
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        // Calculate EIP-712 domain separator
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes(name)),
                keccak256(bytes("2")),
                block.chainid,
                address(this)
            )
        );
        
        // Mint initial supply to deployer
        _mint(msg.sender, initialSupply * 10 ** decimals_);
    }
    
    /**
     * @notice Returns the number of decimals (override for custom decimals)
     */
    function decimals() public pure override returns (uint8) {
        return 6;  // USDC uses 6 decimals
    }
    
    /**
     * @notice Execute a transfer with a signed authorization
     * @param from          Payer's address (Authorizer)
     * @param to            Payee's address
     * @param value         Amount to be transferred
     * @param validAfter    The time after which this is valid (unix time)
     * @param validBefore   The time before which this is valid (unix time)
     * @param nonce         Unique nonce
     * @param v             v of the signature
     * @param r             r of the signature
     * @param s             s of the signature
     */
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(block.timestamp > validAfter, "Authorization not yet valid");
        require(block.timestamp < validBefore, "Authorization expired");
        require(!authorizationState[from][nonce], "Authorization already used");
        
        // Verify signature
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        TRANSFER_WITH_AUTHORIZATION_TYPEHASH,
                        from,
                        to,
                        value,
                        validAfter,
                        validBefore,
                        nonce
                    )
                )
            )
        );
        
        address recoveredAddress = ecrecover(digest, v, r, s);
        require(recoveredAddress != address(0), "Invalid signature");
        require(recoveredAddress == from, "Invalid signer");
        
        // Mark authorization as used
        authorizationState[from][nonce] = true;
        
        // Execute transfer
        _transfer(from, to, value);
        
        emit AuthorizationUsed(from, nonce);
    }
    
    /**
     * @notice Attempt to cancel an authorization
     * @param authorizer    Authorizer's address
     * @param nonce         Nonce of the authorization
     * @param v             v of the signature
     * @param r             r of the signature
     * @param s             s of the signature
     */
    function cancelAuthorization(
        address authorizer,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(!authorizationState[authorizer][nonce], "Authorization already used");
        
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        keccak256("CancelAuthorization(address authorizer,bytes32 nonce)"),
                        authorizer,
                        nonce
                    )
                )
            )
        );
        
        address recoveredAddress = ecrecover(digest, v, r, s);
        require(recoveredAddress == authorizer, "Invalid signature");
        
        authorizationState[authorizer][nonce] = true;
        emit AuthorizationCanceled(authorizer, nonce);
    }
    
    /**
     * @notice Mint new tokens (only owner)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @notice Burn tokens (only owner)
     */
    function burn(uint256 amount) external onlyOwner {
        _burn(msg.sender, amount);
    }
}
```

---

## 部署步骤

### 1. 创建部署脚本

创建 `scripts/deploy.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  console.log("🚀 开始部署 EIP-3009 USDC...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 部署账户:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 账户余额:", ethers.formatEther(balance), "HSK");
  
  // 代币参数
  const TOKEN_NAME = process.env.TOKEN_NAME || "USD Coin";
  const TOKEN_SYMBOL = process.env.TOKEN_SYMBOL || "USDC";
  const TOKEN_DECIMALS = 6;
  const INITIAL_SUPPLY = process.env.INITIAL_SUPPLY || "1000000";  // 1M USDC
  
  console.log("\n📋 代币参数:");
  console.log("  名称:", TOKEN_NAME);
  console.log("  符号:", TOKEN_SYMBOL);
  console.log("  精度:", TOKEN_DECIMALS);
  console.log("  初始供应:", INITIAL_SUPPLY);
  
  // 部署合约
  console.log("\n⏳ 正在部署合约...");
  const EIP3009USDC = await ethers.getContractFactory("EIP3009USDC");
  const usdc = await EIP3009USDC.deploy(
    TOKEN_NAME,
    TOKEN_SYMBOL,
    TOKEN_DECIMALS,
    INITIAL_SUPPLY
  );
  
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  
  console.log("✅ 合约部署成功!");
  console.log("📍 合约地址:", usdcAddress);
  
  // 验证部署
  console.log("\n🔍 验证合约信息...");
  const name = await usdc.name();
  const symbol = await usdc.symbol();
  const decimals = await usdc.decimals();
  const totalSupply = await usdc.totalSupply();
  const domainSeparator = await usdc.DOMAIN_SEPARATOR();
  
  console.log("  名称:", name);
  console.log("  符号:", symbol);
  console.log("  精度:", decimals);
  console.log("  总供应:", ethers.formatUnits(totalSupply, decimals));
  console.log("  Domain Separator:", domainSeparator);
  
  // 保存部署信息
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    contractAddress: usdcAddress,
    deployer: deployer.address,
    tokenName: name,
    tokenSymbol: symbol,
    decimals: decimals,
    initialSupply: ethers.formatUnits(totalSupply, decimals),
    domainSeparator: domainSeparator,
    deploymentTime: new Date().toISOString(),
  };
  
  console.log("\n💾 部署信息:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n🎉 部署完成!");
  console.log("\n📝 下一步:");
  console.log("1. 在区块浏览器上验证合约:");
  console.log(`   npx hardhat verify --network hashkey-testnet ${usdcAddress} "${TOKEN_NAME}" "${TOKEN_SYMBOL}" ${TOKEN_DECIMALS} ${INITIAL_SUPPLY}`);
  console.log("\n2. 将合约地址添加到 x402 配置:");
  console.log(`   python/x402/src/x402/chains.py`);
  console.log(`   "133": [{"address": "${usdcAddress}", ...}]`);
  console.log("\n3. 铸造测试代币:");
  console.log(`   npx hardhat run scripts/mint.ts --network hashkey-testnet`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### 2. 执行部署

```bash
# 部署到 HashKey 测试网
npx hardhat run scripts/deploy.ts --network hashkey-testnet

# 预期输出:
# 🚀 开始部署 EIP-3009 USDC...
# 📝 部署账户: 0x...
# 💰 账户余额: 1.5 HSK
# 
# 📋 代币参数:
#   名称: USD Coin
#   符号: USDC
#   精度: 6
#   初始供应: 1000000
# 
# ⏳ 正在部署合约...
# ✅ 合约部署成功!
# 📍 合约地址: 0x...
```

### 3. 验证合约（可选）

```bash
# 在区块浏览器上验证合约源码
npx hardhat verify \
  --network hashkey-testnet \
  0xYourContractAddress \
  "USD Coin" \
  "USDC" \
  6 \
  1000000
```

---

## 测试合约

### 1. 创建测试脚本

创建 `scripts/test-eip3009.ts`:

```typescript
import { ethers } from "hardhat";
import crypto from "crypto";

async function main() {
  const USDC_ADDRESS = process.env.USDC_ADDRESS || "";
  
  if (!USDC_ADDRESS) {
    throw new Error("请设置 USDC_ADDRESS 环境变量");
  }
  
  console.log("🧪 测试 EIP-3009 USDC");
  console.log("📍 合约地址:", USDC_ADDRESS);
  
  const [payer, receiver, relayer] = await ethers.getSigners();
  console.log("\n👥 测试账户:");
  console.log("  付款人:", payer.address);
  console.log("  收款人:", receiver.address);
  console.log("  中继者:", relayer.address);
  
  // 连接合约
  const usdc = await ethers.getContractAt("EIP3009USDC", USDC_ADDRESS);
  
  // 检查余额
  console.log("\n💰 初始余额:");
  const payerBalance = await usdc.balanceOf(payer.address);
  console.log("  付款人:", ethers.formatUnits(payerBalance, 6), "USDC");
  
  // 准备授权参数
  const amount = ethers.parseUnits("10", 6);  // 10 USDC
  const validAfter = Math.floor(Date.now() / 1000);
  const validBefore = validAfter + 3600;  // 1小时后过期
  const nonce = "0x" + crypto.randomBytes(32).toString("hex");
  
  console.log("\n📝 授权参数:");
  console.log("  金额:", ethers.formatUnits(amount, 6), "USDC");
  console.log("  有效期:", new Date(validAfter * 1000).toLocaleString());
  console.log("  过期时间:", new Date(validBefore * 1000).toLocaleString());
  console.log("  Nonce:", nonce);
  
  // 获取 domain separator
  const domainSeparator = await usdc.DOMAIN_SEPARATOR();
  const chainId = (await ethers.provider.getNetwork()).chainId;
  
  // 构造 EIP-712 domain
  const domain = {
    name: await usdc.name(),
    version: "2",
    chainId: chainId,
    verifyingContract: USDC_ADDRESS,
  };
  
  // 构造消息类型
  const types = {
    TransferWithAuthorization: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
    ],
  };
  
  // 构造消息
  const message = {
    from: payer.address,
    to: receiver.address,
    value: amount,
    validAfter: validAfter,
    validBefore: validBefore,
    nonce: nonce,
  };
  
  console.log("\n✍️  签名中...");
  const signature = await payer.signTypedData(domain, types, message);
  console.log("✅ 签名完成:", signature.slice(0, 20) + "...");
  
  // 分离签名
  const sig = ethers.Signature.from(signature);
  
  console.log("\n⏳ 执行 transferWithAuthorization...");
  const tx = await usdc.connect(relayer).transferWithAuthorization(
    payer.address,
    receiver.address,
    amount,
    validAfter,
    validBefore,
    nonce,
    sig.v,
    sig.r,
    sig.s
  );
  
  console.log("📤 交易已发送:", tx.hash);
  console.log("⏳ 等待确认...");
  
  const receipt = await tx.wait();
  console.log("✅ 交易确认! Gas 使用:", receipt?.gasUsed.toString());
  
  // 检查最终余额
  console.log("\n💰 最终余额:");
  const payerBalanceAfter = await usdc.balanceOf(payer.address);
  const receiverBalanceAfter = await usdc.balanceOf(receiver.address);
  console.log("  付款人:", ethers.formatUnits(payerBalanceAfter, 6), "USDC");
  console.log("  收款人:", ethers.formatUnits(receiverBalanceAfter, 6), "USDC");
  
  // 验证授权已使用
  const isUsed = await usdc.authorizationState(payer.address, nonce);
  console.log("\n🔐 授权状态:", isUsed ? "已使用" : "未使用");
  
  console.log("\n🎉 测试完成!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### 2. 运行测试

```bash
# 设置合约地址
export USDC_ADDRESS=0xYourDeployedContractAddress

# 运行测试
npx hardhat run scripts/test-eip3009.ts --network hashkey-testnet
```

---

## 集成到 x402

### 1. 更新 Python 配置

编辑 `python/x402/src/x402/chains.py`:

```python
KNOWN_TOKENS = {
    # ... 其他网络
    
    # HashKey Testnet
    "133": [
        {
            "human_name": "usdc",
            "address": "0xYourDeployedUSDCAddress",  # 替换为实际地址
            "decimals": 6,
            "name": "USDC",
            "version": "2",
        }
    ],
}
```

### 2. 更新 TypeScript 配置

TypeScript 配置会自动从链上读取代币信息，但你可以在配置中指定：

```typescript
// 使用时指定资产
const paymentRequirements = {
  scheme: "exact",
  network: "hashkey-testnet",
  asset: "0xYourDeployedUSDCAddress",  // 你部署的 USDC 地址
  maxAmountRequired: "10000",  // 0.01 USDC
  // ...
  extra: {
    name: "USDC",
    version: "2"
  }
};
```

### 3. 测试集成

```bash
# 启动 Facilitator
cd examples/typescript/facilitator
pnpm dev

# 启动服务器
cd examples/typescript/servers/express
# 修改代码使用 hashkey-testnet
pnpm dev

# 运行客户端
cd examples/typescript/clients/axios
pnpm dev
```

---

## 铸造测试代币

创建 `scripts/mint.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  const USDC_ADDRESS = process.env.USDC_ADDRESS || "";
  const RECIPIENT = process.env.RECIPIENT || "";
  const AMOUNT = process.env.AMOUNT || "1000";  // 默认 1000 USDC
  
  if (!USDC_ADDRESS) {
    throw new Error("请设置 USDC_ADDRESS");
  }
  
  console.log("🪙 铸造 USDC 测试代币");
  console.log("📍 合约:", USDC_ADDRESS);
  console.log("👤 接收人:", RECIPIENT || "部署者");
  console.log("💵 数量:", AMOUNT, "USDC");
  
  const [signer] = await ethers.getSigners();
  const usdc = await ethers.getContractAt("EIP3009USDC", USDC_ADDRESS);
  
  const recipient = RECIPIENT || signer.address;
  const amount = ethers.parseUnits(AMOUNT, 6);
  
  console.log("\n⏳ 铸造中...");
  const tx = await usdc.mint(recipient, amount);
  console.log("📤 交易:", tx.hash);
  
  await tx.wait();
  console.log("✅ 铸造完成!");
  
  const balance = await usdc.balanceOf(recipient);
  console.log("💰 新余额:", ethers.formatUnits(balance, 6), "USDC");
}

main()
  .then(() => process.exit(0))
  .catch(console.error);
```

使用：

```bash
# 为自己铸造
export USDC_ADDRESS=0xYour...
export AMOUNT=10000
npx hardhat run scripts/mint.ts --network hashkey-testnet

# 为他人铸造
export RECIPIENT=0xOtherAddress
npx hardhat run scripts/mint.ts --network hashkey-testnet
```

---

## 验证检查清单

部署后验证：

- [ ] ✅ 合约部署成功
- [ ] ✅ 在区块浏览器上可见
- [ ] ✅ transferWithAuthorization 方法可调用
- [ ] ✅ Domain Separator 正确
- [ ] ✅ 可以铸造代币
- [ ] ✅ 可以签名授权
- [ ] ✅ 第三方可以执行 transferWithAuthorization
- [ ] ✅ 已使用的 nonce 无法重复使用
- [ ] ✅ 过期授权会被拒绝
- [ ] ✅ 集成到 x402 配置

---

## 故障排查

### 问题 1: 部署失败 - Gas 不足

```
Error: insufficient funds for gas * price + value
```

**解决**：
1. 检查账户余额
2. 从水龙头获取更多 HSK
3. 降低 gas price（在 hardhat.config.ts 中配置）

### 问题 2: 签名验证失败

```
Error: Invalid signer
```

**可能原因**：
- Chain ID 不匹配
- Domain Separator 错误
- 消息类型定义错误

**解决**：
```typescript
// 确认 chain ID
const chainId = await ethers.provider.getNetwork().chainId;
console.log("Chain ID:", chainId);  // 应该是 133

// 确认 domain separator
const ds = await usdc.DOMAIN_SEPARATOR();
console.log("Domain Separator:", ds);
```

### 问题 3: Nonce 已使用

```
Error: Authorization already used
```

**解决**：
- 每次授权使用新的 nonce
- 不要重复使用相同的 nonce

---

## 总结

你现在已经：

1. ✅ 理解了 EIP-3009 的工作原理
2. ✅ 有了完整的合约代码
3. ✅ 有了部署脚本
4. ✅ 有了测试脚本
5. ✅ 知道如何集成到 x402

### 下一步

1. **部署合约** - 在 HashKey 测试网上部署
2. **测试功能** - 运行测试脚本验证
3. **更新配置** - 将合约地址添加到 x402
4. **完整测试** - 运行完整的 x402 流程

需要帮助？查看：
- [X402 流程详解](./X402_FLOW_EXPLAINED.md)
- [HashKey 集成指南](./HASHKEY_INTEGRATION_GUIDE.md)

---

**创建时间**: 2025-10-24


