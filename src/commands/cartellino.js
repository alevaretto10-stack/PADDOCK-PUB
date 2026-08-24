import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('cartellino')
    .setDescription('Invia il pannello per il cartellino di servizio')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#3b82f6')
      .setAuthor({ name: 'Sistema Cartellino | Paddock Pub' })
      .setTitle('💳 Cartellino Dipendenti')
      .setDescription(
        'Clicca sui pulsanti in basso per gestire il tuo turno di servizio.\n\n' +
        '🟢 **Timbra** ➔ Inizia il turno di servizio.\n' +
        '🔴 **Stimbra** ➔ Termina il turno e salva le ore svolte.\n' +
        '🔵 **Info** ➔ Controlla le tue ore totali accumulate.\n' +
        '👥 **In Servizio** ➔ Visualizza chi è attualmente timbrato.'
      )
      .setFooter({ text: 'Sistema Gestione Orari' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('btn_timbra').setLabel('Timbra').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('btn_stimbra').setLabel('Stimbra').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('btn_info').setLabel('Info').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('btn_inservizio').setLabel('In Servizio').setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
