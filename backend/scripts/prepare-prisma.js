const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const envPath = path.join(__dirname, '../.env');
let dbUrl = process.env.DATABASE_URL;

if (!dbUrl && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
  if (match) {
    dbUrl = match[1];
  }
}

if (!dbUrl) {
  dbUrl = 'file:./dev.db';
  fs.writeFileSync(envPath, `PORT=3001\nDATABASE_URL="file:./dev.db"\n`);
  console.log('[Prisma Prep] Created default backend/.env with DATABASE_URL="file:./dev.db"');
}

const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');
const targetProvider = isPostgres ? 'postgresql' : 'sqlite';

const updatedSchema = schema.replace(
  /provider\s*=\s*"(sqlite|postgresql)"/,
  `provider = "${targetProvider}"`
);

if (updatedSchema !== schema) {
  fs.writeFileSync(schemaPath, updatedSchema);
  console.log(`[Prisma Prep] Provider updated to "${targetProvider}" based on DATABASE_URL (${dbUrl.slice(0, 15)}...)`);
} else {
  console.log(`[Prisma Prep] Provider already set to "${targetProvider}"`);
}

// Auto-inicializa o banco se ainda não existir (SQLite) ou se for Postgres (sempre push)
const dbFilePath = path.join(__dirname, '../prisma/dev.db');
const needsInit = isPostgres || !fs.existsSync(dbFilePath);

if (needsInit) {
  try {
    console.log('[Prisma Prep] Initializing database (prisma generate + db push)...');
    execSync('npx prisma generate', { stdio: 'inherit', cwd: path.join(__dirname, '..'), env: process.env });
    execSync('npx prisma db push --skip-generate', { stdio: 'inherit', cwd: path.join(__dirname, '..'), env: process.env });
    console.log('[Prisma Prep] Database initialized successfully.');
  } catch (err) {
    console.error('[Prisma Prep] Failed to initialize database:', err.message);
    process.exit(1);
  }
}
