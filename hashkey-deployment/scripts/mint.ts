import { ethers } from "hardhat";

async function main() {
  const USDC_ADDRESS = process.env.USDC_ADDRESS;
  const RECIPIENT = process.env.RECIPIENT;
  const AMOUNT = process.env.AMOUNT || "1000";

  if (!USDC_ADDRESS) {
    console.error("❌ 错误: 请设置 USDC_ADDRESS 环境变量");
    process.exit(1);
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🪙 铸造 USDC 测试代币");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const [signer] = await ethers.getSigners();
  const usdc = await ethers.getContractAt("EIP3009USDC", USDC_ADDRESS);

  console.log("📍 合约:", USDC_ADDRESS);
  console.log("👤 铸造者:", signer.address);

  const recipient = RECIPIENT || signer.address;
  const amount = ethers.parseUnits(AMOUNT, 6);

  console.log("👤 接收人:", recipient);
  console.log("💵 数量:", AMOUNT, "USDC");

  // 检查当前余额
  const balanceBefore = await usdc.balanceOf(recipient);
  console.log("\n💰 当前余额:", ethers.formatUnits(balanceBefore, 6), "USDC");

  console.log("\n⏳ 铸造中...");
  const tx = await usdc.mint(recipient, amount);
  console.log("📤 交易:", tx.hash);
  console.log("🔗 查看:", `https://testnet.hashkeyscan.io/tx/${tx.hash}`);

  await tx.wait();
  console.log("✅ 铸造完成!");

  const balanceAfter = await usdc.balanceOf(recipient);
  console.log("\n💰 新余额:", ethers.formatUnits(balanceAfter, 6), "USDC");
  console.log("📊 增加:", ethers.formatUnits(balanceAfter - balanceBefore, 6), "USDC");

  console.log("\n" + "━".repeat(80));
  console.log("🎉 铸造成功!");
  console.log("━".repeat(80));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 铸造失败:", error);
    process.exit(1);
  });


