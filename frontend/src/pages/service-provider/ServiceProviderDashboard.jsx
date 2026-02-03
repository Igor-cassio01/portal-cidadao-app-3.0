import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, CheckCircle, Wrench, NotebookPen, Upload, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import ServiceProviderLayout from '@/components/service-provider/ServiceProviderLayout';
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
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ServiceProviderDashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [completionData, setCompletionData] = useState({
    execution_notes: '',
    materials_used: '',
    after_photo: null,
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/execution/my-assignments');
      setAssignments(response.data.assignments || response.data || []);
    } catch (error) {
      console.error('Erro ao carregar atribuições:', error);
      setError('Não foi possível carregar a lista de ocorrências atribuídas.');
      toast({
        title: 'Erro ao carregar atribuições',
        description: 'Não foi possível carregar a lista de ocorrências atribuídas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleStartExecution = async (assignmentId) => {
    try {
      await api.post(`/execution/occurrence/${assignmentId}/start`);
      toast({
        title: 'Execução Iniciada',
        description: `A execução da ocorrência #${assignmentId} foi registrada.`,
      });
      fetchAssignments(); // Recarrega a lista
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erro desconhecido ao iniciar execução.';
      toast({
        title: 'Erro ao Iniciar',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCompletionData(prev => ({ ...prev, after_photo: file }));
      
      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompleteClick = (assignment) => {
    setSelectedAssignment(assignment);
    setCompletionData({
      execution_notes: '',
      materials_used: '',
      after_photo: null,
    });
    setPhotoPreview(null);
    setIsCompleteDialogOpen(true);
  };

  const handleCompleteExecution = async (e) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setIsSubmitting(true);
    try {
      const payload = {
        execution_notes: completionData.execution_notes,
        materials_used: completionData.materials_used,
      };

      // 1. Enviar a foto "Depois" se existir
      if (completionData.after_photo) {
        const formData = new FormData();
        formData.append('file', completionData.after_photo);

        try {
          await api.post(`/execution/occurrence/${selectedAssignment.id}/upload_after_photo`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } catch (photoError) {
          console.error('Erro ao fazer upload da foto:', photoError);
          // Continua mesmo se o upload falhar
        }
      }

      // 2. Completar a execução
      await api.post(`/execution/occurrence/${selectedAssignment.id}/complete`, payload);

      toast({
        title: 'Execução Concluída',
        description: `A ocorrência #${selectedAssignment.id} foi marcada como concluída.`,
      });

      setIsCompleteDialogOpen(false);
      fetchAssignments();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erro desconhecido ao completar execução.';
      toast({
        title: 'Erro ao Completar',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  

  if (loading) {
    return (
      <ServiceProviderLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </ServiceProviderLayout>
    );
  }

  return (
    <ServiceProviderLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard do Prestador</h1>
          <p className="text-gray-600">Gerencie suas atribuições e registre execuções</p>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Atribuições</p>
                  <p className="text-3xl font-bold text-gray-900">{assignments.length}</p>
                </div>
                <NotebookPen className="w-10 h-10 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Em Progresso</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {assignments.filter(a => a.status === 'in_progress').length}
                  </p>
                </div>
                <Wrench className="w-10 h-10 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Concluídas</p>
                  <p className="text-3xl font-bold text-green-600">
                    {assignments.filter(a => a.status === 'completed').length}
                  </p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Atribuições */}
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <NotebookPen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma atribuição
                </h3>
                <p className="text-gray-600">
                  Você não tem ocorrências atribuídas no momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            assignments.map((assignment) => (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          #{assignment.id} - {assignment.title}
                        </h3>
                        <Badge className={assignment.status === 'completed' ? 'bg-green-100 text-green-800' : assignment.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                          {assignment.status === 'completed' ? 'Concluída' : assignment.status === 'in_progress' ? 'Em Progresso' : 'Pendente'}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{assignment.description}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Categoria</p>
                          <p className="font-medium">{assignment.category_name || 'Não informada'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Endereço</p>
                          <p className="font-medium">{assignment.address || 'Não informado'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Prioridade</p>
                          <p className="font-medium capitalize">{assignment.priority || 'Normal'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Data de Criação</p>
                          <p className="font-medium">
                            {assignment.created_at 
                              ? new Date(assignment.created_at).toLocaleDateString('pt-BR')
                              : 'Não informada'}
                          </p>
                        </div>
                      </div>

                      {assignment.notes && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                          <p className="text-sm text-blue-900">
                            <span className="font-medium">Notas:</span> {assignment.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Foto da Ocorrência */}
                    {assignment.photo_url && (
                      <div className="flex-shrink-0 ml-4">
                        <img
                          src={assignment.photo_url}
                          alt={assignment.title}
                          className="w-32 h-32 rounded-lg object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex gap-3">
                    {assignment.status === 'pending' && (
                      <Button
                        onClick={() => handleStartExecution(assignment.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Iniciar Execução
                      </Button>
                    )}

                    {(assignment.status === 'pending' || assignment.status === 'in_progress') && (
                      <Button
                        onClick={() => handleCompleteClick(assignment)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Marcar como Concluída
                      </Button>
                    )}

                    {assignment.status === 'completed' && (
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <CheckCircle className="w-5 h-5" />
                        Concluída
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Dialog de Conclusão */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Marcar Execução como Concluída</DialogTitle>
            <DialogDescription>
              Registre os detalhes da execução e envie a foto do resultado
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCompleteExecution} className="space-y-4">
            {/* Notas de Execução */}
            <div>
              <Label htmlFor="execution_notes">Notas de Execução</Label>
              <Textarea
                id="execution_notes"
                placeholder="Descreva o que foi feito..."
                value={completionData.execution_notes}
                onChange={(e) => setCompletionData(prev => ({ ...prev, execution_notes: e.target.value }))}
                className="mt-2"
                rows={3}
              />
            </div>

            {/* Materiais Utilizados */}
            <div>
              <Label htmlFor="materials_used">Materiais Utilizados</Label>
              <Input
                id="materials_used"
                placeholder="Ex: Cimento, areia, tijolos..."
                value={completionData.materials_used}
                onChange={(e) => setCompletionData(prev => ({ ...prev, materials_used: e.target.value }))}
                className="mt-2"
              />
            </div>

            {/* Upload de Foto */}
            <div>
              <Label htmlFor="after_photo">Foto do Resultado (Depois)</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4">
                {photoPreview ? (
                  <div className="space-y-2">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPhotoPreview(null);
                        setCompletionData(prev => ({ ...prev, after_photo: null }));
                      }}
                    >
                      Remover Foto
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <div className="flex flex-col items-center justify-center py-6">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        Clique para selecionar uma foto
                      </span>
                    </div>
                    <input
                      id="after_photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCompleteDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !completionData.execution_notes}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Concluir
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ServiceProviderLayout>
  );
};

export default ServiceProviderDashboard;
