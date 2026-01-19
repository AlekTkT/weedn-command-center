'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, CheckCircle, Clock, AlertTriangle, Play, History, ChevronDown, ChevronUp, Sparkles, ArrowRight, X } from 'lucide-react';

interface AgentTask {
  id: string;
  agentId: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'needs_attention';
  createdAt: string;
  completedAt?: string;
  result?: string;
  category: string;
  actionType?: 'api' | 'prompt' | 'redirect' | 'automation';
  actionPayload?: {
    endpoint?: string;
    method?: string;
    body?: any;
    prompt?: string;
    redirectUrl?: string;
    automationId?: string;
  };
  recommendations?: string[];
}

interface Agent {
  id: string;
  name: string;
  icon: string;
  status: string;
  color: string;
}

interface AgentTasksPanelProps {
  agents: Agent[];
  onExecuteTask?: (task: AgentTask) => void;
}

export default function AgentTasksPanel({ agents, onExecuteTask }: AgentTasksPanelProps) {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [history, setHistory] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [objectiveProgress, setObjectiveProgress] = useState(0);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [executingTask, setExecutingTask] = useState<string | null>(null);
  const [taskResult, setTaskResult] = useState<{ taskId: string; result: string } | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const url = selectedAgent
        ? `/api/tasks?agentId=${selectedAgent}&type=all`
        : '/api/tasks?type=all';
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setTasks(data.generated || []);
        setHistory(data.history || []);
        setObjectiveProgress(data.context?.objectiveProgress || 0);
      }
    } catch (error) {
      console.error('Erreur chargement tâches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedAgent]);

  const executeTask = async (task: AgentTask) => {
    setExecutingTask(task.id);
    setExpandedTask(task.id);

    try {
      if (task.actionType === 'prompt' && task.actionPayload?.prompt) {
        // Appeler l'API Claude avec le prompt de l'agent
        const res = await fetch('/api/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: task.actionPayload.prompt,
            agentId: task.agentId,
            context: { taskId: task.id, category: task.category }
          })
        });

        const data = await res.json();
        if (data.success && data.response) {
          setTaskResult({ taskId: task.id, result: data.response });
          // Mettre à jour le statut de la tâche
          await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'add',
              task: { ...task, status: 'completed', result: data.response, completedAt: new Date().toISOString() }
            })
          });
        }
      } else if (task.actionType === 'redirect' && task.actionPayload?.redirectUrl) {
        window.open(task.actionPayload.redirectUrl, '_blank');
      } else if (task.actionType === 'automation' && task.actionPayload?.automationId) {
        // Déclencher l'automation Make.com
        const res = await fetch('/api/automations/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ automationId: task.actionPayload.automationId })
        });
        const data = await res.json();
        setTaskResult({ taskId: task.id, result: data.message || 'Automation déclenchée' });
      } else {
        // Fallback: utiliser onExecuteTask
        if (onExecuteTask) onExecuteTask(task);
      }
    } catch (error) {
      console.error('Erreur exécution tâche:', error);
      setTaskResult({ taskId: task.id, result: 'Erreur lors de l\'exécution' });
    } finally {
      setExecutingTask(null);
    }
  };

  const getStatusIcon = (status: AgentTask['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-emerald-400" size={16} />;
      case 'in_progress':
        return <Play className="text-blue-400" size={16} />;
      case 'needs_attention':
        return <AlertTriangle className="text-orange-400" size={16} />;
      default:
        return <Clock className="text-gray-400" size={16} />;
    }
  };

  const getPriorityColor = (priority: AgentTask['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getAgentData = (agentId: string) => {
    return agents.find(a => a.id === agentId);
  };

  const tasksByStatus = {
    needs_attention: tasks.filter(t => t.status === 'needs_attention'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    pending: tasks.filter(t => t.status === 'pending'),
  };

  const completedTasks = history.filter(t => t.status === 'completed').slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Header avec progression objectif */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👑</span>
            <div>
              <h3 className="font-semibold text-white">Chef d'Orchestre</h3>
              <p className="text-xs text-gray-400">Distribution automatique des tâches</p>
            </div>
          </div>
          <motion.button
            whileTap={{ rotate: 360 }}
            onClick={fetchTasks}
            className="p-2 hover:bg-white/10 rounded-lg"
          >
            <RefreshCw className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} size={18} />
          </motion.button>
        </div>

        {/* Barre de progression objectif */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Objectif +40% CA</span>
            <span>{objectiveProgress}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${objectiveProgress}%` }}
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
            />
          </div>
        </div>

        {/* Filtres agents */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedAgent(null)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
              !selectedAgent
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Tous
          </button>
          {agents.map(agent => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 ${
                selectedAgent === agent.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <span>{agent.icon}</span>
              <span className="hidden sm:inline">{agent.name.replace('Agent ', '')}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Toggle Historique */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowHistory(false)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            !showHistory
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Tâches actives ({tasks.length})
        </button>
        <button
          onClick={() => setShowHistory(true)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            showHistory
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <History size={16} />
          Historique ({completedTasks.length})
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!showHistory ? (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Tâches nécessitant attention */}
            {tasksByStatus.needs_attention.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-orange-400 flex items-center gap-2">
                  <AlertTriangle size={14} />
                  Nécessite attention ({tasksByStatus.needs_attention.length})
                </h4>
                {tasksByStatus.needs_attention.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    agent={getAgentData(task.agentId)}
                    onExecute={executeTask}
                    getPriorityColor={getPriorityColor}
                    getStatusIcon={getStatusIcon}
                    isExpanded={expandedTask === task.id}
                    onToggleExpand={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                    isExecuting={executingTask === task.id}
                    taskResult={taskResult?.taskId === task.id ? taskResult.result : undefined}
                    onClearResult={() => setTaskResult(null)}
                  />
                ))}
              </div>
            )}

            {/* Tâches en cours */}
            {tasksByStatus.in_progress.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-blue-400 flex items-center gap-2">
                  <Play size={14} />
                  En cours ({tasksByStatus.in_progress.length})
                </h4>
                {tasksByStatus.in_progress.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    agent={getAgentData(task.agentId)}
                    onExecute={executeTask}
                    getPriorityColor={getPriorityColor}
                    getStatusIcon={getStatusIcon}
                    isExpanded={expandedTask === task.id}
                    onToggleExpand={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                    isExecuting={executingTask === task.id}
                    taskResult={taskResult?.taskId === task.id ? taskResult.result : undefined}
                    onClearResult={() => setTaskResult(null)}
                  />
                ))}
              </div>
            )}

            {/* Tâches en attente */}
            {tasksByStatus.pending.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Clock size={14} />
                  En attente ({tasksByStatus.pending.length})
                </h4>
                {tasksByStatus.pending.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    agent={getAgentData(task.agentId)}
                    onExecute={executeTask}
                    getPriorityColor={getPriorityColor}
                    getStatusIcon={getStatusIcon}
                    isExpanded={expandedTask === task.id}
                    onToggleExpand={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                    isExecuting={executingTask === task.id}
                    taskResult={taskResult?.taskId === task.id ? taskResult.result : undefined}
                    onClearResult={() => setTaskResult(null)}
                  />
                ))}
              </div>
            )}

            {tasks.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle size={40} className="mx-auto mb-2 opacity-50" />
                <p>Aucune tâche en attente</p>
                <p className="text-xs">Le Chef d'Orchestre génère les tâches automatiquement</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            {completedTasks.length > 0 ? (
              completedTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  agent={getAgentData(task.agentId)}
                  getPriorityColor={getPriorityColor}
                  getStatusIcon={getStatusIcon}
                  showResult
                  isExpanded={expandedTask === task.id}
                  onToggleExpand={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <History size={40} className="mx-auto mb-2 opacity-50" />
                <p>Aucune tâche complétée</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Composant carte de tâche amélioré
function TaskCard({
  task,
  agent,
  onExecute,
  getPriorityColor,
  getStatusIcon,
  showResult = false,
  isExpanded = false,
  onToggleExpand,
  isExecuting = false,
  taskResult,
  onClearResult,
}: {
  task: AgentTask;
  agent?: Agent;
  onExecute?: (task: AgentTask) => void;
  getPriorityColor: (p: AgentTask['priority']) => string;
  getStatusIcon: (s: AgentTask['status']) => React.ReactNode;
  showResult?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  isExecuting?: boolean;
  taskResult?: string;
  onClearResult?: () => void;
}) {
  const hasRecommendations = task.recommendations && task.recommendations.length > 0;
  const canExecute = task.status !== 'completed' && onExecute;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`glass rounded-lg border overflow-hidden ${
        task.status === 'needs_attention'
          ? 'border-orange-500/30'
          : task.status === 'in_progress'
          ? 'border-blue-500/30'
          : isExpanded
          ? 'border-emerald-500/30'
          : 'border-white/5'
      }`}
    >
      {/* Header de la tâche */}
      <div
        className={`p-3 ${hasRecommendations ? 'cursor-pointer hover:bg-white/5' : ''}`}
        onClick={hasRecommendations ? onToggleExpand : undefined}
      >
        <div className="flex items-start gap-3">
          {/* Agent icon */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
            style={{ backgroundColor: `${agent?.color}20` }}
          >
            {agent?.icon || '🤖'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {getStatusIcon(task.status)}
              <span className="font-medium text-white text-sm">{task.title}</span>
              <span className={`px-2 py-0.5 rounded text-xs border ${getPriorityColor(task.priority)}`}>
                {task.priority === 'high' ? 'Urgent' : task.priority === 'medium' ? 'Normal' : 'Faible'}
              </span>
            </div>

            <p className="text-xs text-gray-400 line-clamp-2">{task.description}</p>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs text-gray-500">{agent?.name}</span>
              <span className="text-xs text-gray-600">•</span>
              <span className="text-xs text-gray-500">{task.category}</span>
              {hasRecommendations && (
                <>
                  <span className="text-xs text-gray-600">•</span>
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <Sparkles size={10} />
                    {task.recommendations?.length} préconisations
                  </span>
                </>
              )}
              {task.completedAt && (
                <>
                  <span className="text-xs text-gray-600">•</span>
                  <span className="text-xs text-emerald-400">
                    ✓ {new Date(task.completedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Bouton exécuter */}
            {canExecute && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onExecute(task);
                }}
                disabled={isExecuting}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                  isExecuting
                    ? 'bg-gray-700 text-gray-400 cursor-wait'
                    : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                }`}
              >
                {isExecuting ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    Exécution...
                  </>
                ) : (
                  <>
                    <Play size={12} />
                    Exécuter
                  </>
                )}
              </button>
            )}

            {/* Toggle expand */}
            {hasRecommendations && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand?.();
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Panel des préconisations (expandable) */}
      <AnimatePresence>
        {isExpanded && hasRecommendations && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 border-t border-white/5 pt-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">Préconisations de l'agent</span>
              </div>
              <ul className="space-y-1.5">
                {task.recommendations?.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                    <ArrowRight size={12} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>

              {/* Prompt utilisé (si disponible) */}
              {task.actionPayload?.prompt && (
                <div className="mt-3 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="text-xs text-blue-400 mb-1 font-medium">Prompt de l'agent :</div>
                  <p className="text-xs text-gray-300">{task.actionPayload.prompt}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Résultat de l'exécution */}
      {taskResult && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="border-t border-emerald-500/30"
        >
          <div className="p-3 bg-emerald-500/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">Résultat de l'exécution</span>
              </div>
              <button
                onClick={onClearResult}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X size={12} className="text-gray-400" />
              </button>
            </div>
            <p className="text-xs text-gray-300 whitespace-pre-wrap">{taskResult}</p>
          </div>
        </motion.div>
      )}

      {/* Résultat historique */}
      {showResult && task.result && !taskResult && (
        <div className="px-3 pb-3">
          <div className="p-2 bg-emerald-500/10 rounded text-xs text-emerald-300">
            {task.result}
          </div>
        </div>
      )}
    </motion.div>
  );
}
