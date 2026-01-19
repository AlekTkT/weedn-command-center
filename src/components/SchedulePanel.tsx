'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, ChevronLeft, ChevronRight, Plus,
  CheckCircle, Circle, AlertCircle, Trash2, Edit2,
  Instagram, Mail, ShoppingBag, Users, TrendingUp,
  RefreshCw, X
} from 'lucide-react';

interface ScheduleEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  duration?: number; // minutes
  type: 'marketing' | 'stock' | 'social' | 'meeting' | 'promo' | 'content' | 'task';
  status: 'pending' | 'completed' | 'in_progress';
  recurring?: 'daily' | 'weekly' | 'monthly';
  agentId?: string;
  priority?: 'high' | 'medium' | 'low';
}

// Événements générés automatiquement par les agents
const AUTO_EVENTS: ScheduleEvent[] = [
  {
    id: 'auto-1',
    title: 'Post Instagram',
    description: 'Publier un post produit (Agent Contenu)',
    date: new Date().toISOString().split('T')[0],
    time: '18:00',
    type: 'social',
    status: 'pending',
    recurring: 'daily',
    agentId: 'agent-contenu',
    priority: 'medium'
  },
  {
    id: 'auto-2',
    title: 'Vérifier stock critique',
    description: 'Contrôle des produits à faible stock',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    type: 'stock',
    status: 'completed',
    recurring: 'daily',
    agentId: 'agent-inventaire',
    priority: 'high'
  },
  {
    id: 'auto-3',
    title: 'Analyser ventes J-1',
    description: 'Rapport des ventes d\'hier',
    date: new Date().toISOString().split('T')[0],
    time: '08:30',
    type: 'task',
    status: 'completed',
    recurring: 'daily',
    agentId: 'agent-ventes',
    priority: 'medium'
  },
  {
    id: 'auto-4',
    title: 'Email newsletter',
    description: 'Promo weekend CBD',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '10:00',
    type: 'marketing',
    status: 'pending',
    agentId: 'agent-email',
    priority: 'medium'
  },
  {
    id: 'auto-5',
    title: 'Réunion équipe',
    description: 'Point hebdo avec Baboo et Jalil',
    date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    time: '14:00',
    duration: 30,
    type: 'meeting',
    status: 'pending',
    priority: 'high'
  },
  {
    id: 'auto-6',
    title: 'TikTok Reel',
    description: 'Vidéo "Comment choisir son CBD"',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '19:00',
    type: 'content',
    status: 'pending',
    agentId: 'agent-contenu',
    priority: 'medium'
  },
  {
    id: 'auto-7',
    title: 'Promo Flash -15%',
    description: 'Lancement promo weekend',
    date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    time: '12:00',
    type: 'promo',
    status: 'pending',
    agentId: 'agent-ventes',
    priority: 'high'
  },
];

