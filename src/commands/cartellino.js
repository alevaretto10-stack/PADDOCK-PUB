import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('cartellino')
    .setDescription('Pannello di gestione cartellino e fatturato dipendente'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#3b82f6')
      .setAuthor({ name: 'Sistema Gestionale | Paddock Pub' })
      .setTitle('💳 Cartellino & Fatturazione')
      .setDescription(
        'Benvenuto nel pannello di gestione.\n\n' +
        '🟢 **Timbra** ➔ Inizia il tuo turno.\n' +
        '🔴 **Stimbra** ➔ Termina il turno.\n' +
        '🧾 **Fattura** ➔ Apri il menu per registrare una vendita.\n' +
        '🔵 **Info** ➔ Controlla le tue ore.\n' +
        '👥 **In Servizio** ➔ Chi è attualmente in turno.'
      )
      .setFooter({ text: 'Paddock Pub - Visibile solo a te' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('btn_timbra').setLabel('Timbra').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('btn_stimbra').setLabel('Stimbra').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('btn_fattura').setLabel('Fattura').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('btn_info').setLabel('Info').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('btn_inservizio').setLabel('In Servizio').setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
  },
};
