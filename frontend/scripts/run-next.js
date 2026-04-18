/* eslint-disable @typescript-eslint/no-require-imports */
const net = require('node:net');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const command = process.argv[2] || 'dev';
const supportedCommands = new Set(['dev', 'build', 'start']);
const preferredPort = Number(process.env.PORT || 3000);
const maxPortChecks = 10;
const projectRoot = path.join(__dirname, '..');
const devLockPath = path.join(projectRoot, '.next', 'dev', 'lock');

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (error) => {
      if (error && (error.code === 'EADDRINUSE' || error.code === 'EACCES')) {
        resolve(false);
        return;
      }

      resolve(true);
    });
    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen({ port });
  });
}

async function findAvailablePort(startPort) {
  for (let offset = 0; offset < maxPortChecks; offset += 1) {
    const candidatePort = startPort + offset;
    // Try a short range so local dev keeps a predictable URL.
    if (await isPortAvailable(candidatePort)) {
      return candidatePort;
    }
  }

  throw new Error(
    `No free port found between ${startPort} and ${startPort + maxPortChecks - 1}.`
  );
}

function hasActiveDevLock() {
  if (!fs.existsSync(devLockPath)) {
    return false;
  }

  try {
    const fileDescriptor = fs.openSync(devLockPath, 'r+');
    fs.closeSync(fileDescriptor);
    return false;
  } catch (error) {
    return error && (error.code === 'EBUSY' || error.code === 'EPERM');
  }
}

async function main() {
  if (!supportedCommands.has(command)) {
    throw new Error(
      `Unsupported Next.js command "${command}". Use one of: ${[...supportedCommands].join(', ')}.`
    );
  }

  if (command === 'dev' && hasActiveDevLock()) {
    console.log(
      'A Next.js dev server for this frontend is already running in another terminal. Reuse that tab or stop the old server first.'
    );
    process.exit(0);
  }

  const nextBin = require.resolve('next/dist/bin/next');
  const commandArgs = [nextBin, command];

  if (command !== 'build') {
    const port = await findAvailablePort(preferredPort);

    if (port !== preferredPort) {
      console.log(`Port ${preferredPort} is busy, starting Next.js on http://localhost:${port}`);
    }

    commandArgs.push('--port', String(port));
  }

  if (command === 'dev') {
    // Turbopack is currently serving globals.css as unparsable in local dev,
    // so force webpack for the stable styled dashboard experience.
    commandArgs.push('--webpack');
  }

  commandArgs.push(...process.argv.slice(3));
  const child = spawn(
    process.execPath,
    commandArgs,
    {
      stdio: 'inherit',
      cwd: projectRoot,
      env: {
        ...process.env,
      },
    }
  );

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
