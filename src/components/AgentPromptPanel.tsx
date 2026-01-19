'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Agent {
  id: string;
  name: string;
  icon: string;
  status: string;
  color: string;
}

interface AgentPromptPanelProps {
  agents: Agent[];
  onClose?: () => void;
}

export default function AgentPromptPanel({ agents, onClose }: AgentPromptPanelProps) {
  const [selectedAgent, setSelectedAgent] = useState<string>('weedn-central');
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ agent: string; prompt: string; response: string; timestamp: Date }>>([]);

  const sendPrompt = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setResponse('');

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
        setHistory(prev => [...prev, {
          agent: selectedAgent,
          prompt,
          response: data.response,
          timestamp: new Date(),
        }]);
      } else {
        setResponse(`Erreur: ${data.error}`);
      }
    } catch (error) {
      setResponse('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <h2 className="font-semibold text-white">Console Agent Claude</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
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
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span>{agent.icon}</span>
                <span className="text-sm">{agent.name}</span>
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
                  className="px-3 py-1.5 text-xs bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-colors"
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
            className="w-full h-24 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
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
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                loading || !prompt.trim()
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Réflexion...
                </span>
              ) : (
                'Envoyer'
              )}
            </button>
          </div>
        </div>

        {/* Response */}
        <AnimatePresence>
          {response && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{selectedAgentData?.icon}</span>
                <span className="font-medium text-white">{selectedAgentData?.name}</span>
                <span className="text-xs text-gray-500">• Réponse</span>
              </div>
              <div className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                {response}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        {history.length > 0 && (
          <div>
            <h3 className="text-sm text-gray-400 mb-2">Historique ({history.length})</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {history.slice().reverse().map((item, i) => {
                const agentData = agents.find(a => a.id === item.agent);
                return (
                  <div key={i} className="text-xs bg-gray-800/50 rounded p-2">
                    <div className="flex items-center gap-1 text-gray-400">
                      <span>{agentData?.icon}</span>
                      <span>{agentData?.name}</span>
                      <span className="mx-1">•</span>
                      <span>{item.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <div className="text-gray-500 truncate mt-1">{item.prompt}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
