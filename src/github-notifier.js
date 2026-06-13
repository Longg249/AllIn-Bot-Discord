const { EmbedBuilder } = require('discord.js');

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
  
  // Take up to 5 latest commits to avoid hitting embed limits
  const visibleCommits = commits.slice(-5);
  
  visibleCommits.forEach(commit => {
    const shortHash = commit.id.substring(0, 7);
    const message = commit.message.split('\n')[0]; // First line of commit message
    const body = commit.message.split('\n').slice(1).join('\n').trim(); // Detailed body
    
    description += `[\`${shortHash}\`](${commit.url}) ${message} - *by ${commit.author.name}*\n`;
    
    // Add detailed body if present
    if (body) {
      // Indent and format the body
      const formattedBody = body.split('\n').map(line => `> ${line}`).join('\n');
      description += `${formattedBody}\n`;
    }

    // Add list of changed files if small
    if (commit.added.length > 0) description += `  + ${commit.added.length} files\n`;
    if (commit.modified.length > 0) description += `  ~ ${commit.modified.length} files\n`;
    if (commit.removed.length > 0) description += `  - ${commit.removed.length} files\n`;
    
    description += '\n';
  });

  if (commits.length > 5) {
    description += `*... and ${commits.length - 5} more commits.*`;
  }

  embed.setDescription(description || 'No commit details available.');

  try {
    const channel = await client.channels.fetch(channelId);
    if (channel) {
      await channel.send({ embeds: [embed] });
      console.log(`✅ GitHub notification sent to channel ${channelId}`);
    }
  } catch (error) {
    console.error(`❌ Failed to send GitHub notification: ${error.message}`);
  }
}

module.exports = {
  handleGithubPush
};
