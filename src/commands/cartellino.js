
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('cartellino')
    .setDescription('Invia il pannello per il cartellino di servizio')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#3b82f6')
      .setAuthor({ name: 'Sistema Cartellino | Il Tuo Locale' })
      .setTitle('💳 Sistema Cartellino Dipendenti')
      .setDescription(
        'Benvenuto nel **sistema cartellini**!\n' +
        'Qui sotto troverai i pulsanti per gestire il tuo turno di servizio.\n\n' +
        '🟢 **Timbra** ➔ Inizia il turno di servizio registrando l\'orario.\n' +
        '🔴 **Stimbra** ➔ Termina il turno e registra le ore svolte.\n' +
        '🟡 **Pausa** ➔ Metti in pausa il turno (o riclicca per rientrare).\n' +
        '🔵 **Info** ➔ Controlla lo storico delle tue ore accumulate.\n' +
        '👥 **In Servizio** ➔ Visualizza chi è attualmente timbrato.'
      )
      .setFooter({ text: 'Sistema Gestione Orari - Staff' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('btn_timbra').setLabel('Timbra').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('btn_stimbra').setLabel('Stimbra').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('btn_pausa').setLabel('Pausa').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('btn_info').setLabel('Info').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('btn_inservizio').setLabel('In Servizio').setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
Clicca su Commit changes.

2. Codice per src/app.js

Apri src/app.js su GitHub, premi la matita, scorri fino in fondo a tutto il file e incolla questo blocco alla fine:

JavaScript
/* Gestione pulsanti cartellino */
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const { customId, user } = interaction;

  if (customId === 'btn_timbra') {
    await interaction.reply({ content: `✅ **${user.username}**, hai timbrato il cartellino! Buon lavoro.`, flags: 64 });
  } 
  else if (customId === 'btn_stimbra') {
    await interaction.reply({ content: `🔴 **${user.username}**, hai stimbrato. Turno terminato!`, flags: 64 });
  }
  else if (customId === 'btn_pausa') {
    await interaction.reply({ content: `🟡 Stato pausa aggiornato per **${user.username}**.`, flags: 64 });
  }
  else if (customId === 'btn_info') {
    await interaction.reply({ content: `📊 Sezione informazioni orario.`, flags: 64 });
  }
  else if (customId === 'btn_inservizio') {
    await interaction.reply({ content: `👥 **Persone in servizio:** funzione da collegare al DB.`, flags: 64 });
  }
});
