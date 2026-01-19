'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit2, Trash2, Package, Phone, Mail,
  Globe, MapPin, Star, ChevronDown, ChevronUp, X, Save
} from 'lucide-react';

interface FeaturedProduct {
  name: string;
  category: string;
  wholesalePrice: number;
  recommendedRetailPrice: number;
  margin: string;
  minQuantity: number;
  inStock: boolean;
  quality: string;
  thcLevel: string;
  cbdLevel: string;
  notes: string;
}

interface Supplier {
  id: string;
  name: string;
  legalName: string;
  type: string;
  status: string;
  contact: {
    name: string;
    phone: string;
    email: string;
    whatsapp: string;
    address: string;
  };
  website: string;
  siret: string;
  paymentTerms: string;
  minOrderAmount: number | null;
  deliveryTime: string;
  notes: string;
  featuredProducts: FeaturedProduct[];
  categories: string[];
  rating: number | null;
}

interface SuppliersStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  totalProducts: number;
  categories: string[];
}

export default function SuppliersPanel() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stats, setStats] = useState<SuppliersStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // État du formulaire
  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    type: 'Grossiste CBD',
    status: 'pending',
    contactName: '',
    phone: '',
    email: '',
    whatsapp: '',
    address: '',
    website: '',
    siret: '',
    paymentTerms: '',
    minOrderAmount: '',
    deliveryTime: '',
    notes: '',
    categories: '',
  });

  // Formulaire produit
  const [showProductForm, setShowProductForm] = useState<string | null>(null);
  const [productData, setProductData] = useState({
    name: '',
    category: '',
    wholesalePrice: '',
    recommendedRetailPrice: '',
    minQuantity: '1',
    quality: 'Standard',
    thcLevel: '<0.3%',
    cbdLevel: '',
    notes: '',
  });

  const fetchSuppliers = async () => {
    try {
      const url = searchQuery
        ? `/api/suppliers?q=${encodeURIComponent(searchQuery)}`
        : '/api/suppliers';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data.suppliers);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erreur chargement fournisseurs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [searchQuery]);

  const resetForm = () => {
    setFormData({
      name: '',
      legalName: '',
      type: 'Grossiste CBD',
      status: 'pending',
      contactName: '',
      phone: '',
      email: '',
      whatsapp: '',
      address: '',
      website: '',
      siret: '',
      paymentTerms: '',
      minOrderAmount: '',
      deliveryTime: '',
      notes: '',
      categories: '',
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const supplierData = {
      name: formData.name,
      legalName: formData.legalName || formData.name,
      type: formData.type,
      status: formData.status,
      contact: {
        name: formData.contactName,
        phone: formData.phone,
        email: formData.email,
        whatsapp: formData.whatsapp,
        address: formData.address,
      },
      website: formData.website,
      siret: formData.siret,
      paymentTerms: formData.paymentTerms,
      minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null,
      deliveryTime: formData.deliveryTime,
      notes: formData.notes,
      categories: formData.categories.split(',').map(c => c.trim()).filter(Boolean),
    };

    try {
      const url = editingId ? `/api/suppliers/${editingId}` : '/api/suppliers';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierData),
      });

      if (res.ok) {
        resetForm();
        fetchSuppliers();
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setFormData({
      name: supplier.name,
      legalName: supplier.legalName,
      type: supplier.type,
      status: supplier.status,
      contactName: supplier.contact.name,
      phone: supplier.contact.phone,
      email: supplier.contact.email,
      whatsapp: supplier.contact.whatsapp,
      address: supplier.contact.address,
      website: supplier.website,
      siret: supplier.siret,
      paymentTerms: supplier.paymentTerms,
      minOrderAmount: supplier.minOrderAmount?.toString() || '',
      deliveryTime: supplier.deliveryTime,
      notes: supplier.notes,
      categories: supplier.categories.join(', '),
    });
    setEditingId(supplier.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce fournisseur ?')) return;

    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSuppliers();
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  const handleAddProduct = async (supplierId: string) => {
    try {
      const res = await fetch(`/api/suppliers/${supplierId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_product',
          product: {
            name: productData.name,
            category: productData.category,
            wholesalePrice: parseFloat(productData.wholesalePrice) || 0,
            recommendedRetailPrice: parseFloat(productData.recommendedRetailPrice) || 0,
            minQuantity: parseInt(productData.minQuantity) || 1,
            quality: productData.quality,
            thcLevel: productData.thcLevel,
            cbdLevel: productData.cbdLevel,
            notes: productData.notes,
          },
        }),
      });

      if (res.ok) {
        setShowProductForm(null);
        setProductData({
          name: '',
          category: '',
          wholesalePrice: '',
          recommendedRetailPrice: '',
          minQuantity: '1',
          quality: 'Standard',
          thcLevel: '<0.3%',
          cbdLevel: '',
          notes: '',
        });
        fetchSuppliers();
      }
    } catch (error) {
      console.error('Erreur ajout produit:', error);
    }
  };

  const handleRemoveProduct = async (supplierId: string, productName: string) => {
    if (!confirm(`Supprimer ${productName} ?`)) return;

    try {
      const res = await fetch(`/api/suppliers/${supplierId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove_product',
          productName,
        }),
      });

      if (res.ok) {
        fetchSuppliers();
      }
    } catch (error) {
      console.error('Erreur suppression produit:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-400';
      case 'inactive': return 'bg-red-500/20 text-red-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">{stats.active}</div>
            <div className="text-xs text-gray-400">Actifs</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
            <div className="text-xs text-gray-400">En attente</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{stats.inactive}</div>
            <div className="text-xs text-gray-400">Inactifs</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.totalProducts}</div>
            <div className="text-xs text-gray-400">Produits</div>
          </div>
        </div>
      )}

      {/* Header + Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher un fournisseur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white transition-colors"
        >
          <Plus size={18} />
          <span>Ajouter</span>
        </button>
      </div>

      {/* Formulaire Ajout/Edition */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingId ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
              </h3>
              <button onClick={resetForm} className="p-1 hover:bg-white/10 rounded">
                <X className="text-gray-400" size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Infos principales */}
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Nom commercial *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Raison sociale"
                    value={formData.legalName}
                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    >
                      <option value="Grossiste CBD">Grossiste CBD</option>
                      <option value="Fabricant">Fabricant</option>
                      <option value="Distributeur">Distributeur</option>
                      <option value="Autre">Autre</option>
                    </select>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    >
                      <option value="active">Actif</option>
                      <option value="pending">En attente</option>
                      <option value="inactive">Inactif</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Catégories (séparées par virgule)"
                    value={formData.categories}
                    onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400"
                  />
                </div>

                {/* Contact */}
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Nom du contact"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="tel"
                      placeholder="Téléphone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400"
                    />
                    <input
                      type="tel"
                      placeholder="WhatsApp"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400"
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400"
                  />
                  <input
                    type="url"
                    placeholder="Site web"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Adresse et conditions */}
              <input
                type="text"
                placeholder="Adresse"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400"
              />

              <div className="grid md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="SIRET"
                  value={formData.siret}
                  onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400"
                />
                <input
                  type="text"
                  placeholder="Conditions paiement"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400"
                />
                <input
                  type="number"
                  placeholder="Commande min (€)"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400"
                />
                <input
                  type="text"
                  placeholder="Délai livraison"
                  value={formData.deliveryTime}
                  onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400"
                />
              </div>

              <textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white transition-colors"
                >
                  <Save size={18} />
                  <span>Enregistrer</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liste des fournisseurs */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Chargement...</div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          Aucun fournisseur. Cliquez sur "Ajouter" pour en créer un.
        </div>
      ) : (
        <div className="space-y-4">
          {suppliers.map((supplier) => (
            <motion.div
              key={supplier.id}
              layout
              className="glass rounded-xl overflow-hidden"
            >
              {/* Header */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedId(expandedId === supplier.id ? null : supplier.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white text-xl font-bold">
                      {supplier.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{supplier.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>{supplier.type}</span>
                        {supplier.categories.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{supplier.categories.slice(0, 2).join(', ')}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(supplier.status)}`}>
                      {supplier.status}
                    </span>
                    <div className="flex items-center gap-1 text-purple-400">
                      <Package size={16} />
                      <span className="text-sm">{supplier.featuredProducts.length}</span>
                    </div>
                    {expandedId === supplier.id ? (
                      <ChevronUp className="text-gray-400" size={20} />
                    ) : (
                      <ChevronDown className="text-gray-400" size={20} />
                    )}
                  </div>
                </div>
              </div>

              {/* Détails expandables */}
              <AnimatePresence>
                {expandedId === supplier.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/10"
                  >
                    <div className="p-4 space-y-4">
                      {/* Contact */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-400">Contact</h4>
                          {supplier.contact.name && (
                            <p className="text-white">{supplier.contact.name}</p>
                          )}
                          {supplier.contact.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                              <Phone size={14} />
                              <a href={`tel:${supplier.contact.phone}`}>{supplier.contact.phone}</a>
                            </div>
                          )}
                          {supplier.contact.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                              <Mail size={14} />
                              <a href={`mailto:${supplier.contact.email}`}>{supplier.contact.email}</a>
                            </div>
                          )}
                          {supplier.website && (
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                              <Globe size={14} />
                              <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                                {supplier.website}
                              </a>
                            </div>
                          )}
                          {supplier.contact.address && (
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                              <MapPin size={14} />
                              <span>{supplier.contact.address}</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-400">Conditions</h4>
                          {supplier.paymentTerms && (
                            <p className="text-sm text-gray-300">Paiement: {supplier.paymentTerms}</p>
                          )}
                          {supplier.minOrderAmount && (
                            <p className="text-sm text-gray-300">Commande min: {supplier.minOrderAmount}€</p>
                          )}
                          {supplier.deliveryTime && (
                            <p className="text-sm text-gray-300">Livraison: {supplier.deliveryTime}</p>
                          )}
                          {supplier.siret && (
                            <p className="text-sm text-gray-300">SIRET: {supplier.siret}</p>
                          )}
                        </div>
                      </div>

                      {/* Notes */}
                      {supplier.notes && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-1">Notes</h4>
                          <p className="text-sm text-gray-300">{supplier.notes}</p>
                        </div>
                      )}

                      {/* Produits phares */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-400">Produits phares</h4>
                          <button
                            onClick={() => setShowProductForm(showProductForm === supplier.id ? null : supplier.id)}
                            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
                          >
                            <Plus size={14} />
                            Ajouter
                          </button>
                        </div>

                        {/* Formulaire ajout produit */}
                        {showProductForm === supplier.id && (
                          <div className="bg-white/5 rounded-lg p-3 mb-3 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Nom du produit *"
                                value={productData.name}
                                onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                                className="px-3 py-1 bg-white/5 border border-white/10 rounded text-sm text-white placeholder-gray-400"
                              />
                              <input
                                type="text"
                                placeholder="Catégorie"
                                value={productData.category}
                                onChange={(e) => setProductData({ ...productData, category: e.target.value })}
                                className="px-3 py-1 bg-white/5 border border-white/10 rounded text-sm text-white placeholder-gray-400"
                              />
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              <input
                                type="number"
                                placeholder="Prix gros (€)"
                                value={productData.wholesalePrice}
                                onChange={(e) => setProductData({ ...productData, wholesalePrice: e.target.value })}
                                className="px-3 py-1 bg-white/5 border border-white/10 rounded text-sm text-white placeholder-gray-400"
                              />
                              <input
                                type="number"
                                placeholder="Prix vente (€)"
                                value={productData.recommendedRetailPrice}
                                onChange={(e) => setProductData({ ...productData, recommendedRetailPrice: e.target.value })}
                                className="px-3 py-1 bg-white/5 border border-white/10 rounded text-sm text-white placeholder-gray-400"
                              />
                              <input
                                type="text"
                                placeholder="Taux CBD"
                                value={productData.cbdLevel}
                                onChange={(e) => setProductData({ ...productData, cbdLevel: e.target.value })}
                                className="px-3 py-1 bg-white/5 border border-white/10 rounded text-sm text-white placeholder-gray-400"
                              />
                              <select
                                value={productData.quality}
                                onChange={(e) => setProductData({ ...productData, quality: e.target.value })}
                                className="px-3 py-1 bg-white/5 border border-white/10 rounded text-sm text-white"
                              >
                                <option value="Premium">Premium</option>
                                <option value="Standard">Standard</option>
                                <option value="Budget">Budget</option>
                              </select>
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setShowProductForm(null)}
                                className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded text-white"
                              >
                                Annuler
                              </button>
                              <button
                                onClick={() => handleAddProduct(supplier.id)}
                                disabled={!productData.name}
                                className="px-3 py-1 text-xs bg-emerald-500 hover:bg-emerald-600 rounded text-white disabled:opacity-50"
                              >
                                Ajouter
                              </button>
                            </div>
                          </div>
                        )}

                        {supplier.featuredProducts.length === 0 ? (
                          <p className="text-sm text-gray-500">Aucun produit enregistré</p>
                        ) : (
                          <div className="grid gap-2">
                            {supplier.featuredProducts.map((product, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between bg-white/5 rounded-lg p-3"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-white">{product.name}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                                      product.quality === 'Premium' ? 'bg-yellow-500/20 text-yellow-400' :
                                      product.quality === 'Standard' ? 'bg-blue-500/20 text-blue-400' :
                                      'bg-gray-500/20 text-gray-400'
                                    }`}>
                                      {product.quality}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                                    {product.category && <span>{product.category}</span>}
                                    {product.cbdLevel && <span>CBD: {product.cbdLevel}</span>}
                                    {product.wholesalePrice > 0 && (
                                      <span>Gros: {product.wholesalePrice}€</span>
                                    )}
                                    {product.recommendedRetailPrice > 0 && (
                                      <span className="text-emerald-400">
                                        Vente: {product.recommendedRetailPrice}€
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveProduct(supplier.id, product.name)}
                                  className="p-1 hover:bg-red-500/20 rounded"
                                >
                                  <Trash2 className="text-red-400" size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 rounded text-blue-400 text-sm"
                        >
                          <Edit2 size={14} />
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400 text-sm"
                        >
                          <Trash2 size={14} />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
