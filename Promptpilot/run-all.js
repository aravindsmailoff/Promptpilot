const { spawn } = require('child_process');
const net = require('net');
const fs = require('fs');
const path = require('path');
const ngrok = require('@ngrok/ngrok');

const isWindows = process.platform === 'win32';

// Starts Ngrok Tunnel on port 9002 using the static domain and authtoken
function startTunnel() {
  return new Promise((resolve, reject) => {
    try {
      console.log('\x1b[34m[Tunnel] Starting Ngrok Tunnel on port 9002...\x1b[0m');
      
      ngrok.forward({
        addr: 9002,
        authtoken: '33E8pSxAQ7L2zzp3HkXHhagbZZ2_5tdkdjAhPF3aVG5hhQk23',
        domain: 'drudgingly-unshivered-sarah.ngrok-free.dev'
      }).then((listener) => {
        const url = listener.url();
        console.log('\n\x1b[36m╔══════════════════════════════════════════════════╗\x1b[0m');
        console.log(`\x1b[36m║     Ngrok Tunnel URL successfully established:   ║\x1b[0m`);
        console.log(`\x1b[36m║  \x1b[4m${url}\x1b[24m  ║\x1b[0m`);
        console.log('\x1b[36m╚══════════════════════════════════════════════════╝\x1b[0m\n');
        
        resolve({ url, tunnelObj: listener });
      }).catch((err) => {
        console.error('\x1b[31m[Tunnel - ERR] Ngrok startup error:\x1b[0m', err);
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

function updateConfigFiles(newUrl) {
  const newDomain = newUrl.replace('https://', '').replace('http://', '');
  
  // Update .env and .env.local
  const envFiles = ['.env', '.env.local'];
  envFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        // Match NEXTAUTH_URL=... and update
        const regexGeneric = /NEXTAUTH_URL=[^\r\n]+/g;
        if (regexGeneric.test(content)) {
          content = content.replace(regexGeneric, `NEXTAUTH_URL=${newUrl}`);
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`\x1b[32m[Config] Successfully updated ${file} with new Tunnel URL.\x1b[0m`);
        } else {
          console.log(`\x1b[33m[Config] NEXTAUTH_URL not found in ${file}. Skipping...\x1b[0m`);
        }
      } catch (err) {
        console.error(`\x1b[31m[Config - ERR] Failed to update ${file}:\x1b[0m`, err.message);
      }
    }
  });

  // Update capacitor.config.ts
  const capacitorPath = path.join(__dirname, 'capacitor.config.ts');
  if (fs.existsSync(capacitorPath)) {
    try {
      let content = fs.readFileSync(capacitorPath, 'utf8');
      
      // Replace references to trycloudflare and ngrok subdomains in capacitor.config.ts
      const regexSubdomain = /[a-zA-Z0-9-]+\.(trycloudflare\.com|ngrok-free\.dev|ngrok-free\.app)/g;
      if (regexSubdomain.test(content)) {
        content = content.replace(regexSubdomain, newDomain);
        fs.writeFileSync(capacitorPath, content, 'utf8');
        console.log(`\x1b[32m[Config] Successfully updated capacitor.config.ts with new Tunnel domain (${newDomain}).\x1b[0m`);
      } else {
        console.log(`\x1b[33m[Config] No matching tunnel domains found in capacitor.config.ts to replace.\x1b[0m`);
      }
    } catch (err) {
      console.error(`\x1b[31m[Config - ERR] Failed to update capacitor.config.ts:\x1b[0m`, err.message);
    }
  }
}

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
  console.log('\x1b[35m║             PromptPilot MVP Launcher             ║\x1b[0m');
  console.log('\x1b[35m║       Starting Server, Daemon & Dashboard        ║\x1b[0m');
  console.log('\x1b[35m╚══════════════════════════════════════════════════╝\x1b[0m\n');

  let server = null;
  let daemon = null;
  let waService = null;
  let nextjs = null;
  let tunnelObj = null;

  let exiting = false;
  const cleanExit = () => {
    if (exiting) return;
    exiting = true;
    console.log('\n\x1b[31m[Launcher] Stopping all services...\x1b[0m');
    if (tunnelObj) {
      try {
        console.log('\x1b[31m[Launcher] Stopping Ngrok Tunnel...\x1b[0m');
        tunnelObj.close();
      } catch (e) {}
    }
    killProcessTree(server);
    killProcessTree(daemon);
    killProcessTree(waService);
    killProcessTree(nextjs);
    setTimeout(() => process.exit(0), 500);
  };

  process.on('SIGINT', cleanExit);
  process.on('SIGTERM', cleanExit);

  // Start Ngrok Tunnel first, and update configuration files
  try {
    const res = await startTunnel();
    tunnelObj = res.tunnelObj;
    updateConfigFiles(res.url);
  } catch (err) {
    console.error('\x1b[31m[Launcher - ERR] Failed to start tunnel or update configs:\x1b[0m', err);
    console.log('\x1b[33mContinuing dev server startup without tunnel...\x1b[0m');
  }

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

    // Clean up all services when daemon is stopped (e.g., Quit from System Tray)
    daemon.on('exit', (code) => {
      console.log('\x1b[31m[Launcher] System tray daemon exited. Cleaning up all other services...\x1b[0m');
      cleanExit();
    });

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
      nextjs = runProcess('npx', ['next', 'dev', '-H', '0.0.0.0', '-p', '9002'], 'Next.js', '36');
    }
  }, 3000);
}

main().catch(err => {
  console.error('Launcher failed:', err);
});
