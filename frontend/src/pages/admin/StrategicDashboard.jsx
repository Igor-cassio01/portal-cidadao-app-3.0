import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, CheckCircle, Clock, Star,
  MapPin, Award, Share2, Download, Target, Zap
} from 'lucide-react';
import axios from 'axios';

const StrategicDashboard = () => {
  const [workflowMetrics, setWorkflowMetrics] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [successStories, setSuccessStories] = useState([]);
  const [evolution, setEvolution] = useState([]);
  const [campaignMaterial, setCampaignMaterial] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStrategicData();
  }, []);

  const loadStrategicData = async () => {
    try {
      setLoading(true);
      
      // Carregar todos os dados estratégicos
      const [kpisRes, neighborhoodsRes, departmentsRes, storiesRes, evolutionRes, campaignRes] = await Promise.all([
        axios.get('/api/strategic/political-kpis'),
        axios.get('/api/strategic/neighborhood-priority'),
        axios.get('/api/strategic/performance-by-department'),
        axios.get('/api/strategic/success-stories'),
        axios.get('/api/strategic/management-evolution'),
        axios.get('/api/strategic/campaign-material'),
        axios.get('/api/strategic/workflow-metrics')
      ]);

      setKpis(kpisRes.data.data);
      setNeighborhoods(neighborhoodsRes.data.data);
      setDepartments(departmentsRes.data.data);
      setSuccessStories(storiesRes.data.data);
      setEvolution(evolutionRes.data.data);
      setCampaignMaterial(campaignRes.data.data);
      setWorkflowMetrics(workflowMetricsRes.data.data);
    } catch (error) {
      console.error('Erro ao carregar dados estratégicos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (value) => {
    return value >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const getTrendColor = (value) => {
    return value >= 0 ? 'text-green-500' : 'text-red-500';
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados estratégicos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Estratégico */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Estratégico</h1>
            <p className="text-blue-100 mt-2">Métricas de Popularidade e Gestão Municipal</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">Lavras-MG</div>
            <div className="text-blue-100">Portal do Cidadão</div>
          </div>
        </div>
      </div>

      {/* KPIs Políticos Principais */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Índice de Satisfação Popular</p>
                  <p className="text-3xl font-bold text-green-700">{kpis.satisfaction_index}%</p>
                  <p className="text-green-600 text-sm">⭐ {kpis.avg_rating}/5.0 média</p>
                </div>
                <Award className="h-12 w-12 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Taxa de Resolução</p>
                  <p className="text-3xl font-bold text-blue-700">{kpis.resolution_rate}%</p>
                  <p className="text-blue-600 text-sm">{kpis.resolved_occurrences} resolvidas</p>
                </div>
                <CheckCircle className="h-12 w-12 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Cidadãos Atendidos</p>
                  <p className="text-3xl font-bold text-purple-700">{kpis.citizens_served}</p>
                  <p className="text-purple-600 text-sm">Últimos 30 dias</p>
                </div>
                <Users className="h-12 w-12 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Tempo Médio de Resposta</p>
                  <p className="text-3xl font-bold text-orange-700">{kpis.avg_resolution_time}h</p>
                  <p className="text-orange-600 text-sm">Agilidade municipal</p>
                </div>
                <Zap className="h-12 w-12 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Métricas do Workflow */}
      {workflowMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio de Triagem (h)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workflowMetrics.avg_triage_time}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio de Execução (h)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workflowMetrics.avg_execution_time}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Rejeição (%)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workflowMetrics.rejection_rate}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Funil de Ocorrências</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[...Object.entries(workflowMetrics.funnel).map(([name, value]) => ({ name, value }))]}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Evolução da Gestão */}
      {evolution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução da Gestão Municipal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={evolution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month_name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="satisfaction_index" 
                  stackId="1"
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.6}
                  name="Satisfação (%)"
                />
                <Area 
                  type="monotone" 
                  dataKey="resolution_rate" 
                  stackId="2"
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6}
                  name="Taxa de Resolução (%)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Bairros Prioritários */}
        {neighborhoods.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Top 5 Bairros para Força-Tarefa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {neighborhoods.slice(0, 5).map((neighborhood, index) => (
                  <div key={neighborhood.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={index < 2 ? "destructive" : index < 4 ? "default" : "secondary"}>
                        #{index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{neighborhood.name}</p>
                        <p className="text-sm text-gray-600">
                          {neighborhood.total_occurrences} ocorrências • 
                          {neighborhood.resolution_rate?.toFixed(1)}% resolvidas
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Score: {neighborhood.priority_score?.toFixed(1)}</p>
                      <Badge variant={neighborhood.priority_score > 70 ? "destructive" : "default"}>
                        {neighborhood.priority_score > 70 ? "Urgente" : "Moderado"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance por Departamento */}
        {departments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Performance por Secretaria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departments.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="performance_score" fill="#3b82f6" name="Score de Performance" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Histórias de Sucesso */}
      {successStories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Histórias de Sucesso (Material para Divulgação)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {successStories.slice(0, 4).map((story) => (
                <div key={story.id} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <Badge className="bg-green-100 text-green-800">
                      ⭐ {story.rating}/5
                    </Badge>
                    <Badge variant="outline">
                      {story.resolution_time_text}
                    </Badge>
                  </div>
                  <h4 className="font-medium mb-2">{story.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{story.neighborhood}</p>
                  {story.feedback && (
                    <p className="text-sm italic text-green-700 mb-3">"{story.feedback}"</p>
                  )}
                  <div className="bg-white p-2 rounded border text-xs">
                    <strong>Para redes sociais:</strong>
                    <p className="mt-1">{story.social_media_text}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Material de Campanha */}
      {campaignMaterial && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Material de Campanha Pronto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Frases para Campanha */}
              <div>
                <h4 className="font-medium mb-3">Frases de Impacto</h4>
                <div className="space-y-2">
                  {campaignMaterial.campaign_phrases.map((phrase, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-blue-800 font-medium">{phrase}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Posts para Redes Sociais */}
              <div>
                <h4 className="font-medium mb-3">Posts Prontos</h4>
                <div className="space-y-4">
                  {campaignMaterial.social_posts.map((post, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge>{post.platform}</Badge>
                        <Badge variant="outline">{post.type}</Badge>
                      </div>
                      <p className="text-sm whitespace-pre-line">{post.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Hashtags */}
            <div className="mt-6">
              <h4 className="font-medium mb-3">Hashtags Sugeridas</h4>
              <div className="flex flex-wrap gap-2">
                {campaignMaterial.hashtags.map((hashtag, index) => (
                  <Badge key={index} variant="secondary">{hashtag}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botões de Ação */}
      <div className="flex gap-4">
        <Button onClick={() => window.print()} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportar Relatório
        </Button>
        <Button variant="outline" onClick={loadStrategicData} className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Atualizar Dados
        </Button>
      </div>
    </div>
  );
};

export default StrategicDashboard;
