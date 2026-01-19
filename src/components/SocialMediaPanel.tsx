'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Instagram, Music2, TrendingUp, TrendingDown, Users,
  Heart, MessageCircle, Eye, RefreshCw, ExternalLink,
  Play, Image, Calendar
} from 'lucide-react';

interface SocialMetrics {
  platform: 'instagram' | 'tiktok';
  followers: number;
  followersChange: { week: number; month: number; quarter: number };
  engagement: number;
  engagementChange: number;
  recentPosts: {
    id: string;
    type: 'image' | 'video' | 'reel' | 'carousel';
    likes: number;
    comments: number;
    views?: number;
    date: string;
    thumbnail?: string;
  }[];
  bestTime: string;
  topHashtags: string[];
}

// Données simulées (à remplacer par API Meta/TikTok)
const MOCK_DATA: Record<string, SocialMetrics> = {
  instagram: {
    platform: 'instagram',
    followers: 2847,
    followersChange: { week: 42, month: 156, quarter: 423 },
    engagement: 4.2,
    engagementChange: 0.3,
    recentPosts: [
      { id: '1', type: 'reel', likes: 234, comments: 18, views: 3420, date: '2025-01-18' },
      { id: '2', type: 'carousel', likes: 189, comments: 12, date: '2025-01-16' },
      { id: '3', type: 'image', likes: 156, comments: 8, date: '2025-01-14' },
      { id: '4', type: 'reel', likes: 312, comments: 24, views: 4560, date: '2025-01-12' },
    ],
    bestTime: '18h-20h',
    topHashtags: ['#CBD', '#CBDParis', '#WellnessParis', '#Weedn', '#CBDFrance'],
  },
  tiktok: {
    platform: 'tiktok',
    followers: 1234,
    followersChange: { week: 89, month: 312, quarter: 856 },
    engagement: 8.7,
    engagementChange: 1.2,
    recentPosts: [
      { id: '1', type: 'video', likes: 567, comments: 45, views: 12340, date: '2025-01-17' },
      { id: '2', type: 'video', likes: 423, comments: 32, views: 8760, date: '2025-01-15' },
      { id: '3', type: 'video', likes: 234, comments: 18, views: 5430, date: '2025-01-13' },
    ],
    bestTime: '19h-21h',
    topHashtags: ['#CBD', '#CBDTok', '#Wellness', '#Paris', '#Relaxation'],
  },
};

