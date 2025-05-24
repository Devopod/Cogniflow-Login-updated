import { spawn } from 'child_process';

// Get the migration file name from command line arguments
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Please provide a migration file name');
  process.exit(1);
}

// Run the migration using tsx
const child = spawn('npx', ['tsx', `server/migrations/${migrationFile}.ts`], {
  stdio: 'inherit',
});

child.on('close', (code) => {
  process.exit(code || 0);
});