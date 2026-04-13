const { spawn } = require('node:child_process');
const path = require('node:path');

const command = process.argv[2] || 'dev';
const supportedCommands = new Set(['dev', 'start']);
const projectRoot = path.join(__dirname, '..');
const serverEntry = path.join(projectRoot, 'server.js');

function getCommandConfig() {
  if (command === 'dev') {
    return {
      executable: process.execPath,
      args: [require.resolve('nodemon/bin/nodemon.js'), serverEntry, ...process.argv.slice(3)],
    };
  }

  return {
    executable: process.execPath,
    args: [serverEntry, ...process.argv.slice(3)],
  };
}

function forwardSignal(child, signal) {
  if (!child.killed) {
    child.kill(signal);
  }
}

async function main() {
  if (!supportedCommands.has(command)) {
    throw new Error(
      `Unsupported backend command "${command}". Use one of: ${[...supportedCommands].join(', ')}.`
    );
  }

  const commandConfig = getCommandConfig();
  const child = spawn(commandConfig.executable, commandConfig.args, {
    cwd: projectRoot,
    stdio: 'inherit',
    env: process.env,
  });

  process.on('SIGINT', () => forwardSignal(child, 'SIGINT'));
  process.on('SIGTERM', () => forwardSignal(child, 'SIGTERM'));

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
