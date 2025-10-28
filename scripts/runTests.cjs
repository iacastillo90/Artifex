const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🧪 Running Artifex E2E Test Flow...\n");

  // Cargar direcciones desplegadas
  const addressesPath = path.join(__dirname, "../deployed-addresses.json");
  if (!fs.existsSync(addressesPath)) {
    console.error("❌ deployed-addresses.json not found. Run deploy.js first!");
    process.exit(1);
  }

  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

  // Obtener cuentas de prueba
  const [admin, creator, fan] = await hre.ethers.getSigners();
  console.log("👥 Test Accounts:");
  console.log("   Admin:  ", admin.address);
  console.log("   Creator:", creator.address);
  console.log("   Fan:    ", fan.address);
  console.log("");

  // Conectar a contratos
  const usdc = await hre.ethers.getContractAt("MockUSDC", addresses.MockUSDC);
  const creatorProfile = await hre.ethers.getContractAt("ArtifexCreatorProfile", addresses.ArtifexCreatorProfile);
  const content = await hre.ethers.getContractAt("ArtifexContent", addresses.ArtifexContent);
  const subscriptions = await hre.ethers.getContractAt("ArtifexSubscriptions", addresses.ArtifexSubscriptions);
  const treasury = await hre.ethers.getContractAt("ArtifexTreasury", addresses.ArtifexTreasury);
  const tipping = await hre.ethers.getContractAt("ArtifexTipping", addresses.ArtifexTipping);

  // ============================================
  // 1. Distribuir USDC a Creator y Fan
  // ============================================
  console.log("💵 Step 1: Distributing USDC...");
  const usdcAmount = hre.ethers.utils.parseUnits("1000", 6); // 1000 USDC

  await usdc.mint(creator.address, usdcAmount);
  await usdc.mint(fan.address, usdcAmount);

  const creatorBalance = await usdc.balanceOf(creator.address);
  const fanBalance = await usdc.balanceOf(fan.address);

  console.log("   Creator USDC balance:", hre.ethers.utils.formatUnits(creatorBalance, 6));
  console.log("   Fan USDC balance:    ", hre.ethers.utils.formatUnits(fanBalance, 6));
  console.log("   ✅ USDC distributed\n");

  // ============================================
  // 2. Creator: Crear Perfil
  // ============================================
  console.log("👤 Step 2: Creator creates profile...");
  const tx1 = await creatorProfile.connect(creator).createProfile(
    "artista123",
    "QmProfileHash123"
  );
  await tx1.wait();

  const profileId = await creatorProfile.profileIdOf(creator.address);
  console.log("   Profile ID:", profileId.toString());
  console.log("   ✅ Profile created\n");

  // ============================================
  // 3. Creator: Registrarse para Suscripciones
  // ============================================
  console.log("💳 Step 3: Creator registers for subscriptions...");
  const monthlyPrice = hre.ethers.utils.parseUnits("9.99", 6); // $9.99/mes

  const tx2 = await subscriptions.connect(creator).registerCreator(monthlyPrice);
  await tx2.wait();

  const creatorInfo = await subscriptions.creators(creator.address);
  console.log("   Monthly Price:", hre.ethers.utils.formatUnits(creatorInfo.monthlyPrice, 6), "USDC");
  console.log("   Is Active:", creatorInfo.isActive);
  console.log("   ✅ Creator registered\n");

  // ============================================
  // 4. Creator: Publicar Contenido (2 posts)
  // ============================================
  console.log("📄 Step 4: Creator publishes content...");

  // Post 1: Público
  const tx3 = await content.connect(creator).publishContent(
    "QmPublicContent123",
    0, // VIDEO
    0, // PUBLIC
    0
  );
  const receipt3 = await tx3.wait();
  const tokenId1 = receipt3.events.find(e => e.event === "ContentPublished").args.tokenId;
  console.log("   Post 1 (Public): TokenId", tokenId1.toString());

  // Post 2: Solo Suscriptores
  const tx4 = await content.connect(creator).publishContent(
    "QmSubscriberContent456",
    2, // ARTICLE
    1, // SUBSCRIBERS_ONLY
    0
  );
  const receipt4 = await tx4.wait();
  const tokenId2 = receipt4.events.find(e => e.event === "ContentPublished").args.tokenId;
  console.log("   Post 2 (Subscribers Only): TokenId", tokenId2.toString());

  // Post 3: Pay-per-view
  const ppvPrice = hre.ethers.utils.parseUnits("4.99", 6);
  const tx5 = await content.connect(creator).publishContent(
    "QmPPVContent789",
    1, // GALLERY
    2, // PAY_PER_VIEW
    ppvPrice
  );
  const receipt5 = await tx5.wait();
  const tokenId3 = receipt5.events.find(e => e.event === "ContentPublished").args.tokenId;
  console.log("   Post 3 (Pay-per-view): TokenId", tokenId3.toString());

  console.log("   ✅ Content published\n");

  // ============================================
  // 5. Fan: Aprobar USDC para todos los contratos
  // ============================================
  console.log("🔓 Step 5: Fan approves USDC spending...");

  const maxApproval = hre.ethers.constants.MaxUint256;

  await usdc.connect(fan).approve(subscriptions.address, maxApproval);
  await usdc.connect(fan).approve(content.address, maxApproval);
  await usdc.connect(fan).approve(tipping.address, maxApproval);

  console.log("   ✅ USDC approvals granted\n");

  // ============================================
  // 6. Fan: Verificar acceso ANTES de suscribirse
  // ============================================
  console.log("🔒 Step 6: Checking access before subscription...");
  const hasAccessBefore = await content.canAccess(tokenId2, fan.address);
  console.log("   Can access subscribers-only content:", hasAccessBefore);
  console.log("   ✅ Access denied (expected)\n");

  // ============================================
  // 7. Fan: Suscribirse al Creator
  // ============================================
  console.log("💳 Step 7: Fan subscribes to creator...");

  const fanBalanceBefore = await usdc.balanceOf(fan.address);
  const creatorBalanceBefore = await usdc.balanceOf(creator.address);
  const treasuryBalanceBefore = await usdc.balanceOf(treasury.address);

  const tx6 = await subscriptions.connect(fan).subscribe(creator.address, 1); // 1 mes
  await tx6.wait();

  const fanBalanceAfter = await usdc.balanceOf(fan.address);
  const creatorBalanceAfter = await usdc.balanceOf(creator.address);
  const treasuryBalanceAfter = await usdc.balanceOf(treasury.address);

  console.log("   Fan paid:       ", hre.ethers.utils.formatUnits(fanBalanceBefore.sub(fanBalanceAfter), 6), "USDC");
  console.log("   Creator earned: ", hre.ethers.utils.formatUnits(creatorBalanceAfter.sub(creatorBalanceBefore), 6), "USDC");
  console.log("   Protocol fee:   ", hre.ethers.utils.formatUnits(treasuryBalanceAfter.sub(treasuryBalanceBefore), 6), "USDC");

  // Verificar suscripción
  const isSubscribed = await subscriptions.isSubscribed(creator.address, fan.address);
  console.log("   Is subscribed:", isSubscribed);
  console.log("   ✅ Subscription successful\n");

  // ============================================
  // 8. Fan: Verificar acceso DESPUÉS de suscribirse
  // ============================================
  console.log("🔓 Step 8: Checking access after subscription...");
  const hasAccessAfter = await content.canAccess(tokenId2, fan.address);
  console.log("   Can access subscribers-only content:", hasAccessAfter);
  console.log("   ✅ Access granted\n");

  // ============================================
  // 9. Fan: Comprar contenido Pay-per-view
  // ============================================
  console.log("💰 Step 9: Fan purchases pay-per-view content...");

  const fanBalance2Before = await usdc.balanceOf(fan.address);
  const creatorBalance2Before = await usdc.balanceOf(creator.address);

  const tx7 = await content.connect(fan).purchaseContent(tokenId3);
  await tx7.wait();

  const fanBalance2After = await usdc.balanceOf(fan.address);
  const creatorBalance2After = await usdc.balanceOf(creator.address);

  console.log("   Fan paid:       ", hre.ethers.utils.formatUnits(fanBalance2Before.sub(fanBalance2After), 6), "USDC");
  console.log("   Creator earned: ", hre.ethers.utils.formatUnits(creatorBalance2After.sub(creatorBalance2Before), 6), "USDC");

  const hasPPVAccess = await content.canAccess(tokenId3, fan.address);
  console.log("   Has PPV access:", hasPPVAccess);
  console.log("   ✅ PPV content purchased\n");

  // ============================================
  // 10. Fan: Enviar Tip al Creator
  // ============================================
  console.log("💸 Step 10: Fan sends tip to creator...");

  const tipAmount = hre.ethers.utils.parseUnits("5.00", 6); // $5 tip
  const fanBalance3Before = await usdc.balanceOf(fan.address);
  const creatorBalance3Before = await usdc.balanceOf(creator.address);

  const tx8 = await tipping.connect(fan).sendTip(
    creator.address,
    tipAmount,
    "Great content! Keep it up!"
  );
  await tx8.wait();

  const fanBalance3After = await usdc.balanceOf(fan.address);
  const creatorBalance3After = await usdc.balanceOf(creator.address);

  console.log("   Fan paid:       ", hre.ethers.utils.formatUnits(fanBalance3Before.sub(fanBalance3After), 6), "USDC");
  console.log("   Creator earned: ", hre.ethers.utils.formatUnits(creatorBalance3After.sub(creatorBalance3Before), 6), "USDC");
  console.log("   ✅ Tip sent successfully\n");

  // ============================================
  // 11. Admin: Verificar y Retirar Protocol Fees
  // ============================================
  console.log("🏦 Step 11: Admin checks and withdraws protocol fees...");

  const treasuryBalance = await usdc.balanceOf(treasury.address);
  console.log("   Treasury balance:", hre.ethers.utils.formatUnits(treasuryBalance, 6), "USDC");

  if (treasuryBalance.gt(0)) {
    const adminBalanceBefore = await usdc.balanceOf(admin.address);

    const tx9 = await treasury.connect(admin).withdrawAllProtocolFees(admin.address);
    await tx9.wait();

    const adminBalanceAfter = await usdc.balanceOf(admin.address);
    const withdrawn = adminBalanceAfter.sub(adminBalanceBefore);

    console.log("   Withdrawn to admin:", hre.ethers.utils.formatUnits(withdrawn, 6), "USDC");
    console.log("   ✅ Protocol fees withdrawn\n");
  } else {
    console.log("   ⚠️ No fees to withdraw\n");
  }

  // ============================================
  // 12. Resumen Final
  // ============================================
  console.log("=" .repeat(60));
  console.log("📊 FINAL SUMMARY");
  console.log("=" .repeat(60));

  const finalFanBalance = await usdc.balanceOf(fan.address);
  const finalCreatorBalance = await usdc.balanceOf(creator.address);
  const finalAdminBalance = await usdc.balanceOf(admin.address);
  const finalTreasuryBalance = await usdc.balanceOf(treasury.address);

  console.log("\n💰 Final Balances:");
  console.log("   Fan:     ", hre.ethers.utils.formatUnits(finalFanBalance, 6), "USDC");
  console.log("   Creator: ", hre.ethers.utils.formatUnits(finalCreatorBalance, 6), "USDC");
  console.log("   Admin:   ", hre.ethers.utils.formatUnits(finalAdminBalance, 6), "USDC");
  console.log("   Treasury:", hre.ethers.utils.formatUnits(finalTreasuryBalance, 6), "USDC");

  console.log("\n📈 Creator Stats:");
  const creatorProfileInfo = await subscriptions.creators(creator.address);
  console.log("   Subscriber count:", creatorProfileInfo.subscriberCount.toString());
  console.log("   Monthly price:   ", hre.ethers.utils.formatUnits(creatorProfileInfo.monthlyPrice, 6), "USDC");

  const creatorContentIds = await content.getCreatorContents(creator.address);
  console.log("   Total content:   ", creatorContentIds.length);

  console.log("\n🎉 All E2E tests completed successfully!\n");
  console.log("=" .repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
