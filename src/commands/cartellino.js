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
        '🟢 **Timbra** ➔ Inizia a registrare l\'orario di lavoro.\n' +
        '🔴 **Stimbra** ➔ Termina il turno e calcola i minuti lavorati.\n' +
        '🔵 **Info** ➔ Controlla il tuo stato attuale.'
      )
      .setFooter({ text: 'Sistema Gestione Orari' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('btn_timbra').setLabel('Timbra').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('btn_stimbra').setLabel('Stimbra').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('btn_info').setLabel('Info').setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
