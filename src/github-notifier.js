const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

/**
 * Handle GitHub Push Event Webhook
 * @param {object} client Discord Client
 * @param {object} payload GitHub Webhook Payload
 * @param {string} channelId Target Discord Channel ID
 */
async function handleGithubPush(client, payload, channelId) {
  if (!payload || !payload.commits) return;

  const repo = payload.repository.full_name;
  const branch = payload.ref.replace('refs/heads/', '');
  const pusher = payload.pusher.name;
  const commits = payload.commits;
  const compareUrl = payload.compare;
  const token = process.env.GITHUB_TOKEN;

  const embed = new EmbedBuilder()
    .setColor('#2dba4e') // GitHub Green
    .setAuthor({ 
      name: `${pusher} pushed to ${repo} [${branch}]`, 
      iconURL: payload.sender.avatar_url,
      url: payload.repository.html_url 
    })
    .setTitle(`[${repo}:${branch}] ${commits.length} new commit${commits.length > 1 ? 's' : ''}`)
    .setURL(compareUrl)
    .setTimestamp();

  let description = '';
  
  // Take the latest commit for detailed view to avoid hitting limits
  const latestCommit = commits[commits.length - 1];
  
  // Header for all commits
  if (commits.length > 1) {
    description += `**Summary of ${commits.length} commits:**\n`;
    commits.slice(0, -1).forEach(c => {
      description += `• [\`${c.id.substring(0, 7)}\`](${c.url}) ${c.message.split('\n')[0]}\n`;
    });
    description += '\n';
  }

  // Detailed view for the most recent commit
  const shortHash = latestCommit.id.substring(0, 7);
  const message = latestCommit.message.split('\n')[0];
  const body = latestCommit.message.split('\n').slice(1).join('\n').trim();

  description += `**Latest Commit: [\`${shortHash}\`](${latestCommit.url})**\n`;
  description += `> ${message}\n`;
  if (body) description += `> *${body}*\n`;
  description += '\n';

  // Fetch Diff/Patch if Token is available
  if (token) {
    try {
      const { data: commitData } = await axios.get(
        `https://api.github.com/repos/${repo}/commits/${latestCommit.id}`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3.diff'
          },
          responseType: 'text'
        }
      );

      // Simple parsing of diff to get a preview
      // We take the first 15 lines of the diff for brevity
      const diffLines = commitData.split('\n');
      let diffPreview = diffLines
        .filter(line => line.startsWith('+') || line.startsWith('-'))
        .filter(line => !line.startsWith('+++') && !line.startsWith('---'))
        .slice(0, 10) // Show top 10 changed lines
        .join('\n');

      if (diffPreview) {
        description += `**Code Changes:**\n\`\`\`diff\n${diffPreview}\n${diffLines.length > 10 ? '...' : ''}\n\`\`\`\n`;
      }
    } catch (e) {
      console.warn('⚠️ Could not fetch commit diff:', e.message);
    }
  }

  // Add list of changed files
  const filesChanged = [...latestCommit.added, ...latestCommit.modified, ...latestCommit.removed];
  if (filesChanged.length > 0) {
    description += `**Files:** \`${filesChanged.join('`, `')}\``;
  }

  embed.setDescription(description.substring(0, 4096)); // Ensure stays within Discord limits

  try {
    const channel = await client.channels.fetch(channelId);
    if (channel) {
      await channel.send({ embeds: [embed] });
      console.log(`✅ GitHub detailed notification sent to ${channelId}`);
    }
  } catch (error) {
    console.error(`❌ Failed to send GitHub notification: ${error.message}`);
  }
}

module.exports = {
  handleGithubPush
};
