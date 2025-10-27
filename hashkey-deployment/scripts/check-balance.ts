import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  const address = process.env.ADDRESS || signer.address;

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("💰 查询账户余额");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("📍 地址:", address);

  // 查询 HSK 余额
  const hskBalance = await ethers.provider.getBalance(address);
  console.log("\n🪙 原生代币 (HSK):");
  console.log("  余额:", ethers.formatEther(hskBalance), "HSK");

  // 查询 USDC 余额（如果已部署）
  const USDC_ADDRESS = process.env.USDC_ADDRESS;
  if (USDC_ADDRESS) {
    const usdc = await ethers.getContractAt("EIP3009USDC", USDC_ADDRESS);
    const usdcBalance = await usdc.balanceOf(address);
    console.log("\n💵 USDC:");
    console.log("  合约:", USDC_ADDRESS);
    console.log("  余额:", ethers.formatUnits(usdcBalance, 6), "USDC");
  } else {
    console.log("\n💵 USDC: 未部署");
    console.log("  运行 'npm run deploy' 部署 USDC");
  }

  console.log("\n" + "━".repeat(80));
}

main()
  .then(() => process.exit(0))
  .catch(console.error);

