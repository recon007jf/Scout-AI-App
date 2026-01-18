const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BUILD_INFO_PATH = path.join(__dirname, '../lib/build-info.json');

try {
    // Get Git SHA
    const commitSha = execSync('git rev-parse --short HEAD').toString().trim();

    // Get Timestamp
    const timestamp = new Date().toISOString();

    // Get Package Version (Expected App Version)
    const packageJson = require('../package.json');
    const version = packageJson.version;

    const buildInfo = {
        commit: commitSha,
        timestamp: timestamp,
        version: version,
        buildId: process.env.VERCEL_GIT_COMMIT_SHA || commitSha // Vercel fallback
    };

    console.log('🔒 Generating Build Info:', buildInfo);

    fs.writeFileSync(BUILD_INFO_PATH, JSON.stringify(buildInfo, null, 2));

} catch (error) {
    console.error('❌ Failed to generate build info:', error);
    // Fallback for non-git environments (e.g. some CI) if needed, 
    // but for this strict protocol, we want to fail or use placeholders.
    const fallback = {
        commit: "dev",
        timestamp: new Date().toISOString(),
        version: "0.0.0-dev",
        buildId: "dev"
    };
    fs.writeFileSync(BUILD_INFO_PATH, JSON.stringify(fallback, null, 2));
}
