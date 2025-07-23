const express = require('express');
const session = require('express-session');
const OAuth2 = require('discord-oauth2');
const path = require('path');
require('dotenv').config();

const app = express();
const oauth = new OAuth2();

app.use(express.static('public'));
app.use(session({ secret: 'verifySecret', resave: false, saveUninitialized: true }));

app.get('/login', (req, res) => {
  const redirect = oauth.generateAuthUrl({
    clientId: process.env.CLIENT_ID,
    redirectUri: process.env.REDIRECT_URI,
    scope: ['identify', 'guilds.join'],
    response_type: 'code',
    prompt: 'consent'
  });
  res.redirect(redirect);
});

app.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const token = await oauth.tokenRequest({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      code,
      grantType: 'authorization_code',
      redirectUri: process.env.REDIRECT_URI,
      scope: 'identify guilds.join'
    });

    const user = await oauth.getUser(token.access_token);
    req.session.discord_user = user;
    res.redirect('/captcha');
  } catch {
    res.send('エラーが発生しました');
  }
});

app.get('/captcha', (req, res) => {
  if (!req.session.discord_user) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'captcha.html'));
});

app.get('/success', async (req, res) => {
  const user = req.session.discord_user;
  if (!user) return res.redirect('/');

  const { Client, GatewayIntentBits } = require('discord.js');
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.login(process.env.TOKEN);

  client.once('ready', async () => {
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (member) {
      await member.roles.add(process.env.ROLE_ID);
      const logChannel = await guild.channels.fetch(process.env.LOG_CHANNEL_ID);
      logChannel.send(`<@${user.id}> が認証に成功しました。`);
    }
    res.send('✅ 認証が完了しました。Discordを確認してください。');
    client.destroy();
  });
});

app.listen(3000);
