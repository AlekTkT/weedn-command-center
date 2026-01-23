import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

const PROJECT_ROOT = process.env.WEEDN_PROJECT_PATH || '/Users/alektkt/Documents/weedn-project';
const LOGS_DIR = path.join(PROJECT_ROOT, 'logs', 'ralph');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session');
    const iteration = searchParams.get('iteration');
    const tail = parseInt(searchParams.get('tail') || '100');

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'session required',
      }, { status: 400 });
    }

    const cleanId = sessionId.replace('ralph_', '');

    // Si iteration spécifiée, lire le log d'itération
    if (iteration) {
      const iterLogPath = path.join(LOGS_DIR, `iter_${cleanId}_${iteration}.log`);
      if (!fs.existsSync(iterLogPath)) {
        return NextResponse.json({
          success: false,
          error: `Iteration log not found: ${iteration}`,
        }, { status: 404 });
      }

      const content = fs.readFileSync(iterLogPath, 'utf-8');
      const cleanContent = content.replace(/\x1b\[[0-9;]*m/g, '');

      return NextResponse.json({
        success: true,
        sessionId,
        iteration: parseInt(iteration),
        content: cleanContent,
        lines: cleanContent.split('\n').length,
      });
    }

    // Sinon, lire le log principal
    const mainLogPath = path.join(LOGS_DIR, `ralph_${cleanId}.log`);
    if (!fs.existsSync(mainLogPath)) {
      return NextResponse.json({
        success: false,
        error: 'Session log not found',
      }, { status: 404 });
    }

    const content = fs.readFileSync(mainLogPath, 'utf-8');
    const cleanContent = content.replace(/\x1b\[[0-9;]*m/g, '');
    const lines = cleanContent.split('\n');

    // Appliquer tail si demandé
    const outputLines = tail > 0 ? lines.slice(-tail) : lines;

    // Compter les itérations disponibles
    const iterationLogs = fs.readdirSync(LOGS_DIR)
      .filter(f => f.startsWith(`iter_${cleanId}_`) && f.endsWith('.log'))
      .map(f => {
        const match = f.match(/iter_\d+_(\d+)\.log/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(n => n > 0)
      .sort((a, b) => a - b);

    // Extraire les métriques en temps réel
    const metrics = extractRealTimeMetrics(cleanContent);

    return NextResponse.json({
      success: true,
      sessionId,
      content: outputLines.join('\n'),
      totalLines: lines.length,
      returnedLines: outputLines.length,
      iterations: iterationLogs,
      currentIteration: iterationLogs.length > 0 ? Math.max(...iterationLogs) : 0,
      metrics,
      isRunning: !cleanContent.includes('RALPH SUMMARY') && !cleanContent.includes('EXIT CONDITIONS MET'),
    });
  } catch (error) {
    console.error('Ralph logs error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur',
    }, { status: 500 });
  }
}

function extractRealTimeMetrics(content: string) {
  const metrics = {
    currentIteration: 0,
    maxIterations: 10,
    successes: 0,
    failures: 0,
    lastIterationDuration: 'N/A',
    brainLoaded: false,
    learningsLoaded: 0,
    errorsToAvoid: 0,
    patternsLoaded: 0,
  };

  // Current iteration
  const iterMatches = content.match(/--- Iteration (\d+) \/ (\d+) ---/g);
  if (iterMatches && iterMatches.length > 0) {
    const lastIter = iterMatches[iterMatches.length - 1];
    const nums = lastIter.match(/(\d+)/g);
    if (nums) {
      metrics.currentIteration = parseInt(nums[0]);
      metrics.maxIterations = parseInt(nums[1]);
    }
  }

  // Successes & Failures
  const successMatches = content.match(/Iteration \d+: SUCCESS/g);
  const failureMatches = content.match(/Iteration \d+: FAILED/g);
  metrics.successes = successMatches ? successMatches.length : 0;
  metrics.failures = failureMatches ? failureMatches.length : 0;

  // Brain loaded
  if (content.includes('Brain loaded with learnings')) {
    metrics.brainLoaded = true;
  }

  // Learnings loaded
  const learningsMatch = content.match(/(\d+) learnings loaded/);
  if (learningsMatch) {
    metrics.learningsLoaded = parseInt(learningsMatch[1]);
  }

  // Errors to avoid
  const errorsMatch = content.match(/(\d+) errors to avoid/);
  if (errorsMatch) {
    metrics.errorsToAvoid = parseInt(errorsMatch[1]);
  }

  // Patterns loaded
  const patternsMatch = content.match(/(\d+) patterns loaded/);
  if (patternsMatch) {
    metrics.patternsLoaded = parseInt(patternsMatch[1]);
  }

  // Last iteration duration
  const durationMatches = content.match(/Duration: (\d+)s/g);
  if (durationMatches && durationMatches.length > 0) {
    const lastDur = durationMatches[durationMatches.length - 1];
    const dur = lastDur.match(/(\d+)/);
    if (dur) {
      metrics.lastIterationDuration = `${dur[1]}s`;
    }
  }

  return metrics;
}
