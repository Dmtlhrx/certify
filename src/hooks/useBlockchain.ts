import { useState } from 'react'
import { useAccount, useNetwork, useSwitchNetwork, useWalletClient } from 'wagmi'
import { blockchainService } from '../services/blockchain'
import { useAuthStore } from '../store/useAuthStore'
import toast from 'react-hot-toast'

export const useBlockchain = () => {
  const { address, isConnected } = useAccount()
  const { chain } = useNetwork()
  const { switchNetwork } = useSwitchNetwork()
  const { data: walletClient } = useWalletClient()
  const { user } = useAuthStore()
  const [isDeploying, setIsDeploying] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [deploymentStatus, setDeploymentStatus] = useState<string>('')

  const deployContract = async (
    companyName: string,
    description: string,
    symbol: string,
    blockchain: string
  ) => {
    if (!address || !isConnected) {
      toast.error('Veuillez connecter votre wallet')
      return null
    }

    try {
      setIsDeploying(true)
      setDeploymentStatus('Vérification du réseau...')
      
      // Switch to correct network if needed
      const targetChainId = getChainId(blockchain)
      if (chain?.id !== targetChainId) {
        setDeploymentStatus('Changement de réseau...')
        if (switchNetwork) {
          await new Promise<void>((resolve, reject) => {
            switchNetwork(targetChainId, {
              onSuccess: () => {
                console.log('✅ Network switched successfully')
                resolve()
              },
              onError: (error) => {
                console.error('❌ Network switch failed:', error)
                reject(error)
              }
            })
          })
        }
        
        // Attendre un peu pour que le changement de réseau soit effectif
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      setDeploymentStatus('Vérification du solde...')
      
      // Vérifier le solde
      const balance = await blockchainService.getBalance(address)
      const balanceNum = parseFloat(balance)
      
      if (balanceNum < 0.01) { // Minimum requis pour le déploiement
        throw new Error('Solde insuffisant pour le déploiement (minimum 0.01 ETH/BNB/MATIC requis)')
      }

      setDeploymentStatus('Déploiement du contrat...')
      
      // Déployer le contrat via l'API backend
      const result = await blockchainService.deployCompanyContract(
        companyName,
        description,
        symbol,
        blockchain
      )

      setDeploymentStatus('Contrat déployé avec succès!')
      
      toast.success(`Smart contract déployé avec succès!\nAdresse: ${result.contractAddress}`)
      
      return {
        ...result,
        blockchain,
        companyName,
        description,
        symbol
      }
    } catch (error: any) {
      console.error('Deployment error:', error)
      
      let errorMessage = 'Erreur lors du déploiement'
      
      if (error.message?.includes('User rejected') || error.message?.includes('annulée')) {
        errorMessage = 'Transaction annulée par l\'utilisateur'
      } else if (error.message?.includes('insufficient funds') || error.message?.includes('Solde insuffisant')) {
        errorMessage = 'Fonds insuffisants pour le déploiement'
      } else if (error.message?.includes('gas')) {
        errorMessage = 'Erreur de gas - Ajustez le gas limit'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setDeploymentStatus(`Erreur: ${errorMessage}`)
      toast.error(errorMessage)
      return null
    } finally {
      setIsDeploying(false)
      // Réinitialiser le statut après 5 secondes
      setTimeout(() => setDeploymentStatus(''), 5000)
    }
  }

  const mintCertificate = async (certificateData: {
    contractAddress: string
    recipientAddress: string
    recipientName: string
    courseName: string
    ipfsHash: string
    isPublic?: boolean
    isSoulbound?: boolean
  }) => {
    if (!address) {
      toast.error('Veuillez connecter votre wallet')
      return null
    }

    if (!walletClient) {
      toast.error('Client wallet non disponible')
      return null
    }

    try {
      setIsMinting(true)
      
      const result = await blockchainService.issueCertificate({
        contractAddress: certificateData.contractAddress,
        recipientAddress: certificateData.recipientAddress,
        recipientName: certificateData.recipientName,
        courseName: certificateData.courseName,
        ipfsHash: certificateData.ipfsHash,
        isPublic: certificateData.isPublic,
        isSoulbound: certificateData.isSoulbound
      })
      
      toast.success(`Certificat minté avec succès!\nToken ID: ${result.tokenId}`)
      return result
    } catch (error: any) {
      console.error('Minting error:', error)
      
      let errorMessage = 'Erreur lors du mint'
      if (error.message?.includes('User rejected') || error.message?.includes('annulée')) {
        errorMessage = 'Transaction annulée par l\'utilisateur'
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Fonds insuffisants pour le mint'
      } else if (error.message?.includes('not the owner') || error.message?.includes('not authorized')) {
        errorMessage = 'Vous n\'êtes pas autorisé à émettre des certificats sur ce contrat'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
      return null
    } finally {
      setIsMinting(false)
    }
  }

  const getCertificate = async (contractAddress: string, tokenId: string) => {
    try {
      const certificate = await blockchainService.getCertificateFromBlockchain(
        contractAddress,
        tokenId
      )
      return certificate
    } catch (error: any) {
      console.error('Get certificate error:', error)
      toast.error('Erreur lors de la récupération du certificat')
      return null
    }
  }

  const getBalance = async (address?: string) => {
    try {
      const balance = await blockchainService.getBalance(address)
      return balance
    } catch (error: any) {
      console.error('Get balance error:', error)
      return '0'
    }
  }

  const getBlockExplorerUrl = (blockchain: string, hash: string, type: 'tx' | 'address' = 'tx') => {
    return blockchainService.getBlockExplorerUrl(blockchain, hash, type)
  }

  const getChainId = (blockchain: string): number => {
    const chainIds: Record<string, number> = {
      ethereum: 1,
      sepolia: 11155111,
      bsc: 56,
      bscTestnet: 97,
      polygon: 137,
      polygonMumbai: 80001
    }
    return chainIds[blockchain] || 11155111 // Default to Sepolia
  }

  const getNetworkName = (chainId: number): string => {
    const networks: Record<number, string> = {
      1: 'Ethereum',
      11155111: 'Sepolia',
      56: 'BSC',
      97: 'BSC Testnet',
      137: 'Polygon',
      80001: 'Polygon Mumbai'
    }
    return networks[chainId] || 'Unknown'
  }

  return {
    // Méthodes de déploiement
    deployContract,
    
    // Méthodes pour les certificats
    mintCertificate,
    getCertificate,
    
    // Utilitaires
    getBalance,
    getBlockExplorerUrl,
    getNetworkName,
    
    // État
    isDeploying,
    isMinting,
    deploymentStatus,
    currentChain: chain,
    currentAddress: address,
    
    // Actions
    switchNetwork
  }
}