const { spawn } = require('child_process');
const net = require('net');

const isWindows = process.platform === 'win32';

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port, '127.0.0.1');
  });
}

function killProcessTree(proc) {
  if (!proc) return;
  if (isWindows) {
    try {
      spawn('taskkill', ['/pid', proc.pid, '/f', '/t'], { stdio: 'ignore', shell: true });
    } catch (e) {
      try { proc.kill(); } catch (err) {}
    }
  } else {
    try { proc.kill('SIGINT'); } catch (err) {}
  }
}

function runProcess(command, args, prefix, colorCode) {
  const color = `\x1b[${colorCode}m`;
  const reset = '\x1b[0m';
  
  console.log(`${color}[${prefix}] Starting: ${command} ${args.join(' ')}${reset}`);
  
  const proc = spawn(command, args, { shell: true });
  
  proc.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) console.log(`${color}[${prefix}]${reset} ${line}`);
    });
  });
  
  proc.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) console.error(`${color}[${prefix} - ERR]${reset} ${line}`);
    });
  });
  
  proc.on('error', (err) => {
    console.error(`${color}[${prefix} Error]${reset} Failed to start process: ${err.message}`);
  });

  return proc;
}

async function main() {
  console.log('\x1b[35m╔══════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[35m║             ContextPilot MVP Launcher            ║\x1b[0m');
  console.log('\x1b[35m║       Starting Server, Daemon & Dashboard        ║\x1b[0m');
  console.log('\x1b[35m╚══════════════════════════════════════════════════╝\x1b[0m\n');

  let server = null;
  let daemon = null;
  let waService = null;
  let nextjs = null;

  let exiting = false;
  const cleanExit = () => {
    if (exiting) return;
    exiting = true;
    console.log('\n\x1b[31m[Launcher] Stopping all services...\x1b[0m');
    killProcessTree(server);
    killProcessTree(daemon);
    killProcessTree(waService);
    killProcessTree(nextjs);
    setTimeout(() => process.exit(0), 500);
  };

  process.on('SIGINT', cleanExit);
  process.on('SIGTERM', cleanExit);

  // 1. Check & Start Server on Port 8001
  const serverInUse = await checkPort(8001);
  if (serverInUse) {
    console.log('\x1b[32m[Server] Port 8001 is already in use. Reusing the active context server.\x1b[0m');
  } else {
    server = runProcess('python', ['context_server.py'], 'Server', '32');
  }

  // 2. Wait 3 seconds, then start Daemon, WhatsApp, & Next.js
  setTimeout(async () => {
    // Start Daemon
    daemon = runProcess('python', ['context_daemon.py'], 'Daemon', '33');

    // Check & Start WhatsApp Service on Port 8002
    const waInUse = await checkPort(8002);
    if (waInUse) {
      console.log('\x1b[35m[WhatsApp] Port 8002 is already in use. Reusing the active WhatsApp service.\x1b[0m');
    } else {
      waService = runProcess('node', ['whatsapp-service.js'], 'WhatsApp', '35');
    }

    // Check & Start Next.js on Port 9002
    const nextInUse = await checkPort(9002);
    if (nextInUse) {
      console.log('\x1b[36m[Next.js] Port 9002 is already in use. Reusing the active dashboard.\x1b[0m');
    } else {
      nextjs = runProcess('npx', ['next', 'dev', '--turbopack', '-H', '0.0.0.0', '-p', '9002'], 'Next.js', '36');
    }
  }, 3000);
}

main().catch(err => {
  console.error('Launcher failed:', err);
});
