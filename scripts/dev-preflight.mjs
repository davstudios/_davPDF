import net from 'node:net';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const port = Number(process.argv[2] || 17333);
const root = path.resolve(process.cwd());

function portIsFree() {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once('error', () => resolve(false));
    server.listen({ port, host: '127.0.0.1', exclusive: true }, () => {
      server.close(() => resolve(true));
    });
  });
}

function runPowerShell(script) {
  return execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function staleWindowsProcesses() {
  const escapedRoot = root.replace(/'/g, "''");
  const script = `$root='${escapedRoot}'; Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -ne ${process.pid} -and $_.ProcessId -ne ${process.ppid} -and $_.CommandLine -and $_.CommandLine.Contains($root) -and ($_.CommandLine -match 'node_modules[\\/]vite|@tauri-apps[\\/]cli|target[\\/]debug[\\/]davpdf|src-tauri') } | Select-Object ProcessId,Name,CommandLine | ConvertTo-Json -Compress`;
  const raw = runPowerShell(script);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [parsed];
}

function stopTree(pid) {
  try {
    execFileSync('taskkill.exe', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function windowsPortOwner() {
  const raw = runPowerShell(`$c=Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1; if($c){$p=Get-CimInstance Win32_Process -Filter \"ProcessId=$($c.OwningProcess)\"; [pscustomobject]@{ProcessId=$p.ProcessId;Name=$p.Name;CommandLine=$p.CommandLine} | ConvertTo-Json -Compress}`);
  return raw ? JSON.parse(raw) : null;
}

if (process.platform === 'win32') {
  let cleaned = 0;
  for (const proc of staleWindowsProcesses()) {
    if (stopTree(proc.ProcessId)) cleaned += 1;
  }
  if (cleaned) {
    process.stdout.write(`Pulite ${cleaned} sessioni di sviluppo _davPDF precedenti.\n`);
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
}

if (await portIsFree()) {
  process.stdout.write(`Porta di sviluppo ${port} disponibile.\n`);
  process.exit(0);
}

if (process.platform === 'win32') {
  const owner = windowsPortOwner();
  if (owner) {
    const command = String(owner.CommandLine || '');
    if (command.toLowerCase().includes(root.toLowerCase())) {
      stopTree(owner.ProcessId);
      await new Promise((resolve) => setTimeout(resolve, 600));
      if (await portIsFree()) {
        process.stdout.write(`Porta ${port} liberata da una vecchia istanza _davPDF.\n`);
        process.exit(0);
      }
    }
    process.stderr.write(`La porta ${port} e occupata da ${owner.Name || 'un altro processo'} (PID ${owner.ProcessId}). Chiudi quel programma e riprova.\n`);
    process.exit(1);
  }
}

process.stderr.write(`La porta di sviluppo ${port} e gia occupata. Chiudi il processo che la usa e riprova.\n`);
process.exit(1);
