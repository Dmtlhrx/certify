const hre = require('hardhat');
const fs = require('fs');

async function main() {
  console.log('🚀 Deploying Factory Contract...');
  const { ethers } = hre;

  const [deployer] = await ethers.getSigners();
  console.log('Deploying with account:', deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Account balance:', ethers.utils.formatEther(balance), 'ETH'); // ✅ CORRECT

  const CertificateFactory = await ethers.getContractFactory('CertificateFactory');
  const factory = await CertificateFactory.deploy();
  await factory.deployed();

  console.log('✅ Factory contract deployed to:', factory.address);
  console.log('Transaction hash:', factory.deployTransaction.hash);

  
  // Wait for deployment
  await factory.deployed();

  console.log('✅ Factory contract deployed to:', factory.address);
  console.log('Transaction hash:', factory.deployTransaction.hash);

  // Save the address to .env
  const envPath = '.env';
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  const network = await ethers.provider.getNetwork();
  const networkName = network.name === 'unknown' ? 'localhost' : network.name;
  const envKey = `FACTORY_CONTRACT_${networkName.toUpperCase()}`;
  const regex = new RegExp(`^${envKey}=.*$`, 'm');
  const newLine = `${envKey}=${factory.address}`;

  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, newLine);
  } else {
    envContent += `\n${newLine}`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Factory address saved to ${envPath} as ${envKey}`);

  // Verify the deployment
  console.log('\n🔍 Verifying deployment...');
  try {
    const code = await ethers.provider.getCode(factory.address);
    if (code === '0x') {
      console.log('❌ No code found at factory address');
    } else {
      console.log('✅ Factory contract verified - code exists');
    }
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });
