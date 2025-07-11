import { ethers } from 'ethers'
import { CONTRACT_CONFIGS, NFT_CERTIFICATE_ABI, SBT_CERTIFICATE_ABI, NFT_CERTIFICATE_BYTECODE, SBT_CERTIFICATE_BYTECODE, TOKEN_TYPES } from '../config/contracts'
import { SolanaService } from './solana'

export interface DeploymentParams {
  name: string
  symbol: string
  tokenType: 'nft' | 'sbt'
  blockchain: string
  ownerAddress: string
}

export interface CertificateParams {
  contractAddress: string
  recipientAddress: string
  recipientName: string
  courseName: string
  metadataUri: string
  tokenType: 'nft' | 'sbt'
  blockchain: string
}

export class BlockchainService {
  private provider: ethers.BrowserProvider | null = null
  private signer: ethers.JsonRpcSigner | null = null
  private solanaService: SolanaService

  constructor() {
    this.initializeProvider()
    this.solanaService = new SolanaService()
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

  async deployContract(params: DeploymentParams): Promise<{ contractAddress: string; transactionHash: string; blockNumber: number }> {
    const { name, symbol, tokenType, blockchain, ownerAddress } = params

    if (blockchain.startsWith('solana')) {
      return this.deploySolanaContract(params)
    }

    try {
      const signer = await this.getSigner()
      const config = CONTRACT_CONFIGS[blockchain as keyof typeof CONTRACT_CONFIGS]
      
      if (!config) {
        throw new Error(`Unsupported blockchain: ${blockchain}`)
      }

      // Check if we're on the correct network
      const network = await this.provider!.getNetwork()
      if (Number(network.chainId) !== config.chainId) {
        await this.switchNetwork(blockchain)
      }

      // Get the appropriate ABI and bytecode based on token type
      const abi = tokenType === 'nft' ? NFT_CERTIFICATE_ABI : SBT_CERTIFICATE_ABI
      const bytecode = tokenType === 'nft' ? NFT_CERTIFICATE_BYTECODE : SBT_CERTIFICATE_BYTECODE

      // Create contract factory
      const contractFactory = new ethers.ContractFactory(abi, bytecode, signer)

      // Estimate gas
      const estimatedGas = await contractFactory.getDeployTransaction(name, symbol, ownerAddress).then(tx => 
        this.provider!.estimateGas(tx)
      )

      // Add 20% buffer to gas estimate
      const gasLimit = estimatedGas * 120n / 100n

      // Deploy contract
      const contract = await contractFactory.deploy(name, symbol, ownerAddress, {
        gasLimit,
        gasPrice: config.gasPrice
      })

      // Wait for deployment
      const receipt = await contract.deploymentTransaction()?.wait()
      
      if (!receipt) {
        throw new Error('Deployment transaction failed')
      }

      return {
        contractAddress: await contract.getAddress(),
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      }
    } catch (error) {
      console.error('Contract deployment error:', error)
      throw error
    }
  }

  private async deploySolanaContract(params: DeploymentParams): Promise<{ contractAddress: string; transactionHash: string; blockNumber: number }> {
    try {
      // For Solana, we don't deploy contracts in the traditional sense
      // Instead, we create a program account or use existing programs
      // This is a simplified implementation
      const publicKey = await this.solanaService.connectWallet()
      
      if (!publicKey) {
        throw new Error('Failed to connect Solana wallet')
      }

      // Create a mock deployment for Solana
      // In a real implementation, you would deploy a Solana program
      const mockContractAddress = publicKey.toString()
      const mockTransactionHash = 'solana_' + Date.now().toString()
      
      return {
        contractAddress: mockContractAddress,
        transactionHash: mockTransactionHash,
        blockNumber: Date.now()
      }
    } catch (error) {
      console.error('Solana contract deployment error:', error)
      throw error
    }
  }

  async issueCertificate(params: CertificateParams): Promise<{ tokenId: string; transactionHash: string; blockNumber: number }> {
    const { contractAddress, recipientAddress, recipientName, courseName, metadataUri, tokenType, blockchain } = params

    if (blockchain.startsWith('solana')) {
      return this.issueSolanaCertificate(params)
    }

    try {
      const signer = await this.getSigner()
      const abi = tokenType === 'nft' ? NFT_CERTIFICATE_ABI : SBT_CERTIFICATE_ABI
      
      const contract = new ethers.Contract(contractAddress, abi, signer)

      // Estimate gas
      const estimatedGas = await contract.issueCertificate.estimateGas(
        recipientAddress,
        recipientName,
        courseName,
        metadataUri
      )

      // Add 20% buffer
      const gasLimit = estimatedGas * 120n / 100n

      // Issue certificate
      const tx = await contract.issueCertificate(
        recipientAddress,
        recipientName,
        courseName,
        metadataUri,
        { gasLimit }
      )

      const receipt = await tx.wait()

      // Extract token ID from events
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log)
          return parsed.name === 'CertificateIssued'
        } catch (e) {
          return false
        }
      })

      let tokenId = '0'
      if (event) {
        const parsed = contract.interface.parseLog(event)
        tokenId = parsed.args.tokenId.toString()
      }

      return {
        tokenId,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      }
    } catch (error) {
      console.error('Certificate issuance error:', error)
      throw error
    }
  }

  private async issueSolanaCertificate(params: CertificateParams): Promise<{ tokenId: string; transactionHash: string; blockNumber: number }> {
    try {
      const { recipientAddress, metadataUri, tokenType } = params
      
      const ownerPublicKey = await this.solanaService.connectWallet()
      if (!ownerPublicKey) {
        throw new Error('Solana wallet not connected')
      }

      const recipientPublicKey = new (await import('@solana/web3.js')).PublicKey(recipientAddress)

      let mintAddress: string
      if (tokenType === 'sbt') {
        mintAddress = await this.solanaService.createCertificateSBT(ownerPublicKey, recipientPublicKey, metadataUri)
      } else {
        mintAddress = await this.solanaService.createCertificateNFT(ownerPublicKey, recipientPublicKey, metadataUri)
      }

      return {
        tokenId: mintAddress,
        transactionHash: 'solana_' + Date.now().toString(),
        blockNumber: Date.now()
      }
    } catch (error) {
      console.error('Solana certificate issuance error:', error)
      throw error
    }
  }

  async switchNetwork(blockchain: string): Promise<void> {
    if (blockchain.startsWith('solana')) {
      // Solana network switching would be handled differently
      return
    }

    if (!this.provider || !(window as any).ethereum) {
      throw new Error('No wallet connected')
    }

    const config = CONTRACT_CONFIGS[blockchain as keyof typeof CONTRACT_CONFIGS]
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

  async getAccount(): Promise<string | null> {
    try {
      const signer = await this.getSigner()
      return await signer.getAddress()
    } catch (error) {
      console.error('Failed to get account:', error)
      return null
    }
  }

  getBlockExplorerUrl(blockchain: string, hash: string, type: 'tx' | 'address' = 'tx'): string {
    if (blockchain.startsWith('solana')) {
      return this.solanaService.getExplorerUrl(hash)
    }

    const config = CONTRACT_CONFIGS[blockchain as keyof typeof CONTRACT_CONFIGS]
    if (!config) return ''
    
    const path = type === 'tx' ? 'tx' : 'address'
    return `${config.blockExplorer}/${path}/${hash}`
  }

  getEstimatedCost(blockchain: string): string {
    const config = CONTRACT_CONFIGS[blockchain as keyof typeof CONTRACT_CONFIGS]
    return config?.deploymentCost || '0.01'
  }

  getSupportedTokenTypes(): typeof TOKEN_TYPES {
    return TOKEN_TYPES
  }
}

export const blockchainService = new BlockchainService()