const fs = require('fs');
const path = require('path');

const ENV_DIRECTORY = 'env';
const envDirPath = path.join(__dirname, ENV_DIRECTORY);

const trimQuotes = value => {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
};

const loadEnvFile = filePath => {
  const contents = fs.readFileSync(filePath, 'utf8');

  contents.split(/\r?\n/).forEach(line => {
    if (!line || line.trim().startsWith('#')) {
      return;
    }

    const [rawKey, ...rawValueParts] = line.split('=');
    if (!rawKey || rawValueParts.length === 0) {
      return;
    }

    const key = rawKey.trim().replace(/^export\s+/, '');
    if (!key) {
      return;
    }

    const rawValue = rawValueParts.join('=').trim();
    const value = trimQuotes(rawValue);

    if (typeof process.env[key] === 'undefined') {
      process.env[key] = value;
    }
  });
};

const loadEnvFromDirectory = dir => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const envFiles = [
    '.env',
    `.env.${nodeEnv}`,
    '.env.local',
    `.env.${nodeEnv}.local`,
  ];

  envFiles.forEach(fileName => {
    const filePath = path.join(dir, fileName);
    if (fs.existsSync(filePath)) {
      loadEnvFile(filePath);
    }
  });
};

if (fs.existsSync(envDirPath)) {
  loadEnvFromDirectory(envDirPath);
}

const resolveSupportsEnvDir = () => {
  try {
    const nextPackage = require('next/package.json');
    const [major] = (nextPackage?.version || '0').split('.');
    return Number.parseInt(major, 10) >= 15;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      'Unable to determine Next.js version for envDir support.',
      error
    );
    return false;
  }
};

const supportsEnvDir = resolveSupportsEnvDir();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is enabled by default in Next.js 13+
};

if (supportsEnvDir) {
  nextConfig.experimental = {
    ...(nextConfig.experimental || {}),
    envDir: ENV_DIRECTORY,
  };
}

module.exports = nextConfig;
