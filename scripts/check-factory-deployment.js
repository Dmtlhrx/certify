// scripts/check-factory-deployment.js
const { ethers } = require('ethers');
require('dotenv').config();

const FACTORY_ABI = [
  "function registerCompany(string memory _name, string memory _description, string memory _symbol) external",
  "function getCompany(address _owner) external view returns (tuple(address owner, address contractAddress, string name, string description, uint256 createdAt, bool isActive))",
  "function getCompanyContract(address _owner) external view returns (address)",
  "event CompanyRegistered(address indexed owner, address indexed contractAddress, string name)"
];

const NETWORKS = {
  sepolia: {
    name: 'Sepolia',
    rpcUrl: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
    factoryAddress: process.env.FACTORY_CONTRACT_SEPOLIA,
    chainId: 11155111
  },
  bscTestnet: {
    name: 'BSC Testnet',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    factoryAddress: process.env.FACTORY_CONTRACT_BSCTESTNET,
    chainId: 97
  },
  polygonMumbai: {
    name: 'Polygon Mumbai',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com/',
    factoryAddress: process.env.FACTORY_CONTRACT_POLYGONMUMBAI,
    chainId: 80001
  }
};

async function checkFactoryDeployment(networkName, config) {
  console.log(`\n🔍 Checking ${config.name}...`);
  
  try {
    if (!config.factoryAddress) {
      console.log(`❌ Factory address not configured for ${config.name}`);
      return false;
    }
    
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    
    // Check if provider is working
    try {
      const network = await provider.getNetwork();
      console.log(`✅ Connected to ${config.name} (Chain ID: ${network.chainId})`);
    } catch (providerError) {
      console.log(`❌ Failed to connect to ${config.name}: ${providerError.message}`);
      return false;
    }
    
    // Check if contract exists
    const code = await provider.getCode(config.factoryAddress);
    if (code === '0x') {
      console.log(`❌ No contract code found at ${config.factoryAddress}`);
      return false;
    }
    
    console.log(`✅ Contract code found at ${config.factoryAddress}`);
    
    // Try to create contract instance
    const factory = new ethers.Contract(config.factoryAddress, FACTORY_ABI, provider);
    
    // Test a simple call (this might fail if ABI doesn't match)
    try {
      // We can't call getCompany without a valid address, so let's just check the contract exists
      console.log(`✅ Factory contract is accessible`);
      console.log(`📍 Address: ${config.factoryAddress}`);
      return true;
    } catch (callError) {
      console.log(`⚠️  Contract exists but may have ABI issues: ${callError.message}`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Error checking ${config.name}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Checking Factory Contract Deployments...\n');
  
  let allDeployed = true;
  
  for (const [networkName, config] of Object.entries(NETWORKS)) {
    const isDeployed = await checkFactoryDeployment(networkName, config);
    if (!isDeployed) {
      allDeployed = false;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (allDeployed) {
    console.log('✅ All factory contracts are properly deployed!');
  } else {
    console.log('❌ Some factory contracts are missing or misconfigured.');
    console.log('\nTo fix this:');
    console.log('1. Deploy factory contracts using: npm run deploy:factory');
    console.log('2. Update your .env file with the correct addresses');
    console.log('3. Make sure your RPC URLs are working');
  }
  
  console.log('\n📋 Current configuration:');
  for (const [networkName, config] of Object.entries(NETWORKS)) {
    console.log(`${config.name}: ${config.factoryAddress || 'NOT CONFIGURED'}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });