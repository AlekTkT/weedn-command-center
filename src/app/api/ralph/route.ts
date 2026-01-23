import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

const PROJECT_ROOT = process.env.WEEDN_PROJECT_PATH || '/Users/alektkt/Documents/weedn-project';
const LOGS_DIR = path.join(PROJECT_ROOT, 'logs', 'ralph');
const PRDS_DIR = path.join(PROJECT_ROOT, 'prds');
const RALPH_PRDS_DIR = path.join(PROJECT_ROOT, 'tools', 'ralph-loop');

interface RalphSession {
  id: string;
  date: string;
  prdFile: string;
  status: 'running' | 'completed' | 'failed' | 'partial';
  iterations: number;
  maxIterations: number;
  successes: number;
  failures: number;
  duration: string;
  estimatedCost: number;
  revenueImpact: number;
  roi: number;
  learningsSaved: number;
  errorsLogged: number;
  patternsUpdated: number;
}

interface RalphStats {
  totalSessions: number;
  totalIterations: number;
  totalSuccesses: number;
  totalFailures: number;
  totalRevenueImpact: number;
  totalCost: number;
  averageROI: number;
  bestSession: RalphSession | null;
}

// Parse un fichier log Ralph pour extraire les données
function parseRalphLog(logPath: string): RalphSession | null {
  try {
    const content = fs.readFileSync(logPath, 'utf-8');
    const fileName = path.basename(logPath, '.log');
    const sessionId = fileName.replace('ralph_', '');

    // Extraire les infos de base
    const taskMatch = content.match(/Task file: (.+)/);
    const modeMatch = content.match(/Mode: (\w+)/);
    const maxIterMatch = content.match(/Max iterations: (\d+)/);

    // Extraire les stats du summary
    const totalIterMatch = content.match(/Total iterations: (\d+)/);
    const successesMatch = content.match(/Successes: .+?(\d+)/);
    const failuresMatch = content.match(/Failures: .+?(\d+)/);
    const durationMatch = content.match(/Duration: ([^\n]+)/);
    const costMatch = content.match(/Estimated cost: ~\$([0-9.]+)/);

    // Extraire l'impact si présent dans les commits
    const revenueMatches = content.match(/Impact:\s*\+?(\d+)\s*EUR/gi) || [];
    let totalRevenue = 0;
    revenueMatches.forEach(match => {
      const num = match.match(/(\d+)/);
      if (num) totalRevenue += parseInt(num[1]);
    });

    // Déterminer le statut
    let status: RalphSession['status'] = 'completed';
    if (content.includes('RALPH COMPLETE')) {
      status = 'completed';
    } else if (failuresMatch && parseInt(failuresMatch[1]) > (successesMatch ? parseInt(successesMatch[1]) : 0)) {
      status = 'failed';
    } else if (failuresMatch && parseInt(failuresMatch[1]) > 0) {
      status = 'partial';
    }

    // Vérifier si en cours (pas de summary)
    if (!totalIterMatch) {
      status = 'running';
    }

    const iterations = totalIterMatch ? parseInt(totalIterMatch[1]) : 0;
    const successes = successesMatch ? parseInt(successesMatch[1]) : 0;
    const failures = failuresMatch ? parseInt(failuresMatch[1]) : 0;
    const cost = costMatch ? parseFloat(costMatch[1]) : iterations * 0.15;

    // Calculer ROI
    const roi = cost > 0 ? Math.round((totalRevenue / cost) * 10) / 10 : 0;

    // Extraire date du sessionId
    const dateStr = sessionId.slice(0, 8);
    const year = dateStr.slice(0, 4);
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    const formattedDate = `${year}-${month}-${day}`;

    return {
      id: sessionId,
      date: formattedDate,
      prdFile: taskMatch ? taskMatch[1] : 'unknown',
      status,
      iterations,
      maxIterations: maxIterMatch ? parseInt(maxIterMatch[1]) : 10,
      successes,
      failures,
      duration: durationMatch ? durationMatch[1].trim() : 'N/A',
      estimatedCost: cost,
      revenueImpact: totalRevenue,
      roi,
      learningsSaved: 0, // On pourrait parser ça aussi
      errorsLogged: 0,
      patternsUpdated: 0,
    };
  } catch (e) {
    console.error(`Error parsing log ${logPath}:`, e);
    return null;
  }
}

