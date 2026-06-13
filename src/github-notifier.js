const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

/**
 * Handle GitHub Push Event Webhook
 * @param {object} client Discord Client
 * @param {object} payload GitHub Webhook Payload
 * @param {string} channelId Target Discord Channel ID
 */
async function handleGithubPush(client, payload, channelId) {
  try {
    console.log(`📡 GitHub Webhook received for repo: ${payload?.repository?.full_name}`);
    
    if (!payload || !payload.commits || payload.commits.length === 0) {
      console.log('ℹ️ GitHub Webhook: No commits in payload, skipping.');
      return;
    }

    const repo = payload.repository?.full_name || 'unknown/repo';
    const branch = (payload.ref || '').replace('refs/heads/', '') || 'unknown';
    const pusher = payload.pusher?.name || payload.sender?.login || 'Unknown';
    const commits = payload.commits;
    const compareUrl = payload.compare || payload.repository?.html_url;
    const token = process.env.GITHUB_TOKEN;

    const latestCommit = commits[commits.length - 1];
    if (!latestCommit) return;

    const shortHash = (latestCommit.id || '').substring(0, 7) || '???????';
    const message = (latestCommit.message || 'No commit message').split('\n')[0];
    const body = (latestCommit.message || '').split('\n').slice(1).join('\n').trim();

    const embed = new EmbedBuilder()
      .setColor('#2dba4e') // GitHub Green
      .setAuthor({ 
        name: `${pusher} pushed to ${repo} [${branch}]`, 
        iconURL: payload.sender?.avatar_url,
        url: payload.repository?.html_url 
      })
      .setTitle(`[${repo}:${branch}] ${commits.length} new commit${commits.length > 1 ? 's' : ''}`)
      .setURL(compareUrl)
      .setTimestamp();

    let description = '';
    
    // Summary for multiple commits
    if (commits.length > 1) {
      description += `**Summary of ${commits.length} commits:**\n`;
      commits.slice(0, -1).forEach(c => {
        const h = (c.id || '').substring(0, 7);
        const m = (c.message || '').split('\n')[0];
        description += `• [\`${h}\`](${c.url}) ${m}\n`;
      });
      description += '\n';
    }

    description += `**Latest Commit: [\`${shortHash}\`](${latestCommit.url})**\n`;
    description += `> ${message}\n`;
    if (body) description += `> *${body.length > 500 ? body.substring(0, 500) + '...' : body}*\n`;
    description += '\n';

    // Fetch Diff/Patch if Token is available
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
        console.warn(`⚠️ Could not fetch commit diff for ${shortHash}:`, e.message);
      }
    }

    const filesChanged = [
      ...(latestCommit.added || []), 
      ...(latestCommit.modified || []), 
      ...(latestCommit.removed || [])
    ];
    if (filesChanged.length > 0) {
      const fileList = filesChanged.join('`, `');
      description += `**Files:** \`${fileList.length > 500 ? fileList.substring(0, 500) + '...' : fileList}\``;
    }

    embed.setDescription(description.substring(0, 4096));

    const content = `🔨 **New Push to ${repo}**\n👤 **${pusher}** pushed ${commits.length} commit${commits.length > 1 ? 's' : ''} to \`${branch}\`\n📝 Latest: *${message}*`;

    const channel = await client.channels.fetch(channelId);
    if (channel) {
      await channel.send({ content, embeds: [embed] });
      console.log(`✅ GitHub notification sent to channel ${channelId}`);
    } else {
      console.error(`❌ Target channel ${channelId} not found`);
    }
  } catch (error) {
    console.error(`❌ Critical error in handleGithubPush:`, error);
  }
}

module.exports = {
  handleGithubPush
};
