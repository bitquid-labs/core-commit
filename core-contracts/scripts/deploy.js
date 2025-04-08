const { ethers } = require("hardhat");

const OWNER = "0x47C14E2dD82B7Cf0E7426c991225417e4C40Cd19";
const ALT_TOKEN = "0x73795572FB8c1c737513156ecb8b1Cc9a3f9cA46";
const MIN = 20000000000000;

async function main() {
  console.log("Starting deployment script...");
  try {
    const bqBTCToken = await ethers.getContractFactory("bqBTC");
    const bqBTC = await bqBTCToken.deploy(
      "BQ BTC",
      "bqBTC",
      18,
      MIN,
      OWNER,
      ALT_TOKEN,
      100
    );
    const bqBTCAddress = await bqBTC.getAddress();

    console.log(`BQ BTC Address: ${bqBTCAddress}`);

    const InsurancePool = await ethers.getContractFactory("InsurancePool");
    const insurancePool = await InsurancePool.deploy(OWNER, bqBTCAddress);
    const poolAddress = await insurancePool.getAddress();

    console.log(`Pool Address: ${poolAddress}`);

    const vault = await ethers.getContractFactory("Vaults");
    const vaultContract = await vault.deploy(OWNER);

    const vaultAddress = await vaultContract.getAddress();
    console.log(`Vault Address: ${vaultAddress}`);

    const InsuraceCover = await ethers.getContractFactory("InsuranceCover");
    const coverContract = await InsuraceCover.deploy(
      poolAddress,
      vaultAddress,
      OWNER,
      bqBTCAddress
    );

    const coverAddress = await coverContract.getAddress();
    console.log(`Cover Address: ${coverAddress}`);

    console.log("Setting contracts...");

    await insurancePool.setCover(coverAddress);
    await insurancePool.setVault(vaultAddress);
    await vaultContract.setCover(coverAddress);
    await vaultContract.setPool(poolAddress);
    await bqBTC.setContracts(poolAddress, coverAddress, vaultAddress);

    console.log("All contracts set");
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