export default function SocialMediaPanel() {
  const [activePlatform, setActivePlatform] = useState<'instagram' | 'tiktok'>('instagram');
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('week');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Record<string, SocialMetrics>>(MOCK_DATA);

  const fetchSocialData = async () => {
    setLoading(true);
    // TODO: Intégrer les vraies APIs Meta et TikTok
    // Pour l'instant on utilise les données simulées
    await new Promise(r => setTimeout(r, 500));
    setLoading(false);
  };

  useEffect(() => {
    fetchSocialData();
  }, []);

  const currentData = data[activePlatform];
  const followersChange = currentData.followersChange[period];
  const isPositiveChange = followersChange >= 0;

  const getPeriodLabel = () => {
    switch (period) {
      case 'week': return '7 jours';
      case 'month': return '30 jours';
      case 'quarter': return '3 mois';
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'reel':
      case 'video':
        return <Play size={12} className="text-pink-400" />;
      case 'carousel':
        return <Image size={12} className="text-blue-400" />;
      default:
        return <Image size={12} className="text-gray-400" />;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="glass rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <Instagram className="text-pink-400" size={18} />
            <Music2 className="text-cyan-400" size={18} />
          </div>
          <h3 className="font-semibold text-white">Réseaux Sociaux</h3>
        </div>
        <motion.button
          whileTap={{ rotate: 360 }}
          onClick={fetchSocialData}
          className="p-1.5 hover:bg-white/10 rounded-lg"
        >
          <RefreshCw className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} size={14} />
        </motion.button>
      </div>

      {/* Sélecteur de plateforme */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActivePlatform('instagram')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            activePlatform === 'instagram'
              ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-400 border border-pink-500/30'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <Instagram size={16} />
          Instagram
        </button>
        <button
          onClick={() => setActivePlatform('tiktok')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            activePlatform === 'tiktok'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <Music2 size={16} />
          TikTok
        </button>
      </div>

      {/* Sélecteur de période */}
      <div className="flex gap-1 mb-4 bg-gray-800 p-1 rounded-lg">
        {(['week', 'month', 'quarter'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
              period === p
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {p === 'week' ? '7j' : p === 'month' ? '30j' : '3 mois'}
          </button>
        ))}
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Followers */}
        <div className="p-3 bg-gray-800/50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-gray-400" />
            <span className="text-xs text-gray-400">Abonnés</span>
          </div>
          <div className="text-xl font-bold text-white">
            {formatNumber(currentData.followers)}
          </div>
          <div className={`flex items-center gap-1 text-xs ${
            isPositiveChange ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {isPositiveChange ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{isPositiveChange ? '+' : ''}{followersChange} ({getPeriodLabel()})</span>
          </div>
        </div>

        {/* Engagement */}
        <div className="p-3 bg-gray-800/50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Heart size={14} className="text-gray-400" />
            <span className="text-xs text-gray-400">Engagement</span>
          </div>
          <div className="text-xl font-bold text-white">
            {currentData.engagement}%
          </div>
          <div className={`flex items-center gap-1 text-xs ${
            currentData.engagementChange >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {currentData.engagementChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{currentData.engagementChange >= 0 ? '+' : ''}{currentData.engagementChange}%</span>
          </div>
        </div>
      </div>

      {/* Posts récents */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-400 mb-2">Posts récents</h4>
        <div className="space-y-2">
          {currentData.recentPosts.slice(0, 3).map((post) => (
            <div
              key={post.id}
              className="flex items-center gap-3 p-2 bg-gray-800/30 rounded-lg"
            >
              <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                {getPostTypeIcon(post.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{new Date(post.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                  <span className="capitalize">{post.type}</span>
                </div>
                <div className="flex items-center gap-3 text-xs mt-1">
                  <span className="flex items-center gap-1 text-pink-400">
                    <Heart size={10} /> {formatNumber(post.likes)}
                  </span>
                  <span className="flex items-center gap-1 text-blue-400">
                    <MessageCircle size={10} /> {post.comments}
                  </span>
                  {post.views && (
                    <span className="flex items-center gap-1 text-gray-400">
                      <Eye size={10} /> {formatNumber(post.views)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-2 bg-emerald-500/10 rounded-lg">
          <div className="flex items-center gap-1 text-xs text-emerald-400 mb-1">
            <Calendar size={12} />
            <span>Meilleur moment</span>
          </div>
          <div className="text-sm font-medium text-white">{currentData.bestTime}</div>
        </div>
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <div className="text-xs text-blue-400 mb-1">Top hashtag</div>
          <div className="text-sm font-medium text-white">{currentData.topHashtags[0]}</div>
        </div>
      </div>

      {/* Hashtags recommandés */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-400 mb-2">Hashtags performants</h4>
        <div className="flex flex-wrap gap-1">
          {currentData.topHashtags.map((tag, idx) => (
            <span
              key={idx}
              className={`px-2 py-1 rounded text-xs ${
                activePlatform === 'instagram'
                  ? 'bg-pink-500/20 text-pink-400'
                  : 'bg-cyan-500/20 text-cyan-400'
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Lien externe */}
      <a
        href={activePlatform === 'instagram'
          ? 'https://www.instagram.com/weedn.fr/'
          : 'https://www.tiktok.com/@weedn.fr'
        }
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
          activePlatform === 'instagram'
            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-400 hover:from-purple-500/30 hover:to-pink-500/30'
            : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
        }`}
      >
        <span>Voir le profil</span>
        <ExternalLink size={14} />
      </a>
    </div>
  );
}
