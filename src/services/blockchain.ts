import { ethers } from 'ethers'
import { contractAPI } from './api'

// Contract ABIs
export const FACTORY_ABI = [
  "function registerCompany(string memory _name, string memory _description, string memory _symbol) external",
  "function getCompany(address _owner) external view returns (tuple(address owner, address contractAddress, string name, string description, uint256 createdAt, bool isActive))",
  "function getCompanyContract(address _owner) external view returns (address)",
  "event CompanyRegistered(address indexed owner, address indexed contractAddress, string name)"
]

export const CERTIFICATE_ABI = [
  "function issueCertificate(address _recipient, string memory _recipientName, string memory _courseName, string memory _ipfsHash, bool _isPublic, bool _isSoulbound) external returns (uint256)",
  "function getCertificate(uint256 _tokenId) external view returns (tuple(uint256 tokenId, address recipient, string recipientName, string courseName, string ipfsHash, uint256 issueDate, bool isPublic, bool isSoulbound))",
  "function totalSupply() external view returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "function owner() external view returns (address)",
  "event CertificateIssued(uint256 indexed tokenId, address indexed recipient, string recipientName, string courseName, string ipfsHash, bool isPublic, bool isSoulbound)"
]

// Simplified Certificate Contract ABI for deployment
export const CERTIFICATE_DEPLOY_ABI = [
  "constructor(string memory _name, string memory _symbol, address _owner)"
]

// Network configurations
export const NETWORK_CONFIGS = {
  ethereum: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    blockExplorer: 'https://etherscan.io'
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    symbol: 'ETH',
    rpcUrl: 'https://sepolia.infura.io/v3/',
    blockExplorer: 'https://sepolia.etherscan.io'
  },
  bsc: {
    chainId: 56,
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed1.binance.org/',
    blockExplorer: 'https://bscscan.com'
  },
  bscTestnet: {
    chainId: 97,
    name: 'BNB Smart Chain Testnet',
    symbol: 'BNB',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    blockExplorer: 'https://testnet.bscscan.com'
  },
  polygon: {
    chainId: 137,
    name: 'Polygon Mainnet',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com/',
    blockExplorer: 'https://polygonscan.com'
  },
  polygonMumbai: {
    chainId: 80001,
    name: 'Polygon Mumbai',
    symbol: 'MATIC',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com/',
    blockExplorer: 'https://mumbai.polygonscan.com'
  }
}

// Types
export interface CertificateData {
  contractAddress: string
  recipientAddress: string
  recipientName: string
  courseName: string
  ipfsHash: string
  isPublic?: boolean
  isSoulbound?: boolean
}

export interface Certificate {
  tokenId: string
  recipient: string
  recipientName: string
  courseName: string
  ipfsHash: string
  issueDate: string
  isPublic: boolean
  isSoulbound: boolean
}

export interface CompanyInfo {
  owner: string
  contractAddress: string
  name: string
  description: string
  createdAt: string
  isActive: boolean
}

export interface DeploymentResult {
  contractAddress: string
  transactionHash: string
  blockNumber: number
}

export class BlockchainService {
  private provider: ethers.BrowserProvider | null = null
  private signer: ethers.JsonRpcSigner | null = null

  constructor() {
    this.initializeProvider()
  }

  private async initializeProvider() {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      console.warn('No ethereum provider found in window')
      return
    }

