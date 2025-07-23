const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('button')
    .setDescription('認証パネルを表示します'),

  async execute(interaction) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('✅ / 認証')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://your-render-app.onrender.com/login`)
    );
    await interaction.reply({ content: '以下のボタンから認証を開始してください：', components: [row], ephemeral: true });
  }
};
