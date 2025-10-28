const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Artifex Smart Contracts...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString(), "\n");

  // ============================================
  // 1. Deploy MockUSDC (solo para testing local)
  // ============================================
  console.log("💵 Deploying MockUSDC...");
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy(deployer.address);
  await usdc.deployed();
  console.log("✅ MockUSDC deployed to:", usdc.address);
  console.log("");

  // ============================================
  // 2. Deploy ArtifexCreatorProfile
  // ============================================
  console.log("👤 Deploying ArtifexCreatorProfile...");
  const ArtifexCreatorProfile = await hre.ethers.getContractFactory("ArtifexCreatorProfile");
  const creatorProfile = await ArtifexCreatorProfile.deploy(deployer.address);
  await creatorProfile.deployed();
  console.log("✅ ArtifexCreatorProfile deployed to:", creatorProfile.address);
  console.log("");

  // ============================================
  // 3. Deploy ArtifexTreasury
  // ============================================
  console.log("🏦 Deploying ArtifexTreasury...");
  const ArtifexTreasury = await hre.ethers.getContractFactory("ArtifexTreasury");
  const treasury = await ArtifexTreasury.deploy(usdc.address, deployer.address);
  await treasury.deployed();
  console.log("✅ ArtifexTreasury deployed to:", treasury.address);
  console.log("");

  // ============================================
  // 4. Deploy ArtifexContent
  // ============================================
  console.log("📄 Deploying ArtifexContent...");
  const ArtifexContent = await hre.ethers.getContractFactory("ArtifexContent");
  const content = await ArtifexContent.deploy(usdc.address, deployer.address);
  await content.deployed();
  console.log("✅ ArtifexContent deployed to:", content.address);
  console.log("");

  // ============================================
  // 5. Deploy ArtifexSubscriptions
  // ============================================
  console.log("💳 Deploying ArtifexSubscriptions...");
  const ArtifexSubscriptions = await hre.ethers.getContractFactory("ArtifexSubscriptions");
  const subscriptions = await ArtifexSubscriptions.deploy(usdc.address, deployer.address);
  await subscriptions.deployed();
  console.log("✅ ArtifexSubscriptions deployed to:", subscriptions.address);
  console.log("");

  // ============================================
  // 6. Deploy ArtifexTipping
  // ============================================
  console.log("💰 Deploying ArtifexTipping...");
  const ArtifexTipping = await hre.ethers.getContractFactory("ArtifexTipping");
  const tipping = await ArtifexTipping.deploy(usdc.address, deployer.address);
  await tipping.deployed();
  console.log("✅ ArtifexTipping deployed to:", tipping.address);
  console.log("");

  // ============================================
  // 7. Configurar Referencias Cruzadas
  // ============================================
  console.log("🔗 Setting up cross-contract references...");

  console.log("   Setting treasury in Content contract...");
  await content.setTreasuryContract(treasury.address);

  console.log("   Setting treasury in Subscriptions contract...");
  await subscriptions.setTreasuryContract(treasury.address);

  console.log("   Setting treasury in Tipping contract...");
  await tipping.setTreasuryContract(treasury.address);

  console.log("   Setting subscription contract in Content...");
  await content.setSubscriptionContract(subscriptions.address);

  console.log("✅ Cross-contract references configured\n");

  // ============================================
  // 8. Guardar Direcciones
  // ============================================
  const addresses = {
    MockUSDC: usdc.address,
    ArtifexCreatorProfile: creatorProfile.address,
    ArtifexContent: content.address,
    ArtifexSubscriptions: subscriptions.address,
    ArtifexTreasury: treasury.address,
    ArtifexTipping: tipping.address,
    deployer: deployer.address,
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, "../deployed-addresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));

  console.log("✅ Deployment complete!");
  console.log("📋 Contract addresses saved to deployed-addresses.json\n");

  console.log("=" .repeat(60));
  console.log("DEPLOYED ADDRESSES:");
  console.log("=" .repeat(60));
  console.log("MockUSDC:                ", usdc.address);
  console.log("ArtifexCreatorProfile:   ", creatorProfile.address);
  console.log("ArtifexContent:          ", content.address);
  console.log("ArtifexSubscriptions:    ", subscriptions.address);
  console.log("ArtifexTreasury:         ", treasury.address);
  console.log("ArtifexTipping:          ", tipping.address);
  console.log("=" .repeat(60));
  console.log("");

  // Export ABIs to frontend
  console.log("📦 Exporting ABIs to frontend...");
  const abiDir = path.join(__dirname, "../src/abis");
  if (!fs.existsSync(abiDir)) {
    fs.mkdirSync(abiDir, { recursive: true });
  }

  const contracts = [
    { name: "MockUSDC", artifact: await hre.artifacts.readArtifact("MockUSDC") },
    { name: "ArtifexCreatorProfile", artifact: await hre.artifacts.readArtifact("ArtifexCreatorProfile") },
    { name: "ArtifexContent", artifact: await hre.artifacts.readArtifact("ArtifexContent") },
    { name: "ArtifexSubscriptions", artifact: await hre.artifacts.readArtifact("ArtifexSubscriptions") },
    { name: "ArtifexTreasury", artifact: await hre.artifacts.readArtifact("ArtifexTreasury") },
    { name: "ArtifexTipping", artifact: await hre.artifacts.readArtifact("ArtifexTipping") },
  ];

  contracts.forEach(({ name, artifact }) => {
    const abiPath = path.join(abiDir, `${name}.json`);
    fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
    console.log(`   ✅ ${name}.json`);
  });

  console.log("\n🎉 All done! Ready for testing.\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
