import React from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { 
  X, 
  Shield, 
  ArrowRightLeft, 
  Lock, 
  Unlock,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react'

interface TokenTypeModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (tokenType: 'nft' | 'sbt') => void
  selectedType?: 'nft' | 'sbt'
}

const TokenTypeModal: React.FC<TokenTypeModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedType
}) => {
  const { t } = useTranslation()

  if (!isOpen) return null

  const tokenTypes = [
    {
      id: 'nft' as const,
      title: t('tokenTypes.nft.title'),
      subtitle: t('tokenTypes.nft.subtitle'),
      description: t('tokenTypes.nft.description'),
      icon: <ArrowRightLeft className="h-8 w-8" />,
      color: 'from-blue-500 to-purple-600',
      features: [
        { text: t('tokenTypes.nft.features.transferable'), available: true },
        { text: t('tokenTypes.nft.features.tradeable'), available: true },
        { text: t('tokenTypes.nft.features.sellable'), available: true },
        { text: t('tokenTypes.nft.features.collectible'), available: true }
      ],
      useCases: [
        t('tokenTypes.nft.useCases.achievements'),
        t('tokenTypes.nft.useCases.collectibles'),
        t('tokenTypes.nft.useCases.tradeable')
      ]
    },
    {
      id: 'sbt' as const,
      title: t('tokenTypes.sbt.title'),
      subtitle: t('tokenTypes.sbt.subtitle'),
      description: t('tokenTypes.sbt.description'),
      icon: <Lock className="h-8 w-8" />,
      color: 'from-green-500 to-teal-600',
      features: [
        { text: t('tokenTypes.sbt.features.transferable'), available: false },
        { text: t('tokenTypes.sbt.features.tradeable'), available: false },
        { text: t('tokenTypes.sbt.features.permanent'), available: true },
        { text: t('tokenTypes.sbt.features.identity'), available: true }
      ],
      useCases: [
        t('tokenTypes.sbt.useCases.credentials'),
        t('tokenTypes.sbt.useCases.identity'),
        t('tokenTypes.sbt.useCases.reputation')
      ]
    }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {t('tokenTypes.modal.title')}
              </h2>
              <p className="text-gray-600 mt-1">
                {t('tokenTypes.modal.subtitle')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {tokenTypes.map((tokenType) => (
              <motion.div
                key={tokenType.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: tokenType.id === 'nft' ? 0 : 0.1 }}
                className={`relative p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                  selectedType === tokenType.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onSelect(tokenType.id)}
              >
                {/* Header */}
                <div className="flex items-start space-x-4 mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${tokenType.color} text-white`}>
                    {tokenType.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {tokenType.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {tokenType.subtitle}
                    </p>
                  </div>
                  {selectedType === tokenType.id && (
                    <CheckCircle className="h-6 w-6 text-blue-500" />
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-700 mb-4">
                  {tokenType.description}
                </p>

                {/* Features */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    {t('tokenTypes.modal.features')}
                  </h4>
                  <div className="space-y-2">
                    {tokenType.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        {feature.available ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`text-sm ${
                          feature.available ? 'text-gray-700' : 'text-gray-500'
                        }`}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Use Cases */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    {t('tokenTypes.modal.useCases')}
                  </h4>
                  <ul className="space-y-1">
                    {tokenType.useCases.map((useCase, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                        <span>{useCase}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  {t('tokenTypes.modal.info.title')}
                </h4>
                <p className="text-sm text-blue-700">
                  {t('tokenTypes.modal.info.description')}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={() => selectedType && onSelect(selectedType)}
              disabled={!selectedType}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.continue')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default TokenTypeModal