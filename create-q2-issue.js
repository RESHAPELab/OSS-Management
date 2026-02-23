// Use ESM dynamic import for Octokit in CommonJS context
let Octokit;
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

(async () => {
  // Load Octokit via dynamic import to support ESM-only package
  const mod = await import('@octokit/rest');
  Octokit = mod.Octokit;
  const owner = 'OSS-Doorway-Dev';
  const repo = 'futdyfyuiiojkjophioguifyu-software';
  const questId = 'Q2';
  const taskId = 'T1';
  const CLASS_ID = '68a770b8140b9c0174c13ce7';

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.PAT || process.env.GITHUB_PAT;
  if (!token) {
    console.error('Missing GitHub token in env (GITHUB_TOKEN)');
    process.exit(1);
  }
  const octokit = new Octokit({ auth: token });

  // Try to load accept text from DB quest_configs
  let accept = null;
  let titleSuffix = '';
  try {
    const uri = process.env.OSS_DOORWAY_DB_URI;
    const dbName = process.env.OSS_DOORWAY_DB_NAME;
    if (uri && dbName) {
      const conn = await mongoose.createConnection(uri);
      const db = conn.useDb(dbName);
      const col = db.collection('quest_configs');
      const cfgDoc = await col.findOne({ $or: [ { groupId: CLASS_ID }, { configId: CLASS_ID }, { classId: CLASS_ID } ] });
      if (cfgDoc && cfgDoc.questConfig && cfgDoc.questConfig[questId] && cfgDoc.questConfig[questId][taskId]) {
        accept = cfgDoc.questConfig[questId][taskId].accept || null;
        titleSuffix = cfgDoc.questConfig[questId][taskId].desc || '';
      }
      await conn.close();
    }
  } catch (e) {
    console.warn('[create-q2-issue] DB read failed, will fallback:', e.message);
  }

  // Fallback to local file if DB not available
  if (!accept) {
    try {
      const localPath = path.join(__dirname, 'chicago.json');
      if (fs.existsSync(localPath)) {
        const json = JSON.parse(fs.readFileSync(localPath, 'utf8'));
        if (json[questId] && json[questId][taskId]) {
          accept = json[questId][taskId].accept || null;
          titleSuffix = json[questId][taskId].desc || '';
        }
      }
    } catch (e) {
      console.warn('[create-q2-issue] Local fallback failed:', e.message);
    }
  }

  if (!accept) {
    accept = `### Q2.T1\n\nThis is the kickoff issue for ${questId}.${taskId}.`;
  }

  const questNumber = 2;
  const taskNumber = 1;
  const issueTitle = `Software-Q${questNumber} T${taskNumber}: ${titleSuffix || 'Task'}`.trim();

  try {
    const res = await octokit.issues.create({ owner, repo, title: issueTitle, body: accept });
    console.log('Created issue #', res.data.number, 'at', res.data.html_url);
  } catch (e) {
    console.error('Failed to create issue:', e.status, e.message);
    console.error(e.response?.data || e);
    process.exit(2);
  }
})();
