import { ethers } from "hardhat";

async function main() {
  const clientPrivateKey = "0x517197a0cd7d51ade08b4c79476071b6c5f885f5fa6a80d7515416fab3acbbdf";
  const clientWallet = new ethers.Wallet(clientPrivateKey);
  const clientAddress = clientWallet.address;

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("💸 转账到客户端账户");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`👤 客户端地址: ${clientAddress}`);
  console.log("");

  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log(`💰 部署者地址: ${deployer.address}`);
  
  // 获取 USDC 合约
  const deployment = require("../deployment.json");
  const usdcAddress = deployment.contractAddress;
  const USDC = await ethers.getContractAt("EIP3009USDC", usdcAddress);

  // 检查当前余额
  const deployerBalance = await USDC.balanceOf(deployer.address);
  const clientBalance = await USDC.balanceOf(clientAddress);
  
  console.log("");
  console.log("📊 当前余额:");
  console.log(`   部署者: ${ethers.formatUnits(deployerBalance, 6)} USDC`);
  console.log(`   客户端: ${ethers.formatUnits(clientBalance, 6)} USDC`);
  console.log("");

  // 转账 10,000 USDC 到客户端
  const amount = ethers.parseUnits("10000", 6);
  console.log(`📤 转账 10,000 USDC 到客户端...`);
  const tx = await USDC.transfer(clientAddress, amount);
  console.log(`   交易哈希: ${tx.hash}`);
  
  await tx.wait();
  console.log(`   ✅ 交易已确认`);
  console.log("");

  // 转账 1 HSK (gas 费)
  console.log(`📤 转账 1 HSK (gas 费) 到客户端...`);
  const hskTx = await deployer.sendTransaction({
    to: clientAddress,
    value: ethers.parseEther("1"),
  });
  console.log(`   交易哈希: ${hskTx.hash}`);
  
  await hskTx.wait();
  console.log(`   ✅ 交易已确认`);
  console.log("");

  // 检查新余额
  const newClientUsdcBalance = await USDC.balanceOf(clientAddress);
  const newClientHskBalance = await ethers.provider.getBalance(clientAddress);
  
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ 转账完成！");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`💵 客户端 USDC: ${ethers.formatUnits(newClientUsdcBalance, 6)} USDC`);
  console.log(`🪙 客户端 HSK: ${ethers.formatEther(newClientHskBalance)} HSK`);
  console.log("");
  console.log(`📍 客户端地址: ${clientAddress}`);
  console.log(`🔑 客户端私钥: ${clientPrivateKey}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
