import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, FileCheck, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const DepartmentManagerValidation = () => {
  const [pendingValidations, setPendingValidations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOccurrence, setSelectedOccurrence] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const { toast } = useToast();

  const fetchPendingValidations = async () => {
    try {
      const response = await api.get('/validation/pending-validation');
      setPendingValidations(response.data);
    } catch (error) {
      toast({
        title: 'Erro ao carregar validações',
        description: 'Não foi possível carregar a lista de ocorrências pendentes de validação.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingValidations();
  }, []);

  const handleValidationClick = (occurrence, type) => {
    setSelectedOccurrence(occurrence);
    setActionType(type);
    setRejectionReason('');
    setIsDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedOccurrence) return;

    setIsSubmitting(true);
    try {
      await api.post(`/validation/occurrence/${selectedOccurrence.id}/approve`);

      toast({
        title: 'Ocorrência Aprovada',
        description: `A ocorrência #${selectedOccurrence.id} foi aprovada e marcada como FECHADA.`,
      });

      fetchPendingValidations();
      setIsDialogOpen(false);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erro desconhecido ao aprovar ocorrência.';
      toast({
        title: 'Erro na Aprovação',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!selectedOccurrence || !rejectionReason) {
      toast({
        title: 'Motivo Obrigatório',
        description: 'O motivo da rejeição deve ser preenchido.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { rejection_reason: rejectionReason };
      await api.post(`/validation/occurrence/${selectedOccurrence.id}/reject`, payload);

      toast({
        title: 'Ocorrência Rejeitada',
        description: `A ocorrência #${selectedOccurrence.id} foi rejeitada e retornou para EM PROGRESSO.`,
      });

      fetchPendingValidations();
      setIsDialogOpen(false);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erro desconhecido ao rejeitar ocorrência.';
      toast({
        title: 'Erro na Rejeição',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileCheck className="w-6 h-6" /> Validação de Conclusão
        </h1>
        <p className="text-gray-500">
          Revise as ocorrências marcadas como resolvidas pelo seu time antes de fechar para o cidadão.
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pendingValidations.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-6 text-center text-gray-500">
                <CheckCircle className="w-8 h-8 mx-auto mb-3 text-green-500" />
                <p>Nenhuma ocorrência pendente de validação. Tudo validado!</p>
              </CardContent>
            </Card>
          ) : (
            pendingValidations.map((occurrence) => (
              <Card key={occurrence.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ocorrência #{occurrence.id}
                  </CardTitle>
                  <Badge variant="secondary">{occurrence.department_name}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold mb-2">{occurrence.title}</div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                    Notas de Execução: {occurrence.execution_notes || 'N/A'}
                  </p>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>Concluído em: {new Date(occurrence.completed_at).toLocaleDateString()}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleValidationClick(occurrence, 'approve')}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <ThumbsUp className="w-4 h-4 mr-1" /> Aprovar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleValidationClick(occurrence, 'reject')}
                        variant="destructive"
                      >
                        <ThumbsDown className="w-4 h-4 mr-1" /> Rejeitar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{actionType === 'approve' ? 'Aprovar Conclusão' : 'Rejeitar Conclusão'}</DialogTitle>
            <DialogDescription>
              Ocorrência #{selectedOccurrence?.id}: {selectedOccurrence?.title}
            </DialogDescription>
          </DialogHeader>
          {actionType === 'approve' ? (
            <>
              <p className="py-4">
                Confirma que a ocorrência foi resolvida satisfatoriamente e pode ser marcada como **FECHADA**?
              </p>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="button" onClick={handleApprove} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Confirmar Aprovação
                </Button>
              </DialogFooter>
            </>
          ) : (
            <form onSubmit={handleReject}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="rejection_reason">Motivo da Rejeição</Label>
                  <Textarea
                    id="rejection_reason"
                    placeholder="Explique por que a conclusão foi rejeitada e o que precisa ser refeito..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="destructive" disabled={isSubmitting || !rejectionReason}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-2 h-4 w-4" />
                  )}
                  Rejeitar e Retornar
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default DepartmentManagerValidation;