export default function SchedulePanel() {
  const [events, setEvents] = useState<ScheduleEvent[]>(AUTO_EVENTS);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<ScheduleEvent>>({
    date: selectedDate,
    type: 'task',
    status: 'pending',
    priority: 'medium'
  });
  const [view, setView] = useState<'week' | 'list'>('week');

  // Jours de la semaine actuelle
  const getWeekDays = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay() + 1); // Lundi
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays();

  const getEventsForDate = (date: string) => {
    return events.filter(e => e.date === date).sort((a, b) => {
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
  };

  const getTypeIcon = (type: ScheduleEvent['type']) => {
    switch (type) {
      case 'social': return <Instagram size={12} className="text-pink-400" />;
      case 'marketing':
      case 'content': return <Mail size={12} className="text-blue-400" />;
      case 'stock': return <ShoppingBag size={12} className="text-orange-400" />;
      case 'meeting': return <Users size={12} className="text-purple-400" />;
      case 'promo': return <TrendingUp size={12} className="text-emerald-400" />;
      default: return <CheckCircle size={12} className="text-gray-400" />;
    }
  };

  const getTypeColor = (type: ScheduleEvent['type']) => {
    switch (type) {
      case 'social': return 'bg-pink-500/20 border-pink-500/30';
      case 'marketing':
      case 'content': return 'bg-blue-500/20 border-blue-500/30';
      case 'stock': return 'bg-orange-500/20 border-orange-500/30';
      case 'meeting': return 'bg-purple-500/20 border-purple-500/30';
      case 'promo': return 'bg-emerald-500/20 border-emerald-500/30';
      default: return 'bg-gray-500/20 border-gray-500/30';
    }
  };

  const toggleEventStatus = (eventId: string) => {
    setEvents(events.map(e => {
      if (e.id === eventId) {
        return { ...e, status: e.status === 'completed' ? 'pending' : 'completed' };
      }
      return e;
    }));
  };

  const deleteEvent = (eventId: string) => {
    setEvents(events.filter(e => e.id !== eventId));
  };

  const addEvent = () => {
    if (!newEvent.title) return;
    const event: ScheduleEvent = {
      id: `event-${Date.now()}`,
      title: newEvent.title || '',
      description: newEvent.description,
      date: newEvent.date || selectedDate,
      time: newEvent.time,
      type: newEvent.type || 'task',
      status: 'pending',
      priority: newEvent.priority || 'medium'
    };
    setEvents([...events, event]);
    setNewEvent({ date: selectedDate, type: 'task', status: 'pending', priority: 'medium' });
    setShowAddEvent(false);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const upcomingEvents = events
    .filter(e => e.date >= new Date().toISOString().split('T')[0] && e.status !== 'completed')
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    })
    .slice(0, 5);

  return (
    <div className="glass rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="text-emerald-400" size={18} />
          <h3 className="font-semibold text-white">Planning</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-gray-800 p-0.5 rounded-lg">
            <button
              onClick={() => setView('week')}
              className={`px-2 py-1 rounded text-xs transition-all ${
                view === 'week' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400'
              }`}
            >
              Semaine
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-2 py-1 rounded text-xs transition-all ${
                view === 'list' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400'
              }`}
            >
              Liste
            </button>
          </div>
          <button
            onClick={() => setShowAddEvent(true)}
            className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Vue semaine */}
      {view === 'week' && (
        <>
          {/* Navigation semaine */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-1 hover:bg-white/10 rounded"
            >
              <ChevronLeft size={16} className="text-gray-400" />
            </button>
            <span className="text-sm text-gray-400">
              {weekDays[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - {weekDays[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
            <button
              onClick={() => navigateWeek(1)}
              className="p-1 hover:bg-white/10 rounded"
            >
              <ChevronRight size={16} className="text-gray-400" />
            </button>
          </div>

          {/* Grille semaine */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {weekDays.map((day, idx) => {
              const dateStr = day.toISOString().split('T')[0];
              const dayEvents = getEventsForDate(dateStr);
              const isSelected = dateStr === selectedDate;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`p-2 rounded-lg text-center transition-all ${
                    isToday(day)
                      ? 'bg-emerald-500/20 border border-emerald-500/30'
                      : isSelected
                      ? 'bg-white/10 border border-white/20'
                      : isPast(day)
                      ? 'bg-gray-800/50 opacity-50'
                      : 'bg-gray-800/50 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="text-xs text-gray-500 mb-1">
                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'][idx]}
                  </div>
                  <div className={`text-sm font-medium ${
                    isToday(day) ? 'text-emerald-400' : 'text-white'
                  }`}>
                    {day.getDate()}
                  </div>
                  {dayEvents.length > 0 && (
                    <div className="flex justify-center gap-0.5 mt-1">
                      {dayEvents.slice(0, 3).map((e, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
                            e.status === 'completed' ? 'bg-emerald-400' : 'bg-gray-400'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Événements du jour sélectionné */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <span className="text-xs text-gray-500">
                {getEventsForDate(selectedDate).length} événement(s)
              </span>
            </div>

            {getEventsForDate(selectedDate).length > 0 ? (
              getEventsForDate(selectedDate).map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-2 rounded-lg border ${getTypeColor(event.type)} ${
                    event.status === 'completed' ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => toggleEventStatus(event.id)}
                      className="mt-0.5"
                    >
                      {event.status === 'completed' ? (
                        <CheckCircle size={14} className="text-emerald-400" />
                      ) : (
                        <Circle size={14} className="text-gray-400" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(event.type)}
                        <span className={`text-sm font-medium ${
                          event.status === 'completed' ? 'text-gray-400 line-through' : 'text-white'
                        }`}>
                          {event.title}
                        </span>
                      </div>
                      {event.time && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Clock size={10} />
                          <span>{event.time}</span>
                          {event.duration && <span>({event.duration} min)</span>}
                        </div>
                      )}
                      {event.description && (
                        <p className="text-xs text-gray-400 mt-1">{event.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="p-1 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} className="text-gray-500" />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                Aucun événement prévu
              </div>
            )}
          </div>
        </>
      )}

      {/* Vue liste */}
      {view === 'list' && (
        <div className="space-y-2">
          <h4 className="text-xs text-gray-400 mb-2">Prochains événements</h4>
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-2 rounded-lg border ${getTypeColor(event.type)}`}
              >
                <div className="flex items-start gap-2">
                  <button onClick={() => toggleEventStatus(event.id)}>
                    {event.status === 'completed' ? (
                      <CheckCircle size={14} className="text-emerald-400" />
                    ) : (
                      <Circle size={14} className="text-gray-400" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(event.type)}
                      <span className="text-sm font-medium text-white">{event.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <span>{new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                      {event.time && <span>à {event.time}</span>}
                    </div>
                  </div>
                  {event.priority === 'high' && (
                    <AlertCircle size={12} className="text-red-400" />
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">
              Aucun événement à venir
            </div>
          )}
        </div>
      )}

      {/* Modal ajout événement */}
      <AnimatePresence>
        {showAddEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddEvent(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-xl p-4 w-full max-w-sm"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-white">Nouvel événement</h4>
                <button onClick={() => setShowAddEvent(false)}>
                  <X size={18} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Titre</label>
                  <input
                    type="text"
                    value={newEvent.title || ''}
                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="Ex: Réunion équipe"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Date</label>
                    <input
                      type="date"
                      value={newEvent.date || selectedDate}
                      onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Heure</label>
                    <input
                      type="time"
                      value={newEvent.time || ''}
                      onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Type</label>
                  <select
                    value={newEvent.type || 'task'}
                    onChange={e => setNewEvent({ ...newEvent, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="task">Tâche</option>
                    <option value="meeting">Réunion</option>
                    <option value="social">Social Media</option>
                    <option value="marketing">Marketing</option>
                    <option value="stock">Stock</option>
                    <option value="promo">Promo</option>
                    <option value="content">Contenu</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Description</label>
                  <textarea
                    value={newEvent.description || ''}
                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none resize-none"
                    rows={2}
                    placeholder="Détails..."
                  />
                </div>

                <button
                  onClick={addEvent}
                  disabled={!newEvent.title}
                  className="w-full py-2 bg-emerald-500 text-white rounded-lg font-medium text-sm hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ajouter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
