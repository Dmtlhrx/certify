// Contract configurations and ABIs for different blockchains
export const CONTRACT_CONFIGS = {
  ethereum: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    blockExplorer: 'https://etherscan.io',
    gasPrice: '20000000000', // 20 gwei
    deploymentCost: '0.05' // ETH
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    symbol: 'ETH',
    rpcUrl: 'https://sepolia.infura.io/v3/',
    blockExplorer: 'https://sepolia.etherscan.io',
    gasPrice: '10000000000', // 10 gwei
    deploymentCost: '0.01' // ETH
  },
  bsc: {
    chainId: 56,
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed1.binance.org/',
    blockExplorer: 'https://bscscan.com',
    gasPrice: '5000000000', // 5 gwei
    deploymentCost: '0.01' // BNB
  },
  bscTestnet: {
    chainId: 97,
    name: 'BNB Smart Chain Testnet',
    symbol: 'BNB',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    blockExplorer: 'https://testnet.bscscan.com',
    gasPrice: '10000000000', // 10 gwei
    deploymentCost: '0.01' // BNB
  },
  polygon: {
    chainId: 137,
    name: 'Polygon Mainnet',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com/',
    blockExplorer: 'https://polygonscan.com',
    gasPrice: '30000000000', // 30 gwei
    deploymentCost: '0.1' // MATIC
  },
  polygonMumbai: {
    chainId: 80001,
    name: 'Polygon Mumbai',
    symbol: 'MATIC',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com/',
    blockExplorer: 'https://mumbai.polygonscan.com',
    gasPrice: '30000000000', // 30 gwei
    deploymentCost: '0.1' // MATIC
  },
  solana: {
    chainId: 'mainnet-beta',
    name: 'Solana Mainnet',
    symbol: 'SOL',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    blockExplorer: 'https://explorer.solana.com',
    deploymentCost: '0.01' // SOL
  },
  solanaDevnet: {
    chainId: 'devnet',
    name: 'Solana Devnet',
    symbol: 'SOL',
    rpcUrl: 'https://api.devnet.solana.com',
    blockExplorer: 'https://explorer.solana.com',
    deploymentCost: '0.01' // SOL
  }
}

// NFT Certificate Contract ABI and Bytecode
export const NFT_CERTIFICATE_ABI = [
  "constructor(string memory _name, string memory _symbol, address _owner)",
  "function mint(address to, uint256 tokenId, string memory uri) external",
  "function burn(uint256 tokenId) external",
  "function transferFrom(address from, address to, uint256 tokenId) external",
  "function approve(address to, uint256 tokenId) external",
  "function setApprovalForAll(address operator, bool approved) external",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string memory)",
  "function totalSupply() external view returns (uint256)",
  "function issueCertificate(address recipient, string memory recipientName, string memory courseName, string memory metadataURI) external returns (uint256)",
  "event CertificateIssued(uint256 indexed tokenId, address indexed recipient, string recipientName, string courseName, string metadataURI)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
]

// SBT Certificate Contract ABI and Bytecode
export const SBT_CERTIFICATE_ABI = [
  "constructor(string memory _name, string memory _symbol, address _owner)",
  "function mint(address to, uint256 tokenId, string memory uri) external",
  "function burn(uint256 tokenId) external",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string memory)",
  "function totalSupply() external view returns (uint256)",
  "function issueCertificate(address recipient, string memory recipientName, string memory courseName, string memory metadataURI) external returns (uint256)",
  "event CertificateIssued(uint256 indexed tokenId, address indexed recipient, string recipientName, string courseName, string metadataURI)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
]

// Contract Bytecodes (these would be the compiled contract bytecodes)
export const NFT_CERTIFICATE_BYTECODE = "0x608060405234801561001057600080fd5b50604051610a38380380610a388339818101604052810190610032919061007a565b8282816000908051906020019061004a929190610109565b508060019080519060200190610061929190610109565b50505061007381610075565b50506101b8565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006100a58261007a565b9050919050565b6100b58161009a565b81146100c057600080fd5b50565b6000815190506100d2816100ac565b92915050565b600080fd5b600080fd5b600080fd5b60008083601f8401126100fd576100fc6100d8565b5b8235905067ffffffffffffffff81111561011a576101196100dd565b5b602083019150836001820283011115610136576101356100e2565b5b9250929050565b6000806000806060858703121561015757610156610070565b5b6000610165878288016100c3565b9450506020610176878288016100c3565b935050604085013567ffffffffffffffff81111561019757610196610075565b5b6101a3878288016100e7565b925092505092959194509250565b610871806101c76000396000f3fe..."

export const SBT_CERTIFICATE_BYTECODE = "0x608060405234801561001057600080fd5b50604051610a38380380610a388339818101604052810190610032919061007a565b8282816000908051906020019061004a929190610109565b508060019080519060200190610061929190610109565b50505061007381610075565b50506101b8565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006100a58261007a565b9050919050565b6100b58161009a565b81146100c057600080fd5b50565b6000815190506100d2816100ac565b92915050565b600080fd5b600080fd5b600080fd5b60008083601f8401126100fd576100fc6100d8565b5b8235905067ffffffffffffffff81111561011a576101196100dd565b5b602083019150836001820283011115610136576101356100e2565b5b9250929050565b6000806000806060858703121561015757610156610070565b5b6000610165878288016100c3565b9450506020610176878288016100c3565b935050604085013567ffffffffffffffff81111561019757610196610075565b5b6101a3878288016100e7565b925092505092959194509250565b610871806101c76000396000f3fe..."

// Solana Program IDs and configurations
export const SOLANA_CONFIGS = {
  programId: 'CertProgramId1111111111111111111111111111111',
  metaplexProgramId: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
  tokenProgramId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
}

export const TOKEN_TYPES = {
  NFT: {
    id: 'nft',
    name: 'NFT (Non-Fungible Token)',
    transferable: true,
    tradeable: true,
    description: 'Standard NFT that can be transferred and traded'
  },
  SBT: {
    id: 'sbt',
    name: 'SBT (Soulbound Token)',
    transferable: false,
    tradeable: false,
    description: 'Non-transferable token bound to the recipient\'s wallet'
  }
}