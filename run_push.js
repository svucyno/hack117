import { spawn } from 'child_process';
import process from 'process';

const child = spawn('npx.cmd', ['drizzle-kit', 'push'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

child.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);
  
  // If we see a prompt from Drizzle, hit Enter to accept the first/default option (Create new)
  if (output.includes('❯')) {
    child.stdin.write('\n');
  }
});

child.stderr.on('data', (data) => {
  process.stderr.write(data.toString());
});

child.on('close', (code) => {
  console.log(`Child process exited with code ${code}`);
  process.exit(code);
});
