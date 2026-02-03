import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, AlertTriangle, CheckCircle, Clock, Users, Send } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const priorityOptions = [
  { value: 'LOW', label: 'Baixa', icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
  { value: 'MEDIUM', label: 'Média', icon: <Clock className="w-4 h-4 text-yellow-500" /> },
  { value: 'HIGH', label: 'Alta', icon: <AlertTriangle className="w-4 h-4 text-orange-500" /> },
  { value: 'URGENT', label: 'Urgente', icon: <Zap className="w-4 h-4 text-red-500" /> },
];

const AdminTriagePage = () => {
  const [occurrences, setOccurrences] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOccurrence, setSelectedOccurrence] = useState(null);
  const [assignmentData, setAssignmentData] = useState({
    department_id: '',
    priority: 'MEDIUM',
    assigned_to_id: '',
    notes: '',
  });
  const [departmentUsers, setDepartmentUsers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchPendingTriage = async () => {
    try {
      const response = await api.get('/triage/occurrences/pending-triage');
      setOccurrences(response.data);
    } catch (error) {
      toast({
        title: 'Erro ao carregar ocorrências',
        description: 'Não foi possível carregar a lista de ocorrências pendentes de triagem.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      // Assumindo que existe uma rota para buscar todos os departamentos.
      // Se não existir, precisarei criar uma rota no backend (ex: /api/departments).
      // Por enquanto, vou assumir que a rota /api/admin/departments existe.
      const response = await api.get('/admin/departments');
      setDepartments(response.data);
    } catch (error) {
      toast({
        title: 'Erro ao carregar departamentos',
        description: 'Não foi possível carregar a lista de departamentos.',
        variant: 'destructive',
      });
    }
  };

  const fetchDepartmentUsers = async (departmentId) => {
    if (!departmentId) {
      setDepartmentUsers([]);
      return;
    }
    try {
      const response = await api.get(`/triage/departments/${departmentId}/users`);
      setDepartmentUsers(response.data);
    } catch (error) {
      toast({
        title: 'Erro ao carregar usuários',
        description: 'Não foi possível carregar os usuários do departamento selecionado.',
        variant: 'destructive',
      });
      setDepartmentUsers([]);
    }
  };

  useEffect(() => {
    fetchPendingTriage();
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchDepartmentUsers(assignmentData.department_id);
  }, [assignmentData.department_id]);

  const handleTriageClick = (occurrence) => {
    setSelectedOccurrence(occurrence);
    setAssignmentData({
      department_id: '',
      priority: 'MEDIUM',
      assigned_to_id: '',
      notes: '',
    });
    setDepartmentUsers([]);
    setIsDialogOpen(true);
  };

  const handleAssignment = async (e) => {
    e.preventDefault();
    if (!selectedOccurrence || !assignmentData.department_id || !assignmentData.priority) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Selecione o Departamento e a Prioridade.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        department_id: parseInt(assignmentData.department_id),
        priority: assignmentData.priority,
        assigned_to_id: assignmentData.assigned_to_id ? parseInt(assignmentData.assigned_to_id) : null,
        notes: assignmentData.notes, // Notas não são usadas na API, mas mantidas para futuro
      };

      await api.post(`/triage/occurrences/${selectedOccurrence.id}/assign`, payload);

      toast({
        title: 'Ocorrência Atribuída',
        description: `A ocorrência #${selectedOccurrence.id} foi atribuída com sucesso.`,
      });

      // Recarregar a lista e fechar o modal
      fetchPendingTriage();
      setIsDialogOpen(false);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erro desconhecido ao atribuir ocorrência.';
      toast({
        title: 'Erro na Atribuição',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadge = (priority) => {
    const option = priorityOptions.find(opt => opt.value === priority);
    if (!option) return null;
    return (
      <Badge variant="outline" className={`flex items-center gap-1 ${priority === 'URGENT' ? 'bg-red-100 text-red-600 border-red-300' : priority === 'HIGH' ? 'bg-orange-100 text-orange-600 border-orange-300' : priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-600 border-yellow-300' : 'bg-green-100 text-green-600 border-green-300'}`}>
        {option.icon}
        {option.label}
      </Badge>
    );
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
        <h1 className="text-3xl font-bold">Triagem de Ocorrências Pendentes</h1>
        <p className="text-gray-500">
          Revise e atribua um departamento e prioridade para as novas ocorrências registradas pelos cidadãos.
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {occurrences.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-6 text-center text-gray-500">
                <CheckCircle className="w-8 h-8 mx-auto mb-3 text-green-500" />
                <p>Nenhuma ocorrência pendente de triagem. Tudo sob controle!</p>
              </CardContent>
            </Card>
          ) : (
            occurrences.map((occurrence) => (
              <Card key={occurrence.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ocorrência #{occurrence.id}
                  </CardTitle>
                  <Badge variant="secondary">{occurrence.status}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold mb-2">{occurrence.title}</div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{occurrence.description}</p>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>{new Date(occurrence.created_at).toLocaleDateString()}</span>
                    <Button
                      size="sm"
                      onClick={() => handleTriageClick(occurrence)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Triar e Atribuir
                    </Button>
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
            <DialogTitle>Triagem e Atribuição</DialogTitle>
            <DialogDescription>
              Ocorrência #{selectedOccurrence?.id}: {selectedOccurrence?.title}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignment}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="department">Departamento de Destino</Label>
                <Select
                  value={assignmentData.department_id}
                  onValueChange={(value) => setAssignmentData(prev => ({ ...prev, department_id: value, assigned_to_id: '' }))}
                  required
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Selecione o Departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={String(dept.id)}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={assignmentData.priority}
                  onValueChange={(value) => setAssignmentData(prev => ({ ...prev, priority: value }))}
                  required
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Selecione a Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="flex items-center gap-2">
                        {opt.icon} {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned_to">Atribuir a (Opcional)</Label>
                <Select
                  value={assignmentData.assigned_to_id}
                  onValueChange={(value) => setAssignmentData(prev => ({ ...prev, assigned_to_id: value }))}
                  disabled={!assignmentData.department_id || departmentUsers.length === 0}
                >
                  <SelectTrigger id="assigned_to">
                    <SelectValue placeholder={!assignmentData.department_id ? "Selecione um departamento primeiro" : departmentUsers.length === 0 ? "Nenhum usuário disponível" : "Selecione um Usuário"} />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentUsers.map((user) => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        {user.name} ({user.user_type === 'admin' ? 'Admin' : 'Gestor/Prestador'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas de Triagem (Opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Adicione notas relevantes para o departamento..."
                  value={assignmentData.notes}
                  onChange={(e) => setAssignmentData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !assignmentData.department_id || !assignmentData.priority}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Atribuir Ocorrência
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminTriagePage;
