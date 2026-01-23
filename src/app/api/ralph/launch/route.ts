import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export const dynamic = 'force-dynamic';

const PROJECT_ROOT = process.env.WEEDN_PROJECT_PATH || '/Users/alektkt/Documents/weedn-project';
const RALPH_SCRIPT = path.join(PROJECT_ROOT, 'tools', 'ralph-loop', 'ralph.sh');

// Stocker les process en cours (simple in-memory, limité)
const runningProcesses = new Map<string, { pid: number; startedAt: string; prd: string }>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      prdFile,
      maxIterations = 10,
      mode = 'auto', // auto, supervised, until-done
      exitCommand,
    } = body;

    if (!prdFile) {
      return NextResponse.json({
        success: false,
        error: 'prdFile is required',
      }, { status: 400 });
    }

    // Vérifier que le PRD existe
    const prdPath = path.join(PROJECT_ROOT, prdFile);
    if (!fs.existsSync(prdPath)) {
      return NextResponse.json({
        success: false,
        error: `PRD not found: ${prdFile}`,
      }, { status: 404 });
    }

    // Vérifier que le script Ralph existe
    if (!fs.existsSync(RALPH_SCRIPT)) {
      return NextResponse.json({
        success: false,
        error: 'Ralph script not found',
      }, { status: 500 });
    }

    // Construire les arguments
    const args = [
      '--task', prdPath,
      '--max-iterations', maxIterations.toString(),
    ];

    if (mode === 'until-done') {
      args.push('--until-done');
    } else if (mode === 'supervised') {
      args.push('--supervised');
    }

    if (exitCommand) {
      args.push('--exit-on', exitCommand);
    }

    // Générer un session ID
    const now = new Date();
    const sessionId = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);

    // Lancer Ralph en arrière-plan
    const child = spawn('bash', [RALPH_SCRIPT, ...args], {
      cwd: PROJECT_ROOT,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PATH: '/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:' + process.env.PATH,
      },
    });

    // Détacher le process pour qu'il continue après la réponse
    child.unref();

    // Stocker l'info du process
    if (child.pid) {
      runningProcesses.set(sessionId, {
        pid: child.pid,
        startedAt: now.toISOString(),
        prd: prdFile,
      });

      // Nettoyer après 24h
      setTimeout(() => {
        runningProcesses.delete(sessionId);
      }, 24 * 60 * 60 * 1000);
    }

    // Écouter les erreurs de démarrage (timeout court)
    let startError: string | null = null;
    const errorPromise = new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, 2000);
      child.stderr?.once('data', (data) => {
        startError = data.toString();
        clearTimeout(timeout);
        resolve();
      });
      child.once('error', (err) => {
        startError = err.message;
        clearTimeout(timeout);
        resolve();
      });
    });

    await errorPromise;

    if (startError && !startError.includes('Loading')) {
      return NextResponse.json({
        success: false,
        error: `Failed to start Ralph: ${startError}`,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Ralph launched successfully',
      sessionId: `ralph_${sessionId}`,
      pid: child.pid,
      config: {
        prdFile,
        maxIterations,
        mode,
      },
    });
  } catch (error) {
    console.error('Ralph launch error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }, { status: 500 });
  }
}

export async function GET() {
  // Retourner les sessions en cours
  const running: Array<{ sessionId: string; pid: number; startedAt: string; prd: string }> = [];

  for (const [sessionId, info] of runningProcesses.entries()) {
    // Vérifier si le process est toujours actif
    try {
      process.kill(info.pid, 0); // Signal 0 = test existence
      running.push({ sessionId: `ralph_${sessionId}`, ...info });
    } catch {
      // Process terminé, supprimer
      runningProcesses.delete(sessionId);
    }
  }

  return NextResponse.json({
    success: true,
    running,
  });
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session');

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'session required',
      }, { status: 400 });
    }

    const cleanId = sessionId.replace('ralph_', '');
    const info = runningProcesses.get(cleanId);

    if (!info) {
      return NextResponse.json({
        success: false,
        error: 'Session not found or already stopped',
      }, { status: 404 });
    }

    // Tuer le process
    try {
      process.kill(info.pid, 'SIGTERM');
      runningProcesses.delete(cleanId);

      return NextResponse.json({
        success: true,
        message: `Ralph session ${sessionId} stopped`,
      });
    } catch (e) {
      runningProcesses.delete(cleanId);
      return NextResponse.json({
        success: true,
        message: 'Session already stopped',
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur',
    }, { status: 500 });
  }
}
