import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🚀 HashKey Chain - EIP-3009 USDC 部署");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("📋 网络信息:");
  console.log("  网络名称:", network.name);
  console.log("  Chain ID:", network.chainId.toString());
  console.log("  部署账户:", deployer.address);

  // 检查余额
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("  账户余额:", ethers.formatEther(balance), "HSK");

  if (balance === 0n) {
    console.error("\n❌ 错误: 账户余额为 0");
    console.error("请先获取测试 HSK 代币");
    process.exit(1);
  }

  // 代币参数
  const TOKEN_NAME = process.env.TOKEN_NAME || "USD Coin";
  const TOKEN_SYMBOL = process.env.TOKEN_SYMBOL || "USDC";
  const TOKEN_DECIMALS = 6;
  const INITIAL_SUPPLY = process.env.INITIAL_SUPPLY || "1000000";

  console.log("\n💵 代币参数:");
  console.log("  名称:", TOKEN_NAME);
  console.log("  符号:", TOKEN_SYMBOL);
  console.log("  精度:", TOKEN_DECIMALS);
  console.log("  初始供应:", INITIAL_SUPPLY, TOKEN_SYMBOL);

  // 部署合约
  console.log("\n⏳ 正在部署合约...");
  const EIP3009USDC = await ethers.getContractFactory("EIP3009USDC");
  const usdc = await EIP3009USDC.deploy(
    TOKEN_NAME,
    TOKEN_SYMBOL,
    TOKEN_DECIMALS,
    INITIAL_SUPPLY
  );

  console.log("📤 部署交易已发送");
  console.log("⏳ 等待确认...");

  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();

  console.log("\n✅ 合约部署成功!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📍 合约地址:", usdcAddress);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // 验证合约信息
  console.log("\n🔍 验证合约信息...");
  const name = await usdc.name();
  const symbol = await usdc.symbol();
  const decimals = await usdc.decimals();
  const totalSupply = await usdc.totalSupply();
  const domainSeparator = await usdc.DOMAIN_SEPARATOR();
  const owner = await usdc.owner();

  console.log("  名称:", name);
  console.log("  符号:", symbol);
  console.log("  精度:", decimals);
  console.log("  总供应:", ethers.formatUnits(totalSupply, decimals), symbol);
  console.log("  所有者:", owner);
  console.log("  Domain Separator:", domainSeparator);

  // 保存部署信息
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contractAddress: usdcAddress,
    deployer: deployer.address,
    tokenName: name,
    tokenSymbol: symbol,
    decimals: Number(decimals),
    initialSupply: ethers.formatUnits(totalSupply, decimals),
    domainSeparator: domainSeparator,
    deploymentTime: new Date().toISOString(),
    blockExplorer: `https://testnet.hashkeyscan.io/address/${usdcAddress}`,
  };

  const deploymentPath = path.join(__dirname, "..", "deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 部署信息已保存到:", deploymentPath);

  // 更新 .env 文件
  const envPath = path.join(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf8");
    if (envContent.includes("USDC_ADDRESS=")) {
      envContent = envContent.replace(/USDC_ADDRESS=.*/, `USDC_ADDRESS=${usdcAddress}`);
    } else {
      envContent += `\nUSDC_ADDRESS=${usdcAddress}\n`;
    }
    fs.writeFileSync(envPath, envContent);
    console.log("✅ .env 文件已更新");
  }

  console.log("\n" + "━".repeat(80));
  console.log("🎉 部署完成!");
  console.log("━".repeat(80));

  console.log("\n📝 下一步:");
  console.log("1️⃣  查看合约:");
  console.log(`   ${deploymentInfo.blockExplorer}`);

  console.log("\n2️⃣  测试合约:");
  console.log(`   export USDC_ADDRESS=${usdcAddress}`);
  console.log("   npm run test");

  console.log("\n3️⃣  铸造测试代币:");
  console.log("   npm run mint");

  console.log("\n4️⃣  配置 x402:");
  console.log("   将以下信息添加到 x402 配置文件:");
  console.log(`   
   // python/x402/src/x402/chains.py
   "133": [{
     "human_name": "usdc",
     "address": "${usdcAddress}",
     "decimals": 6,
     "name": "USDC",
     "version": "2",
   }]
   `);

  console.log("\n5️⃣  验证合约（可选）:");
  console.log(`   npx hardhat verify --network hashkey-testnet ${usdcAddress} "${TOKEN_NAME}" "${TOKEN_SYMBOL}" ${TOKEN_DECIMALS} ${INITIAL_SUPPLY}`);

  console.log("\n" + "━".repeat(80));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 部署失败:", error);
    process.exit(1);
  });


