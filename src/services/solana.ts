import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo, getOrCreateAssociatedTokenAccount } from '@solana/spl-token'

export class SolanaService {
  private connection: Connection
  private network: string

  constructor(network: 'mainnet-beta' | 'devnet' | 'testnet' = 'devnet') {
    this.network = network
    const rpcUrl = this.getRpcUrl(network)
    this.connection = new Connection(rpcUrl, 'confirmed')
  }

  private getRpcUrl(network: string): string {
    switch (network) {
      case 'mainnet-beta':
        return 'https://api.mainnet-beta.solana.com'
      case 'devnet':
        return 'https://api.devnet.solana.com'
      case 'testnet':
        return 'https://api.testnet.solana.com'
      default:
        return 'https://api.devnet.solana.com'
    }
  }

  async connectWallet(): Promise<PublicKey | null> {
    try {
      const { solana } = window as any
      
      if (!solana || !solana.isPhantom) {
        throw new Error('Phantom wallet not found')
      }

      const response = await solana.connect()
      return response.publicKey
    } catch (error) {
      console.error('Failed to connect Solana wallet:', error)
      return null
    }
  }

  async getBalance(publicKey: PublicKey): Promise<number> {
    try {
      const balance = await this.connection.getBalance(publicKey)
      return balance / LAMPORTS_PER_SOL
    } catch (error) {
      console.error('Failed to get balance:', error)
      return 0
    }
  }

  async createCertificateNFT(
    ownerPublicKey: PublicKey,
    recipientPublicKey: PublicKey,
    metadataUri: string
  ): Promise<string> {
    try {
      const { solana } = window as any
      
      if (!solana) {
        throw new Error('Solana wallet not connected')
      }

      // Create mint account for the NFT
      const mint = await createMint(
        this.connection,
        ownerPublicKey,
        ownerPublicKey,
        null,
        0 // 0 decimals for NFT
      )

      // Create token account for recipient
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        ownerPublicKey,
        mint,
        recipientPublicKey
      )

      // Mint the NFT to recipient
      await mintTo(
        this.connection,
        ownerPublicKey,
        mint,
        tokenAccount.address,
        ownerPublicKey,
        1 // Mint 1 NFT
      )

      return mint.toString()
    } catch (error) {
      console.error('Failed to create Solana NFT:', error)
      throw error
    }
  }

  async createCertificateSBT(
    ownerPublicKey: PublicKey,
    recipientPublicKey: PublicKey,
    metadataUri: string
  ): Promise<string> {
    try {
      // For SBT, we create a non-transferable token
      // This would require a custom program that prevents transfers
      // For now, we'll create a regular NFT and handle the non-transferable logic in the UI
      return await this.createCertificateNFT(ownerPublicKey, recipientPublicKey, metadataUri)
    } catch (error) {
      console.error('Failed to create Solana SBT:', error)
      throw error
    }
  }

  getExplorerUrl(signature: string): string {
    const baseUrl = this.network === 'mainnet-beta' 
      ? 'https://explorer.solana.com' 
      : `https://explorer.solana.com?cluster=${this.network}`
    
    return `${baseUrl}/tx/${signature}`
  }
}

export const solanaService = new SolanaService()