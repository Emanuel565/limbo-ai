#!/usr/bin/env node
/**
 * Limbo AI - All-in-One Dev Runner
 * Inicia de forma unificada e concorrente:
 * 1. Next.js (Frontend & Rotas de API App Router na porta 3000)
 * 2. Convex Cloud Backend (Banco de dados em tempo real & Funções)
 * 3. Scheduler Daemon (Monitoramento autônomo e publicação de posts)
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const isWin = process.platform === 'win32';
const rootDir = process.cwd();

// Cores ANSI para o terminal
const colors = {
    reset: '\x1b[0m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
};

function formatPrefix(name, color) {
    return `${color}${colors.bold}[${name.padEnd(8, ' ')}]${colors.reset} `;
}

function pipeOutput(child, name, color) {
    const prefix = formatPrefix(name, color);

    child.stdout?.on('data', (data) => {
        const text = data.toString();
        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (i === lines.length - 1 && lines[i] === '') continue;
            process.stdout.write(`${prefix}${lines[i]}\n`);
        }
    });

    child.stderr?.on('data', (data) => {
        const text = data.toString();
        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (i === lines.length - 1 && lines[i] === '') continue;
            process.stderr.write(`${prefix}${colors.red}${lines[i]}${colors.reset}\n`);
        }
    });
}

console.log(`${colors.magenta}${colors.bold}====================================================${colors.reset}`);
console.log(`${colors.cyan}${colors.bold}🚀 LIMBO AI - ECOSSISTEMA FULLSTACK INTEGRADO${colors.reset}`);
console.log(`${colors.dim}Iniciando Frontend, APIs, Convex Backend e Scheduler...${colors.reset}`);
console.log(`${colors.magenta}${colors.bold}====================================================${colors.reset}\n`);

const processes = [];

// 1. Next.js Dev Server (Frontend + Next API Routes)
const nextBin = path.join(rootDir, 'node_modules', 'next', 'dist', 'bin', 'next');
const nextProc = spawn(process.execPath, [nextBin, 'dev'], {
    cwd: rootDir,
    env: { ...process.env, FORCE_COLOR: '1' },
});
pipeOutput(nextProc, 'NEXT.JS', colors.cyan);
processes.push({ name: 'Next.js', proc: nextProc });

// 2. Convex Cloud Backend (se configurado)
const convexBin = path.join(rootDir, 'node_modules', 'convex', 'bin', 'main.js');
const hasConvex = fs.existsSync(convexBin);

if (hasConvex) {
    const convexProc = spawn(process.execPath, [convexBin, 'dev'], {
        cwd: rootDir,
        env: { ...process.env, FORCE_COLOR: '1' },
    });
    pipeOutput(convexProc, 'CONVEX', colors.magenta);
    processes.push({ name: 'Convex', proc: convexProc });
} else {
    console.log(`${formatPrefix('CONVEX', colors.yellow)}convex package não localizado no node_modules.`);
}

// 3. Scheduler Daemon (Agendador de postagens & auto-publicação)
const schedulerScript = path.join(rootDir, 'tools', 'scheduler-daemon.js');
if (fs.existsSync(schedulerScript)) {
    const daemonProc = spawn(process.execPath, [schedulerScript], {
        cwd: rootDir,
        env: { ...process.env, FORCE_COLOR: '1' },
    });
    pipeOutput(daemonProc, 'DAEMON', colors.green);
    processes.push({ name: 'Scheduler Daemon', proc: daemonProc });
}

// Encerramento elegante
function killAll() {
    console.log(`\n${colors.yellow}[SHUTDOWN] Finalizando todos os serviços do Limbo AI...${colors.reset}`);
    for (const { proc, name } of processes) {
        try {
            if (isWin) {
                // No Windows, encerra árvore de processos
                spawn('taskkill', ['/pid', String(proc.pid), '/f', '/t'], { stdio: 'ignore' });
            } else {
                proc.kill('SIGTERM');
            }
        } catch {
            // safe
        }
    }
    process.exit(0);
}

process.on('SIGINT', killAll);
process.on('SIGTERM', killAll);
