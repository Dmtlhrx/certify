import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { 
  Building, 
  Save, 
  Upload, 
  Trash2,
  Shield,
  ExternalLink,
  Copy,
  CheckCircle,
  Loader2,
  Globe,
  Mail,
  MapPin,
  AlertTriangle,
  Zap
} from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useCompany } from '../hooks/useCompany'
import { useBlockchain } from '../hooks/useBlockchain'
import { useIPFS } from '../hooks/useIPFS'
import { useAccount, useNetwork } from 'wagmi'
import TokenTypeModal from '../components/TokenTypeModal'
import BlockchainSelector from '../components/BlockchainSelector'
import { blockchainService } from '../services/blockchain'
import toast from 'react-hot-toast'

interface CompanyForm {
  name: string
  description: string
  website: string
  email: string
  industry: string
  country: string
}

const CompanySettings: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { address } = useAccount()
  const { chain } = useNetwork()
  const { company, loading, saveCompany, setContractAddress } = useCompany()
  const { uploadFile, uploading } = useIPFS()
  
  const [logo, setLogo] = useState<string>('')
  const [activeTab, setActiveTab] = useState('profile')
  const [showTokenTypeModal, setShowTokenTypeModal] = useState(false)
  const [selectedTokenType, setSelectedTokenType] = useState<'nft' | 'sbt'>('nft')
  const [selectedBlockchain, setSelectedBlockchain] = useState('sepolia')
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentStep, setDeploymentStep] = useState('')
  const [deploymentProgress, setDeploymentProgress] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<CompanyForm>()

  const watchedName = watch('name')

  useEffect(() => {
    if (company) {
      setValue('name', company.name || '')
      setValue('description', company.description || '')
      setValue('website', company.website || '')
      setValue('email', company.email || '')
      setValue('industry', company.industry || '')
      setValue('country', company.country || '')
      setLogo(company.logo || '')
    }
  }, [company, setValue])

  const industries = [
    'Technology',
    'Education',
    'Healthcare',
    'Finance',
    'Manufacturing',
    'Retail',
    'Consulting',
    'Non-profit',
    'Government',
    'Other'
  ]

  const onSubmit = async (data: CompanyForm) => {
    try {
      await saveCompany({
        name: data.name,
        description: data.description,
        website: data.website,
        email: data.email,
        industry: data.industry,
        country: data.country,
        logo
      })
    } catch (error) {
      console.error('Save error:', error)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        const result = await uploadFile(file)
        setLogo(result.url)
        toast.success(t('common.success'))
      } catch (error) {
        toast.error(t('common.error'))
      }
    }
  }

  const handleDeployContract = async () => {
    if (!watchedName) {
      toast.error(t('errors.companyNameRequired'))
      setActiveTab('profile')
      return
    }

    if (!address) {
      toast.error(t('errors.walletNotConnected'))
      return
    }

    try {
      setIsDeploying(true)
      setDeploymentStep(t('deployment.status.preparing'))
      setDeploymentProgress(10)

      // Check balance
      const balance = await blockchainService.getBalance(address)
      const estimatedCost = blockchainService.getEstimatedCost(selectedBlockchain)
      
      if (parseFloat(balance) < parseFloat(estimatedCost)) {
        throw new Error(t('errors.insufficientFunds'))
      }

      setDeploymentStep(t('deployment.status.switching'))
      setDeploymentProgress(25)

      // Switch network if needed
      await blockchainService.switchNetwork(selectedBlockchain)

      setDeploymentStep(t('deployment.status.deploying'))
      setDeploymentProgress(50)

      // Deploy contract
      const result = await blockchainService.deployContract({
        name: watchedName,
        symbol: 'CERT',
        tokenType: selectedTokenType,
        blockchain: selectedBlockchain,
        ownerAddress: address
      })

      setDeploymentStep(t('deployment.status.confirming'))
      setDeploymentProgress(75)

      // Save contract address to database
      await setContractAddress(result.contractAddress, result.transactionHash)

      setDeploymentStep(t('deployment.status.success'))
      setDeploymentProgress(100)

      toast.success(t('deployment.deploymentSuccess'))
      setActiveTab('profile')
    } catch (error: any) {
      console.error('Deploy error:', error)
      toast.error(error.message || t('deployment.deploymentError'))
    } finally {
      setIsDeploying(false)
      setTimeout(() => {
        setDeploymentStep('')
        setDeploymentProgress(0)
      }, 3000)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success(t('common.copied'))
  }

  const getBlockExplorerUrl = (hash: string) => {
    return blockchainService.getBlockExplorerUrl(company?.blockchain || 'sepolia', hash, 'address')
  }

  const tabs = [
    { id: 'profile', label: t('settings.profile'), icon: <Building className="h-5 w-5" /> },
    { id: 'blockchain', label: t('settings.blockchain'), icon: <Shield className="h-5 w-5" /> }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('settings.title')}
          </h1>
          <p className="text-gray-600">
            {t('settings.subtitle')}
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="panel p-8"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('settings.logo')}
                </label>
                <div className="flex items-center space-x-6">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {logo ? (
                      <img src={logo} alt="Company logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="logo-upload"
                      className="btn-secondary cursor-pointer inline-flex items-center space-x-2"
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      <span>{uploading ? t('common.loading') : t('settings.uploadLogo')}</span>
                    </label>
                    {logo && (
                      <button
                        type="button"
                        onClick={() => setLogo('')}
                        className="ml-3 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.companyName')} *
                  </label>
                  <input
                    {...register('name', { required: t('errors.companyNameRequired') })}
                    className="input"
                    placeholder={t('settings.companyName')}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.industry')}
                  </label>
                  <select {...register('industry')} className="input">
                    <option value="">{t('settings.industry')}</option>
                    {industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.website')}
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('website')}
                      type="url"
                      className="input pl-10"
                      placeholder="https://your-company.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.email')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('email')}
                      type="email"
                      className="input pl-10"
                      placeholder="contact@your-company.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.country')}
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('country')}
                      className="input pl-10"
                      placeholder={t('settings.country')}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('settings.description')}
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="input"
                  placeholder={t('settings.description')}
                />
              </div>

              <div className="flex justify-end">
                <button type="submit" className="btn-primary flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>{t('settings.save')}</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Blockchain Tab */}
        {activeTab === 'blockchain' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Contract Status */}
            <div className="panel p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{t('settings.smartContract')}</h3>
                  <p className="text-gray-600">{t('settings.contractStatus')}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {company?.contractAddress ? (
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4" />
                      <span>{t('settings.deployed')}</span>
                    </div>
                  ) : (
                    <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                      {t('settings.notDeployed')}
                    </div>
                  )}
                </div>
              </div>

              {company?.contractAddress ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{t('settings.contractAddress')}</p>
                      <p className="font-mono text-sm text-gray-900">{company.contractAddress}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => copyToClipboard(company.contractAddress!)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <a
                        href={getBlockExplorerUrl(company.contractAddress)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-purple-600 transition-colors duration-200"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-6">
                    {t('deployment.subtitle')}
                  </p>
                  
                  {!watchedName && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">
                            {t('dashboard.setupRequired')}
                          </p>
                          <p className="text-sm text-yellow-700">
                            {t('dashboard.setupDescription')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => setShowTokenTypeModal(true)}
                    disabled={!watchedName}
                    className="btn-primary flex items-center space-x-2 mx-auto"
                  >
                    <Shield className="h-4 w-4" />
                    <span>{t('settings.deployContract')}</span>
                  </button>

                  {/* Deployment Progress */}
                  {isDeploying && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3 mb-3">
                        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                        <p className="text-sm text-blue-800 font-medium">
                          {deploymentStep}
                        </p>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${deploymentProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Available Networks */}
            <div className="panel p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t('settings.availableNetworks')}
              </h3>
              <BlockchainSelector
                selectedBlockchain={selectedBlockchain}
                onSelect={setSelectedBlockchain}
                tokenType={selectedTokenType}
              />
            </div>
          </motion.div>
        )}

        {/* Token Type Modal */}
        <TokenTypeModal
          isOpen={showTokenTypeModal}
          onClose={() => setShowTokenTypeModal(false)}
          onSelect={(tokenType) => {
            setSelectedTokenType(tokenType)
            setShowTokenTypeModal(false)
            handleDeployContract()
          }}
          selectedType={selectedTokenType}
        />
      </div>
    </div>
  )
}

export default CompanySettings