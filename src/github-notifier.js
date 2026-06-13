const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { execSync } = require('child_process');

/**
 * Handle GitHub Push Event Webhook
 * @param {object} client Discord Client
 * @param {object} payload GitHub Webhook Payload
 * @param {string} channelId Target Discord Channel ID
 */
async function handleGithubPush(client, payload, channelId) {
  try {
    // Debug: Log payload structure
    console.log(`📡 [GitHub Notifier] Payload Keys: ${Object.keys(payload || {}).join(', ')}`);
    
    // Handle nesting (Smee body or URL-encoded 'payload' field)
    if (payload && payload.body) {
      console.log('📡 [GitHub Notifier] Detected nested body in payload. Unwrapping...');
      payload = payload.body;
    }
    
    if (payload && payload.payload) {
      console.log('📡 [GitHub Notifier] Detected nested "payload" key. Unwrapping...');
      payload = payload.payload;
    }

    // If payload is a string (common in URL-encoded webhooks), parse it
    if (typeof payload === 'string') {
      try {
        console.log('📡 [GitHub Notifier] Payload is a string. Parsing JSON...');
        payload = JSON.parse(payload);
      } catch (e) {
        console.error('❌ [GitHub Notifier] Failed to parse string payload as JSON:', e.message);
        return;
      }
    }
    
    if (!payload || !payload.commits || payload.commits.length === 0) {
      console.log('ℹ️ [GitHub Notifier] No commits found in payload. Skipping.');
      return;
    }

    // 1. Process Payload and Send Notification to Discord FIRST
    const repoName = payload?.repository?.full_name || 'Unknown Repo';
    const repo = payload.repository?.full_name || 'unknown/repo';
    const branch = (payload.ref || '').replace('refs/heads/', '') || 'unknown';
    const pusher = payload.pusher?.name || payload.sender?.login || 'Unknown';
    const commits = payload.commits;
    const compareUrl = payload.compare || payload.repository?.html_url;
    const token = process.env.GITHUB_TOKEN;
    const latestCommit = commits[commits.length - 1];

    console.log(`📝 [GitHub Notifier] Found ${commits.length} commits by ${pusher} on ${branch}`);

    const embed = new EmbedBuilder()
      .setColor('#2dba4e')
      .setAuthor({ 
        name: `${pusher} pushed to ${repo} [${branch}]`, 
        iconURL: payload.sender?.avatar_url,
        url: payload.repository?.html_url 
      })
      .setTitle(`[${repo}:${branch}] ${commits.length} new commit${commits.length > 1 ? 's' : ''}`)
      .setURL(compareUrl)
      .setTimestamp();

    let description = '';
    if (commits.length > 1) {
      description += `**Summary of ${commits.length} commits:**\n`;
      commits.slice(0, -1).forEach(c => {
        const h = (c.id || '').substring(0, 7);
        const m = (c.message || '').split('\n')[0];
        description += `• [\`${h}\`](${c.url}) ${m}\n`;
      });
      description += '\n';
    }

    description += `**Latest Commit: [\`${latestCommit.id.substring(0, 7)}\`](${latestCommit.url})**\n`;
    description += `> ${(latestCommit.message || 'No commit message').split('\n')[0]}\n`;
    
    // Add Diff Preview
    if (token && latestCommit.id) {
      try {
        const { data: commitData } = await axios.get(
          `https://api.github.com/repos/${repo}/commits/${latestCommit.id}`,
          {
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3.diff'
            },
            responseType: 'text',
            timeout: 5000
          }
        );
        const diffLines = (commitData || '').split('\n');
        let diffPreview = diffLines
          .filter(line => line.startsWith('+') || line.startsWith('-'))
          .filter(line => !line.startsWith('+++') && !line.startsWith('---'))
          .slice(0, 10)
          .join('\n');
        if (diffPreview) {
          description += `**Code Changes:**\n\`\`\`diff\n${diffPreview}\n${diffLines.length > 10 ? '...' : ''}\n\`\`\`\n`;
        }
      } catch (e) {
        console.warn(`⚠️ [GitHub Notifier] Could not fetch diff:`, e.message);
      }
    }

    embed.setDescription(description.substring(0, 4096));
    const content = `🔨 **New Push to ${repo}**\n👤 **${pusher}** pushed ${commits.length} commit${commits.length > 1 ? 's' : ''} to \`${branch}\``;

    const channel = await client.channels.fetch(channelId);
    if (channel) {
      await channel.send({ content, embeds: [embed] });
      console.log(`✅ [GitHub Notifier] Notification sent successfully.`);
    }

    // 2. Perform Auto-Update and Restart
    console.log('🔄 [GitHub Notifier] Webhook processed. Starting update sequence...');
    try {
      execSync('git pull origin main', { stdio: 'inherit' });
      console.log('✅ [GitHub Notifier] Code updated successfully. Waiting 5 seconds before restart...');
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const { restartBot } = require('./restart');
      restartBot();
    } catch (e) {
      console.error('❌ [GitHub Notifier] Auto-update/Restart failed:', e.message);
    }
  } catch (error) {
    console.error(`❌ [GitHub Notifier] Critical error:`, error.message);
  }
}

module.exports = {
  handleGithubPush
};
