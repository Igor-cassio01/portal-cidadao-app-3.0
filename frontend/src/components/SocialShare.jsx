import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import {
  Share2,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  MessageCircle,
  Mail,
  Copy,
  Check,
  Download,
  X
} from 'lucide-react'

const SocialShare = ({ 
  title, 
  description, 
  url = window.location.href,
  imageUrl,
  hashtags = ['PortalDoCidadao', 'Lavras', 'CidadeInteligente']
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = encodeURIComponent(url)
  const shareTitle = encodeURIComponent(title)
  const shareDescription = encodeURIComponent(description)
  const shareHashtags = hashtags.join(',')

  const socialLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}&hashtags=${shareHashtags}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
    whatsapp: `https://wa.me/?text=${shareTitle}%20${shareUrl}`,
    email: `mailto:?subject=${shareTitle}&body=${shareDescription}%0A%0A${shareUrl}`
  }

  const handleShare = (platform) => {
    if (platform === 'native' && navigator.share) {
      navigator.share({
        title: title,
        text: description,
        url: url
      }).catch(err => console.log('Erro ao compartilhar:', err))
    } else if (socialLinks[platform]) {
      window.open(socialLinks[platform], '_blank', 'width=600,height=400')
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const generateSocialPost = () => {
    const post = `${title}\n\n${description}\n\n${hashtags.map(h => `#${h}`).join(' ')}\n\n${url}`
    
    const blob = new Blob([post], { type: 'text/plain' })
    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = 'post-redes-sociais.txt'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(downloadUrl)
  }

  return (
    <div className="relative">
      {/* Botão de Compartilhar */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Share2 className="w-4 h-4" />
        Compartilhar
      </Button>

      {/* Modal de Compartilhamento */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Card de Opções */}
          <Card className="absolute right-0 top-12 w-80 z-50 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Compartilhar
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Preview */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 mb-1">{title}</p>
                <p className="text-xs text-gray-600 line-clamp-2">{description}</p>
              </div>

              {/* Redes Sociais */}
              <div className="space-y-2 mb-4">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleShare('facebook')}
                >
                  <Facebook className="w-5 h-5 mr-3 text-blue-600" />
                  Compartilhar no Facebook
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleShare('twitter')}
                >
                  <Twitter className="w-5 h-5 mr-3 text-sky-500" />
                  Compartilhar no Twitter
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleShare('whatsapp')}
                >
                  <MessageCircle className="w-5 h-5 mr-3 text-green-600" />
                  Compartilhar no WhatsApp
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleShare('linkedin')}
                >
                  <Linkedin className="w-5 h-5 mr-3 text-blue-700" />
                  Compartilhar no LinkedIn
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleShare('email')}
                >
                  <Mail className="w-5 h-5 mr-3 text-gray-600" />
                  Compartilhar por E-mail
                </Button>
              </div>

              {/* Copiar Link */}
              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5 mr-3 text-green-600" />
                      Link Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5 mr-3 text-gray-600" />
                      Copiar Link
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start mt-2"
                  onClick={generateSocialPost}
                >
                  <Download className="w-5 h-5 mr-3 text-gray-600" />
                  Baixar Texto para Post
                </Button>
              </div>

              {/* Hashtags */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-600 mb-2">Hashtags sugeridas:</p>
                <div className="flex flex-wrap gap-1">
                  {hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export default SocialShare

