import React from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { CONTRACT_CONFIGS } from '../config/contracts'
import { CheckCircle, Zap, DollarSign, Clock } from 'lucide-react'

interface BlockchainSelectorProps {
  selectedBlockchain: string
  onSelect: (blockchain: string) => void
  tokenType: 'nft' | 'sbt'
}

const BlockchainSelector: React.FC<BlockchainSelectorProps> = ({
  selectedBlockchain,
  onSelect,
  tokenType
}) => {
  const { t } = useTranslation()

  const blockchains = [
    {
      id: 'sepolia',
      name: 'Ethereum Sepolia',
      symbol: 'ETH',
      logo: '🔷',
      description: t('blockchains.sepolia.description'),
      features: [t('blockchains.features.secure'), t('blockchains.features.established')],
      cost: '0.01 ETH',
      speed: '~15s',
      testnet: true
    },
    {
      id: 'bscTestnet',
      name: 'BSC Testnet',
      symbol: 'BNB',
      logo: '🟡',
      description: t('blockchains.bscTestnet.description'),
      features: [t('blockchains.features.fast'), t('blockchains.features.cheap')],
      cost: '0.01 BNB',
      speed: '~3s',
      testnet: true
    },
    {
      id: 'polygonMumbai',
      name: 'Polygon Mumbai',
      symbol: 'MATIC',
      logo: '🟣',
      description: t('blockchains.polygonMumbai.description'),
      features: [t('blockchains.features.scalable'), t('blockchains.features.eco')],
      cost: '0.1 MATIC',
      speed: '~2s',
      testnet: true
    },
    {
      id: 'solanaDevnet',
      name: 'Solana Devnet',
      symbol: 'SOL',
      logo: '🌟',
      description: t('blockchains.solanaDevnet.description'),
      features: [t('blockchains.features.ultrafast'), t('blockchains.features.lowcost')],
      cost: '0.01 SOL',
      speed: '~1s',
      testnet: true
    }
  ]

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('deployment.selectBlockchain')}
        </h3>
        <p className="text-gray-600">
          {t('deployment.blockchainDescription')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {blockchains.map((blockchain) => (
          <motion.div
            key={blockchain.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
              selectedBlockchain === blockchain.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onSelect(blockchain.id)}
          >
            <div className="flex items-start space-x-3">
              <div className="text-2xl">{blockchain.logo}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">
                    {blockchain.name}
                  </h4>
                  {selectedBlockchain === blockchain.id && (
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-3">
                  {blockchain.description}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{t('deployment.cost')}</span>
                    </div>
                    <span className="font-medium text-gray-900">{blockchain.cost}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{t('deployment.speed')}</span>
                    </div>
                    <span className="font-medium text-gray-900">{blockchain.speed}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-3">
                  {blockchain.features.map((feature, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                  {blockchain.testnet && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                      {t('blockchains.testnet')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex items-start space-x-3">
          <Zap className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-yellow-900 mb-1">
              {t('deployment.testnetWarning.title')}
            </h4>
            <p className="text-sm text-yellow-700">
              {t('deployment.testnetWarning.description')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BlockchainSelector