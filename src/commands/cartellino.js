import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('cartellino')
    .setDescription('Invia il tuo pannello personale per il cartellino di servizio'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#3b82f6')
      .setAuthor({ name: 'Sistema Cartellino | Paddock Pub' })
      .setTitle('💳 Cartellino Personale Dipendente')
      .setDescription(
        'Questo è il tuo pannello di gestione del turno.\n\n' +
        '🟢 **Timbra** ➔ Inizia il tuo turno di servizio.\n' +
        '🔴 **Stimbra** ➔ Termina il tuo turno e salva le ore.\n' +
        '🔵 **Info** ➔ Controlla le tue ore accumulate.\n' +
        '👥 **In Servizio** ➔ Visualizza chi è in turno.'
      )
      .setFooter({ text: 'Sistema Gestione Orari - Visibile solo a te' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('btn_timbra').setLabel('Timbra').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('btn_stimbra').setLabel('Stimbra').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('btn_info').setLabel('Info').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('btn_inservizio').setLabel('In Servizio').setStyle(ButtonStyle.Secondary)
    );

    // flags: 64 rende l'intero messaggio visibile SOLO alla persona che ha digitato /cartellino
    await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
  },
};