    try {
      this.provider = new ethers.BrowserProvider((window as any).ethereum)
    } catch (error) {
      console.error('Failed to initialize provider:', error)
      throw error
    }
  }

  async getSigner(): Promise<ethers.JsonRpcSigner> {
    if (!this.provider) {
      throw new Error('No provider available')
    }

    try {
      return await this.provider.getSigner()
    } catch (error) {
      console.error('Failed to get signer:', error)
      throw error
    }
  }

  async connectWallet(): Promise<string[]> {
    if (!this.provider) {
      throw new Error('No wallet provider found')
    }

    try {
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts'
      })
      
      this.signer = await this.getSigner()
      return accounts
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw error
    }
  }

  async getAccount(): Promise<string | null> {
    try {
      if (!this.signer) {
        await this.connectWallet()
      }
      
      const signer = await this.getSigner()
      return await signer.getAddress()
    } catch (error) {
      console.error('Failed to get account:', error)
      return null
    }
  }

  async getNetwork(): Promise<{ chainId: number; name: string } | null> {
    if (!this.provider) return null

    try {
      const network = await this.provider.getNetwork()
      return {
        chainId: Number(network.chainId),
        name: network.name
      }
    } catch (error) {
      console.error('Failed to get network:', error)
      return null
    }
  }

  /**
   * Déploie un contrat de certificats via l'API backend
   * Cette méthode utilise le backend pour gérer le déploiement
   */
  async deployCompanyContract(
    companyName: string,
    description: string,
    symbol: string,
    blockchain: string
  ): Promise<DeploymentResult> {
    try {
      console.log('🚀 Deploying contract via backend API...')
      
      // Utiliser l'API backend pour le déploiement
      const response = await contractAPI.deploy(companyName, description, symbol, blockchain)
      
      console.log('✅ Contract deployed successfully:', response.data)
      
      return {
        contractAddress: response.data.contractAddress,
        transactionHash: response.data.transactionHash,
        blockNumber: response.data.blockNumber
      }
    } catch (error: any) {
      console.error('❌ Contract deployment error:', error)
      
      // Améliorer les messages d'erreur
      if (error.response?.status === 400) {
        throw new Error(error.response.data.error || 'Paramètres de déploiement invalides')
      } else if (error.response?.status === 500) {
        throw new Error('Erreur serveur lors du déploiement')
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Erreur réseau - Vérifiez votre connexion')
      } else {
        throw new Error(error.response?.data?.error || error.message || 'Erreur lors du déploiement du contrat')
      }
    }
  }

  /**
   * Émet un certificat via l'API backend
   */
  async issueCertificate(data: CertificateData): Promise<any> {
    try {
      console.log('📜 Issuing certificate via backend API...')
      
      const response = await contractAPI.issueCertificate({
        contractAddress: data.contractAddress,
        recipientAddress: data.recipientAddress,
        recipientName: data.recipientName,
        courseName: data.courseName,
        ipfsHash: data.ipfsHash,
        isPublic: data.isPublic ?? true,
        isSoulbound: data.isSoulbound ?? false
      })
      
      console.log('✅ Certificate issued successfully:', response.data)
      
      return {
        tokenId: response.data.tokenId,
        transactionHash: response.data.transactionHash,
        blockNumber: response.data.blockNumber,
        contractAddress: data.contractAddress
      }
    } catch (error: any) {
      console.error('❌ Certificate issuance error:', error)
      
      if (error.response?.status === 403) {
        throw new Error('Vous n\'êtes pas autorisé à émettre des certificats sur ce contrat')
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data.error || 'Données de certificat invalides')
      } else if (error.response?.status === 500) {
        throw new Error('Erreur serveur lors de l\'émission du certificat')
      } else {
        throw new Error(error.response?.data?.error || error.message || 'Erreur lors de l\'émission du certificat')
      }
    }
  }

  async getCertificateFromBlockchain(contractAddress: string, tokenId: string): Promise<Certificate> {
    try {
      console.log('🔍 Getting certificate from blockchain...')
      
      const response = await contractAPI.getCertificate(contractAddress, tokenId)
      
      return {
        tokenId: response.data.tokenId,
        recipient: response.data.recipient,
        recipientName: response.data.recipientName,
        courseName: response.data.courseName,
        ipfsHash: response.data.ipfsHash,
        issueDate: response.data.issueDate,
        isPublic: response.data.isPublic,
        isSoulbound: response.data.isSoulbound
      }
    } catch (error: any) {
      console.error('❌ Get certificate error:', error)
      throw new Error(error.response?.data?.error || 'Erreur lors de la récupération du certificat')
    }
  }

  async getContractInfo(contractAddress: string): Promise<any> {
    try {
      const response = await contractAPI.getContractInfo(contractAddress)
      return response.data
    } catch (error: any) {
      console.error('❌ Get contract info error:', error)
      throw new Error(error.response?.data?.error || 'Erreur lors de la récupération des informations du contrat')
    }
  }

  async switchNetwork(blockchain: string): Promise<void> {
    if (!this.provider || !(window as any).ethereum) {
      throw new Error('No wallet connected')
    }

    const config = NETWORK_CONFIGS[blockchain as keyof typeof NETWORK_CONFIGS]
    if (!config) {
      throw new Error('Unsupported network')
    }

    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${config.chainId.toString(16)}` }],
      })
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${config.chainId.toString(16)}`,
                chainName: config.name,
                nativeCurrency: {
                  name: config.symbol,
                  symbol: config.symbol,
                  decimals: 18,
                },
                rpcUrls: [config.rpcUrl],
                blockExplorerUrls: [config.blockExplorer],
              },
            ],
          })
        } catch (addError) {
          throw new Error('Failed to add network to wallet')
        }
      } else {
        throw new Error('Failed to switch network')
      }
    }
  }

  getBlockExplorerUrl(blockchain: string, hash: string, type: 'tx' | 'address' = 'tx'): string {
    const config = NETWORK_CONFIGS[blockchain as keyof typeof NETWORK_CONFIGS]
    if (!config) return ''
    
    const path = type === 'tx' ? 'tx' : 'address'
    return `${config.blockExplorer}/${path}/${hash}`
  }

  async getBalance(address?: string): Promise<string> {
    if (!this.provider) {
      throw new Error('No provider available')
    }

    try {
      const targetAddress = address || await this.getAccount()
      if (!targetAddress) {
        throw new Error('No address provided')
      }

      const balance = await this.provider.getBalance(targetAddress)
      return ethers.formatEther(balance)
    } catch (error) {
      console.error('Failed to get balance:', error)
      throw error
    }
  }

  async isConnected(): Promise<boolean> {
    try {
      const account = await this.getAccount()
      return !!account
    } catch (error) {
      return false
    }
  }

  disconnect(): void {
    this.provider = null
    this.signer = null
  }
}

export const blockchainService = new BlockchainService()