// Lister les PRDs disponibles
function listAvailablePRDs(): Array<{ name: string; path: string; description: string }> {
  const prds: Array<{ name: string; path: string; description: string }> = [];

  // PRDs dans /prds
  if (fs.existsSync(PRDS_DIR)) {
    const files = fs.readdirSync(PRDS_DIR).filter(f => f.endsWith('.md'));
    files.forEach(file => {
      const content = fs.readFileSync(path.join(PRDS_DIR, file), 'utf-8');
      const titleMatch = content.match(/^#\s*(.+)/m);
      prds.push({
        name: file,
        path: `prds/${file}`,
        description: titleMatch ? titleMatch[1].slice(0, 100) : file,
      });
    });
  }

  // PRDs dans tools/ralph-loop
  const ralphPRDs = ['PRD-learning-projects.md', 'prd-template.md'];
  ralphPRDs.forEach(file => {
    const filePath = path.join(RALPH_PRDS_DIR, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const titleMatch = content.match(/^#\s*(.+)/m);
      prds.push({
        name: file,
        path: `tools/ralph-loop/${file}`,
        description: titleMatch ? titleMatch[1].slice(0, 100) : file,
      });
    }
  });

  return prds;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Action: Liste des PRDs
    if (action === 'prds') {
      return NextResponse.json({
        success: true,
        prds: listAvailablePRDs(),
      });
    }

    // Action: Logs d'une session spécifique
    if (action === 'logs') {
      const sessionId = searchParams.get('session');
      if (!sessionId) {
        return NextResponse.json({ success: false, error: 'session required' }, { status: 400 });
      }

      const logPath = path.join(LOGS_DIR, `ralph_${sessionId}.log`);
      if (!fs.existsSync(logPath)) {
        return NextResponse.json({ success: false, error: 'Log not found' }, { status: 404 });
      }

      const content = fs.readFileSync(logPath, 'utf-8');
      // Nettoyer les codes ANSI
      const cleanContent = content.replace(/\x1b\[[0-9;]*m/g, '');

      return NextResponse.json({
        success: true,
        logs: cleanContent,
        session: sessionId,
      });
    }

    // Par défaut: Liste des sessions
    const sessions: RalphSession[] = [];

    if (fs.existsSync(LOGS_DIR)) {
      const logFiles = fs.readdirSync(LOGS_DIR)
        .filter(f => f.startsWith('ralph_') && f.endsWith('.log') && !f.includes('iter_'))
        .sort()
        .reverse();

      for (const file of logFiles.slice(0, 50)) {
        const session = parseRalphLog(path.join(LOGS_DIR, file));
        if (session) {
          sessions.push(session);
        }
      }
    }

    // Calculer les stats
    const stats: RalphStats = {
      totalSessions: sessions.length,
      totalIterations: sessions.reduce((sum, s) => sum + s.iterations, 0),
      totalSuccesses: sessions.reduce((sum, s) => sum + s.successes, 0),
      totalFailures: sessions.reduce((sum, s) => sum + s.failures, 0),
      totalRevenueImpact: sessions.reduce((sum, s) => sum + s.revenueImpact, 0),
      totalCost: sessions.reduce((sum, s) => sum + s.estimatedCost, 0),
      averageROI: 0,
      bestSession: null,
    };

    if (stats.totalCost > 0) {
      stats.averageROI = Math.round((stats.totalRevenueImpact / stats.totalCost) * 10) / 10;
    }

    // Trouver la meilleure session
    const completedSessions = sessions.filter(s => s.status === 'completed' && s.roi > 0);
    if (completedSessions.length > 0) {
      stats.bestSession = completedSessions.reduce((best, s) => s.roi > best.roi ? s : best);
    }

    return NextResponse.json({
      success: true,
      sessions,
      stats,
      prds: listAvailablePRDs(),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Ralph API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }, { status: 500 });
  }
}
