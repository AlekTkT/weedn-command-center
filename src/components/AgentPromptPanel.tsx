'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, History, ChevronDown, ChevronUp, Check, Square,
  CheckSquare, Trash2, Copy, RefreshCw, Save, X
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  icon: string;
  status: string;
  color: string;
}

interface DynamicItem {
  id: string;
  type: 'supplier' | 'invoice' | 'product' | 'action' | 'task';
  label: string;
  description?: string;
  selected: boolean;
  data?: any;
}

interface HistoryItem {
  id: string;
  agent: string;
  prompt: string;
  response: string;
  timestamp: Date;
  dynamicItems?: DynamicItem[];
  saved?: boolean;
}

interface AgentPromptPanelProps {
  agents: Agent[];
  onClose?: () => void;
}

// Storage key pour l'historique
const HISTORY_STORAGE_KEY = 'weedn-prompt-history';

export default function AgentPromptPanel({ agents, onClose }: AgentPromptPanelProps) {
  const [selectedAgent, setSelectedAgent] = useState<string>('weedn-central');
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [dynamicItems, setDynamicItems] = useState<DynamicItem[]>([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  // Charger l'historique depuis localStorage
  useEffect(() => {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setHistory(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      } catch (e) {
        console.error('Erreur chargement historique:', e);
      }
    }
  }, []);

  // Sauvegarder l'historique dans localStorage
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history.slice(-50))); // Garder les 50 derniers
    }
  }, [history]);

  // Parser la réponse pour extraire les éléments dynamiques
  const parseResponseForDynamicItems = (text: string, agentId: string): DynamicItem[] => {
    const items: DynamicItem[] = [];

    // Détecter les fournisseurs mentionnés
    const supplierPatterns = [
      /fournisseur[s]?\s*[:]\s*([^\n,]+)/gi,
      /(?:CBD ETHIC|HONEY KING LAB|Cali Terpenes|The New Ways|Canatura|SumUp|Colissimo|Papeo)/gi
    ];

    // Détecter les factures mentionnées
    const invoicePatterns = [
      /facture[s]?\s*(?:n°|#|:)?\s*([A-Z0-9-]+)/gi,
      /FAC-\d+-\d+/gi,
      /[A-Z]{2,4}-\d{4}-\d{3,6}/gi
    ];

    // Détecter les produits mentionnés
    const productPatterns = [
      /produit[s]?\s*[:]\s*([^\n,]+)/gi,
      /(?:fleurs?|résines?|huiles?|bonbons?)\s+CBD\s+([^\n,]+)/gi
    ];

    // Détecter les actions suggérées
    const actionPatterns = [
      /(?:action|tâche|recommandation)\s*\d*\s*[:]\s*([^\n]+)/gi,
      /[-•]\s*([^\n]{10,80})/g
    ];

    // Parser les fournisseurs
    supplierPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const label = match[1] || match[0];
        if (!items.find(i => i.label.toLowerCase() === label.toLowerCase())) {
          items.push({
            id: `supplier-${items.length}`,
            type: 'supplier',
            label: label.trim(),
            selected: false
          });
        }
      }
    });

    // Parser les factures
    invoicePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const label = match[1] || match[0];
        if (!items.find(i => i.label === label)) {
          items.push({
            id: `invoice-${items.length}`,
            type: 'invoice',
            label: label.trim(),
            selected: false
          });
        }
      }
    });

    // Parser les actions (pour tous les agents)
    let actionMatch;
    const actionRegex = /(?:^|\n)\s*[-•*]\s*([^\n]{15,100})/g;
    while ((actionMatch = actionRegex.exec(text)) !== null) {
      const label = actionMatch[1].trim();
      if (label.length > 15 && !items.find(i => i.label === label)) {
        items.push({
          id: `action-${items.length}`,
          type: 'action',
          label: label,
          selected: false
        });
      }
    }

    return items;
  };

  const sendPrompt = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setResponse('');
    setDynamicItems([]);

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          agentId: selectedAgent,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResponse(data.response);

        // Parser les éléments dynamiques
        const parsed = parseResponseForDynamicItems(data.response, selectedAgent);
        setDynamicItems(parsed);

        // Ajouter à l'historique
        const historyItem: HistoryItem = {
          id: `hist-${Date.now()}`,
          agent: selectedAgent,
          prompt,
          response: data.response,
          timestamp: new Date(),
          dynamicItems: parsed,
        };
        setHistory(prev => [...prev, historyItem]);

        // Scroll vers la réponse
        setTimeout(() => {
          responseRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        setResponse(`Erreur: ${data.error}`);
      }
    } catch (error) {
      setResponse('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const toggleDynamicItem = (id: string) => {
    setDynamicItems(prev => prev.map(item =>
      item.id === id ? { ...item, selected: !item.selected } : item
    ));
  };

  const selectAllDynamicItems = () => {
    setDynamicItems(prev => prev.map(item => ({ ...item, selected: true })));
  };

  const deselectAllDynamicItems = () => {
    setDynamicItems(prev => prev.map(item => ({ ...item, selected: false })));
  };

  const saveSelectedItems = async () => {
    const selected = dynamicItems.filter(item => item.selected);
    if (selected.length === 0) return;

    // TODO: Implémenter la sauvegarde vers les APIs respectives
    // Par exemple, ajouter les fournisseurs sélectionnés, marquer les factures, etc.
    console.log('Items sélectionnés à sauvegarder:', selected);

    // Feedback visuel
    alert(`${selected.length} élément(s) enregistré(s)`);
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setSelectedAgent(item.agent);
    setPrompt(item.prompt);
    setResponse(item.response);
    setDynamicItems(item.dynamicItems || []);
    setShowHistory(false);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    if (confirm('Supprimer tout l\'historique ?')) {
      setHistory([]);
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    }
  };

  const copyResponse = () => {
    navigator.clipboard.writeText(response);
  };

  const selectedAgentData = agents.find(a => a.id === selectedAgent);

  const quickPrompts: Record<string, string[]> = {
    'weedn-central': [
      'Quel est le statut actuel de tous les agents ?',
      'Quelles sont les priorités pour augmenter le CA cette semaine ?',
      'Génère un rapport de performance global',
    ],
    'agent-seo': [
      'Analyse le positionnement actuel sur "CBD Paris"',
      'Propose 5 mots-clés longue traîne à cibler',
      'Quelles pages doivent être optimisées en priorité ?',
    ],
    'agent-ventes': [
      'Analyse les ventes des 7 derniers jours',
      'Quels produits ont le meilleur potentiel de cross-sell ?',
      'Comment améliorer le panier moyen ?',
    ],
    'agent-contenu': [
      'Propose 3 idées d\'articles de blog',
      'Rédige un post Instagram pour les fleurs CBD',
      'Crée une story promotionnelle pour les huiles',
    ],
    'agent-support': [
      'Résume les avis Google récents',
      'Quels sont les problèmes clients récurrents ?',
      'Rédige une réponse type pour une réclamation livraison',
    ],
    'agent-inventaire': [
      'Quels produits sont en rupture imminente ?',
      'Analyse la rotation des stocks ce mois',
      'Quand doit-on passer la prochaine commande fournisseur ?',
    ],
    'agent-email': [
      'Propose une campagne newsletter pour ce weekend',
      'Quels segments de clients cibler pour une promo ?',
      'Analyse les taux d\'ouverture récents',
    ],
    'agent-analytics': [
      'Génère un rapport KPI de la semaine',
      'Quelles sont les tendances de trafic ?',
      'Compare les performances vs mois dernier',
    ],
    'agent-shopify': [
      'Quelles optimisations techniques sont prioritaires ?',
      'Analyse le score Lighthouse actuel',
      'Propose des améliorations UX pour la page produit',
    ],
    'agent-factures': [
      'Quelles factures sont en attente de traitement ?',
      'Analyse les dépenses fournisseurs du mois',
      'Quels fournisseurs ont les meilleures conditions ?',
    ],
  };

  const getItemTypeIcon = (type: DynamicItem['type']) => {
    switch (type) {
      case 'supplier': return '🏭';
      case 'invoice': return '🧾';
      case 'product': return '📦';
      case 'action': return '⚡';
      case 'task': return '✅';
      default: return '•';
    }
  };

  const getItemTypeColor = (type: DynamicItem['type']) => {
    switch (type) {
      case 'supplier': return 'border-blue-500/30 bg-blue-500/10';
      case 'invoice': return 'border-purple-500/30 bg-purple-500/10';
      case 'product': return 'border-orange-500/30 bg-orange-500/10';
      case 'action': return 'border-yellow-500/30 bg-yellow-500/10';
      case 'task': return 'border-emerald-500/30 bg-emerald-500/10';
      default: return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800/50 px-4 py-3 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <h2 className="font-semibold text-white">Console Agent Claude</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 rounded-lg transition-colors ${
              showHistory ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/10 text-gray-400'
            }`}
          >
            <History size={18} />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-gray-400">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Historique Panel */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-800/50 rounded-lg p-4 border border-white/10"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <History size={16} />
                  Historique ({history.length})
                </h3>
                {history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 size={12} />
                    Effacer tout
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun historique</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {history.slice().reverse().map((item) => {
                    const agentData = agents.find(a => a.id === item.agent);
                    const isExpanded = expandedHistoryId === item.id;
                    return (
                      <div
                        key={item.id}
                        className="bg-gray-900/50 rounded-lg border border-white/5 overflow-hidden"
                      >
                        <div
                          className="p-3 cursor-pointer hover:bg-white/5 transition-colors"
                          onClick={() => setExpandedHistoryId(isExpanded ? null : item.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span>{agentData?.icon}</span>
                              <span className="text-sm text-white">{agentData?.name}</span>
                              <span className="text-xs text-gray-500">
                                {item.timestamp.toLocaleString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {item.dynamicItems && item.dynamicItems.length > 0 && (
                                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                                  {item.dynamicItems.length} éléments
                                </span>
                              )}
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 truncate mt-1">{item.prompt}</p>
                        </div>

                        {isExpanded && (
                          <div className="p-3 border-t border-white/5 space-y-2">
                            <p className="text-xs text-gray-300 whitespace-pre-wrap line-clamp-4">
                              {item.response}
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); loadHistoryItem(item); }}
                                className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30"
                              >
                                Recharger
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item.id); }}
                                className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Agent Selector */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Agent actif</label>
          <div className="flex flex-wrap gap-2">
            {agents.map(agent => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  selectedAgent === agent.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                <span>{agent.icon}</span>
                <span className="text-sm">{agent.name.replace('Agent ', '')}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Prompts */}
        {quickPrompts[selectedAgent] && (
          <div>
            <label className="block text-sm text-gray-400 mb-2">Prompts rapides</label>
            <div className="flex flex-wrap gap-2">
              {quickPrompts[selectedAgent].map((qp, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(qp)}
                  className="px-3 py-1.5 text-xs bg-gray-800/50 text-gray-300 rounded-full hover:bg-gray-700/50 transition-colors border border-white/5"
                >
                  {qp}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Prompt Input */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Message pour {selectedAgentData?.icon} {selectedAgentData?.name}
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Écris ton message ici..."
            className="w-full h-24 px-4 py-3 bg-gray-800/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey) {
                sendPrompt();
              }
            }}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">⌘ + Enter pour envoyer</span>
            <button
              onClick={sendPrompt}
              disabled={loading || !prompt.trim()}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                loading || !prompt.trim()
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Réflexion...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Envoyer
                </>
              )}
            </button>
          </div>
        </div>

        {/* Response */}
        <AnimatePresence>
          {response && (
            <motion.div
              ref={responseRef}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Response Text */}
              <div className="bg-gray-800/50 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{selectedAgentData?.icon}</span>
                    <span className="font-medium text-white">{selectedAgentData?.name}</span>
                    <span className="text-xs text-gray-500">• Réponse</span>
                  </div>
                  <button
                    onClick={copyResponse}
                    className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white"
                    title="Copier"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <div className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                  {response}
                </div>
              </div>

              {/* Dynamic Items */}
              {dynamicItems.length > 0 && (
                <div className="bg-gray-800/50 rounded-lg p-4 border border-emerald-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-white flex items-center gap-2">
                      <CheckSquare size={16} className="text-emerald-400" />
                      Éléments détectés ({dynamicItems.length})
                    </h4>
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllDynamicItems}
                        className="text-xs px-2 py-1 bg-white/10 text-gray-300 rounded hover:bg-white/20"
                      >
                        Tout sélectionner
                      </button>
                      <button
                        onClick={deselectAllDynamicItems}
                        className="text-xs px-2 py-1 bg-white/10 text-gray-300 rounded hover:bg-white/20"
                      >
                        Tout désélectionner
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    {dynamicItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => toggleDynamicItem(item.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          item.selected
                            ? 'border-emerald-500/50 bg-emerald-500/10'
                            : getItemTypeColor(item.type)
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center ${
                          item.selected ? 'bg-emerald-500 text-white' : 'bg-white/10'
                        }`}>
                          {item.selected ? <Check size={14} /> : null}
                        </div>
                        <span className="text-lg">{getItemTypeIcon(item.type)}</span>
                        <div className="flex-1">
                          <span className="text-sm text-white">{item.label}</span>
                          {item.description && (
                            <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 capitalize">{item.type}</span>
                      </div>
                    ))}
                  </div>

                  {dynamicItems.some(i => i.selected) && (
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={saveSelectedItems}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-400 transition-colors"
                      >
                        <Save size={16} />
                        Enregistrer la sélection ({dynamicItems.filter(i => i.selected).length})
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
