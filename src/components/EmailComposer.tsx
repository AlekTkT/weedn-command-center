'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Send, Save, Edit2, Trash2, RefreshCw, Copy,
  Building2, User, Package, AlertCircle, CheckCircle,
  ChevronDown, ChevronUp, Sparkles, Target, Zap, X,
  FileText, Clock, MessageSquare
} from 'lucide-react';

interface EmailDraft {
  id: string;
  type: 'supplier_order' | 'supplier_negotiation' | 'customer_support' | 'customer_followup' | 'marketing';
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'failed';
  agentId: string;
  agentName: string;
  context?: any;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
}

interface Supplier {
  id: string;
  name: string;
  contact: { email: string; name?: string };
}

const EMAIL_DRAFTS_KEY = 'weedn-email-drafts';

export default function EmailComposer() {
  const [activeTab, setActiveTab] = useState<'supplier' | 'customer' | 'drafts'>('supplier');
  const [drafts, setDrafts] = useState<EmailDraft[]>([]);
  const [currentDraft, setCurrentDraft] = useState<EmailDraft | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);

  // Formulaire commande fournisseur
  const [supplierForm, setSupplierForm] = useState({
    supplierId: '',
    supplierName: '',
    supplierEmail: '',
    products: [{ name: '', quantity: 0, lastPrice: 0, targetPrice: 0 }],
    urgency: 'medium' as 'low' | 'medium' | 'high',
    notes: ''
  });

  // Formulaire support client
  const [supportForm, setSupportForm] = useState({
    customerEmail: '',
    customerName: '',
    originalMessage: '',
    orderId: '',
    issueType: 'general' as 'shipping' | 'product' | 'refund' | 'general' | 'complaint',
    sentiment: 'neutral' as 'positive' | 'neutral' | 'negative'
  });

  // Charger les fournisseurs et brouillons
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await fetch('/api/suppliers');
        if (res.ok) {
          const data = await res.json();
          setSuppliers(data.suppliers || []);
        }
      } catch (e) {
        console.error('Erreur chargement fournisseurs:', e);
      }
    };
    fetchSuppliers();

    // Charger brouillons depuis localStorage
    const stored = localStorage.getItem(EMAIL_DRAFTS_KEY);
    if (stored) {
      setDrafts(JSON.parse(stored));
    }
  }, []);

  // Sauvegarder brouillons
  useEffect(() => {
    if (drafts.length > 0) {
      localStorage.setItem(EMAIL_DRAFTS_KEY, JSON.stringify(drafts));
    }
  }, [drafts]);

  // Générer email fournisseur
  const generateSupplierEmail = async () => {
    if (!supplierForm.supplierEmail || supplierForm.products.every(p => !p.name)) {
      alert('Email fournisseur et au moins un produit requis');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/email-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_supplier_order',
          data: {
            ...supplierForm,
            products: supplierForm.products.filter(p => p.name)
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        setCurrentDraft(data.draft);
        setDrafts(prev => [...prev, data.draft]);
        setShowSuccess('Email de commande généré par l\'Agent Négociateur');
        setTimeout(() => setShowSuccess(null), 3000);
      }
    } catch (e) {
      console.error('Erreur génération email:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Générer email support
  const generateSupportEmail = async () => {
    if (!supportForm.customerEmail) {
      alert('Email client requis');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/email-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_customer_support',
          data: supportForm
        })
      });

      const data = await res.json();
      if (data.success) {
        setCurrentDraft(data.draft);
        setDrafts(prev => [...prev, data.draft]);
        setShowSuccess('Réponse générée par l\'Agent Support');
        setTimeout(() => setShowSuccess(null), 3000);
      }
    } catch (e) {
      console.error('Erreur génération email:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Améliorer négociation
  const enhanceNegotiation = async (strategy: 'aggressive' | 'friendly' | 'volume') => {
    if (!currentDraft) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/email-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enhance_negotiation',
          data: { draft: currentDraft, strategy }
        })
      });

      const data = await res.json();
      if (data.success) {
        setCurrentDraft(data.draft);
        // Mettre à jour dans la liste
        setDrafts(prev => prev.map(d => d.id === data.draft.id ? data.draft : d));
        setShowSuccess(`Stratégie "${strategy}" appliquée`);
        setTimeout(() => setShowSuccess(null), 3000);
      }
    } catch (e) {
      console.error('Erreur amélioration:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Copier email
  const copyEmail = () => {
    if (currentDraft) {
      const text = `À: ${currentDraft.to.join(', ')}\nObjet: ${currentDraft.subject}\n\n${currentDraft.body}`;
      navigator.clipboard.writeText(text);
      setShowSuccess('Email copié dans le presse-papier');
      setTimeout(() => setShowSuccess(null), 2000);
    }
  };

  // Supprimer brouillon
  const deleteDraft = (id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id));
    if (currentDraft?.id === id) {
      setCurrentDraft(null);
    }
  };

  // Marquer comme envoyé
  const markAsSent = (id: string) => {
    setDrafts(prev => prev.map(d =>
      d.id === id ? { ...d, status: 'sent' as const, sentAt: new Date().toISOString() } : d
    ));
    setShowSuccess('Email marqué comme envoyé');
    setTimeout(() => setShowSuccess(null), 2000);
  };

  // Ajouter produit au formulaire
  const addProduct = () => {
    setSupplierForm(prev => ({
      ...prev,
      products: [...prev.products, { name: '', quantity: 0, lastPrice: 0, targetPrice: 0 }]
    }));
  };

  // Sélectionner fournisseur
  const selectSupplier = (supplier: Supplier) => {
    setSupplierForm(prev => ({
      ...prev,
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierEmail: supplier.contact.email || ''
    }));
  };

  return (
    <div className="space-y-6">
      {/* Notification succès */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 z-50 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
          >
            <CheckCircle size={18} />
            {showSuccess}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Mail className="text-emerald-400" size={24} />
          Centre Email Agents
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">🤝 Agent Négociateur</span>
          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">💬 Agent Support</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'supplier', label: 'Commande Fournisseur', icon: Building2 },
          { id: 'customer', label: 'Réponse Client', icon: User },
          { id: 'drafts', label: `Brouillons (${drafts.length})`, icon: FileText }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === id
                ? 'bg-emerald-500 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Formulaire */}
        <div className="glass rounded-xl p-6">
          {activeTab === 'supplier' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Building2 className="text-blue-400" size={18} />
                Commande Fournisseur
                <span className="text-xs text-gray-500">(Agent Négociateur)</span>
              </h3>

              {/* Sélection fournisseur */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Fournisseur</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {suppliers.filter(s => s.contact.email).slice(0, 5).map(s => (
                    <button
                      key={s.id}
                      onClick={() => selectSupplier(s)}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        supplierForm.supplierId === s.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
                <input
                  type="email"
                  placeholder="Email fournisseur"
                  value={supplierForm.supplierEmail}
                  onChange={(e) => setSupplierForm(prev => ({ ...prev, supplierEmail: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-white"
                />
              </div>

              {/* Produits */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Produits à commander</label>
                {supplierForm.products.map((product, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Produit"
                      value={product.name}
                      onChange={(e) => {
                        const newProducts = [...supplierForm.products];
                        newProducts[idx].name = e.target.value;
                        setSupplierForm(prev => ({ ...prev, products: newProducts }));
                      }}
                      className="col-span-2 px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-white text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Qté"
                      value={product.quantity || ''}
                      onChange={(e) => {
                        const newProducts = [...supplierForm.products];
                        newProducts[idx].quantity = parseInt(e.target.value) || 0;
                        setSupplierForm(prev => ({ ...prev, products: newProducts }));
                      }}
                      className="px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-white text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Prix cible €"
                      value={product.targetPrice || ''}
                      onChange={(e) => {
                        const newProducts = [...supplierForm.products];
                        newProducts[idx].targetPrice = parseFloat(e.target.value) || 0;
                        setSupplierForm(prev => ({ ...prev, products: newProducts }));
                      }}
                      className="px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-white text-sm"
                    />
                  </div>
                ))}
                <button
                  onClick={addProduct}
                  className="text-xs text-emerald-400 hover:text-emerald-300"
                >
                  + Ajouter un produit
                </button>
              </div>

              {/* Urgence */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Urgence</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((u) => (
                    <button
                      key={u}
                      onClick={() => setSupplierForm(prev => ({ ...prev, urgency: u }))}
                      className={`px-3 py-1.5 rounded-lg text-sm ${
                        supplierForm.urgency === u
                          ? u === 'high' ? 'bg-red-500 text-white' :
                            u === 'medium' ? 'bg-yellow-500 text-white' : 'bg-gray-500 text-white'
                          : 'bg-white/10 text-gray-400'
                      }`}
                    >
                      {u === 'high' ? '🔴 Urgente' : u === 'medium' ? '🟡 Normale' : '🟢 Basse'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={generateSupplierEmail}
                disabled={isLoading}
                className="w-full py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-lg font-medium flex items-center justify-center gap-2"
              >
                {isLoading ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
                Générer l'email de commande
              </button>
            </div>
          )}

          {activeTab === 'customer' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <User className="text-purple-400" size={18} />
                Réponse Client
                <span className="text-xs text-gray-500">(Agent Support)</span>
              </h3>

              <input
                type="email"
                placeholder="Email du client"
                value={supportForm.customerEmail}
                onChange={(e) => setSupportForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-white"
              />

              <input
                type="text"
                placeholder="Nom du client (optionnel)"
                value={supportForm.customerName}
                onChange={(e) => setSupportForm(prev => ({ ...prev, customerName: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-white"
              />

              <div>
                <label className="block text-sm text-gray-400 mb-2">Type de demande</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'shipping', label: '📦 Livraison' },
                    { id: 'product', label: '🛍️ Produit' },
                    { id: 'refund', label: '💰 Remboursement' },
                    { id: 'general', label: '❓ Général' },
                    { id: 'complaint', label: '😤 Réclamation' }
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setSupportForm(prev => ({ ...prev, issueType: id as any }))}
                      className={`px-3 py-1.5 rounded-lg text-sm ${
                        supportForm.issueType === id
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/10 text-gray-400'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                placeholder="Message original du client (optionnel)"
                value={supportForm.originalMessage}
                onChange={(e) => setSupportForm(prev => ({ ...prev, originalMessage: e.target.value }))}
                className="w-full h-24 px-4 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-white resize-none"
              />

              <button
                onClick={generateSupportEmail}
                disabled={isLoading}
                className="w-full py-3 bg-purple-500 hover:bg-purple-400 text-white rounded-lg font-medium flex items-center justify-center gap-2"
              >
                {isLoading ? <RefreshCw className="animate-spin" size={18} /> : <MessageSquare size={18} />}
                Générer la réponse
              </button>
            </div>
          )}

          {activeTab === 'drafts' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <FileText className="text-yellow-400" size={18} />
                Brouillons ({drafts.length})
              </h3>

              {drafts.length === 0 ? (
                <p className="text-gray-500 text-sm">Aucun brouillon</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {drafts.map((draft) => (
                    <div
                      key={draft.id}
                      onClick={() => setCurrentDraft(draft)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        currentDraft?.id === draft.id
                          ? 'bg-emerald-500/20 border border-emerald-500/50'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          draft.type.includes('supplier') ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {draft.agentName}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          draft.status === 'sent' ? 'bg-emerald-500/20 text-emerald-400' :
                          draft.status === 'draft' ? 'bg-gray-500/20 text-gray-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {draft.status === 'sent' ? '✓ Envoyé' : draft.status === 'draft' ? 'Brouillon' : draft.status}
                        </span>
                      </div>
                      <p className="text-sm text-white truncate">{draft.subject}</p>
                      <p className="text-xs text-gray-500">{draft.to.join(', ')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Prévisualisation */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Mail size={18} />
              Prévisualisation
            </h3>
            {currentDraft && (
              <div className="flex gap-2">
                <button
                  onClick={copyEmail}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-gray-400"
                  title="Copier"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => deleteDraft(currentDraft.id)}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {currentDraft ? (
            <div className="space-y-4">
              {/* En-tête email */}
              <div className="bg-gray-800/50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex">
                  <span className="text-gray-400 w-12">À:</span>
                  <span className="text-white">{currentDraft.to.join(', ')}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-400 w-12">Objet:</span>
                  <span className="text-white font-medium">{currentDraft.subject}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-400 w-12">De:</span>
                  <span className="text-gray-300">cbdoshop75@gmail.com</span>
                </div>
              </div>

              {/* Corps email */}
              <div className="bg-gray-800/30 rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">
                  {currentDraft.body}
                </pre>
              </div>

              {/* Stratégies de négociation */}
              {currentDraft.type.includes('supplier') && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    <Target size={14} className="inline mr-1" />
                    Améliorer la négociation
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => enhanceNegotiation('aggressive')}
                      disabled={isLoading}
                      className="flex-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm"
                    >
                      🔥 Aggressif
                    </button>
                    <button
                      onClick={() => enhanceNegotiation('friendly')}
                      disabled={isLoading}
                      className="flex-1 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm"
                    >
                      🤝 Amical
                    </button>
                    <button
                      onClick={() => enhanceNegotiation('volume')}
                      disabled={isLoading}
                      className="flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm"
                    >
                      📦 Volume
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => markAsSent(currentDraft.id)}
                  disabled={currentDraft.status === 'sent'}
                  className={`flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-2 ${
                    currentDraft.status === 'sent'
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-white'
                  }`}
                >
                  {currentDraft.status === 'sent' ? (
                    <>
                      <CheckCircle size={16} />
                      Envoyé
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Marquer comme envoyé
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                💡 Copiez l'email et collez-le dans Gmail pour l'envoyer
              </p>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Mail className="mx-auto mb-4" size={48} />
              <p>Sélectionnez ou générez un email</p>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="glass rounded-xl p-4 text-sm text-gray-400">
        <div className="flex items-start gap-3">
          <Zap className="text-yellow-400 mt-0.5" size={18} />
          <div>
            <p className="text-white font-medium mb-1">Agents Email Weedn</p>
            <ul className="space-y-1">
              <li>• <span className="text-blue-400">Agent Négociateur</span>: Utilise des techniques de persuasion pour obtenir les meilleurs prix fournisseurs</li>
              <li>• <span className="text-purple-400">Agent Support</span>: Répond aux clients avec empathie et professionnalisme</li>
              <li>• Les emails sont générés automatiquement, vous pouvez les éditer et les copier dans Gmail</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
