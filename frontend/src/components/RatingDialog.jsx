import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Star, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const RatingDialog = ({ isOpen, onClose, occurrence, onSubmit }) => {
  const { api } = useAuth()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Por favor, selecione uma classificação')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      // Enviar avaliação para a API
      await api.post(`/occurrences/${occurrence.id}/rate`, {
        rating: rating,
        feedback: feedback || null
      })

      // Chamar callback de sucesso
      if (onSubmit) {
        onSubmit()
      }

      // Fechar dialog
      handleClose()
    } catch (err) {
      console.error('Erro ao enviar avaliação:', err)
      setError('Erro ao enviar avaliação. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setRating(0)
    setHoverRating(0)
    setFeedback('')
    setError('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Avaliar Serviço</DialogTitle>
          <DialogDescription>
            Como foi o atendimento para resolver "{occurrence?.title}"?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Classificação por Estrelas */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Classificação</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-600">
                Você selecionou {rating} estrela{rating !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <label htmlFor="feedback" className="text-sm font-medium">
              Comentário (opcional)
            </label>
            <Textarea
              id="feedback"
              placeholder="Compartilhe sua experiência com o serviço..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-24"
            />
          </div>

          {/* Erro */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Avaliação'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RatingDialog
