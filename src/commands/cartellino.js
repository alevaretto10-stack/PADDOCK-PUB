
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pannello-cartellino')
    .setDescription('Invia il pannello per il cartellino di servizio')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Solo gli admin possono crearlo

  async execute(interaction) {
    // 1. Creazione dell'Embed (Grafica del messaggio)
    const embed = new EmbedBuilder()
      .setColor('#3b82f6')
      .setAuthor({ name: 'Sistema Cartellino | Il Tuo Locale' })
      .setTitle('💳 Sistema Cartellino Dipendenti')
      .setDescription(
        'Benvenuto nel **sistema cartellini**!\nQui sotto troverai i pulsanti per gestire il tuo turno di servizio.\n\n' +
        '🟢 **Timbra** ➔ Inizia il turno di servizio registrando l\'orario.\n' +
        '🔴 **Stimbra** ➔ Termina il turno e registra le ore svolte.\n' +
        '🟡 **Pausa** ➔ Metti in pausa il turno (o riclicca per rientrare).\n' +
        '🔵 **Info** ➔ Controlla lo storico delle tue ore accumulate.\n' +
        '👥 **In Servizio** ➔ Visualizza chi è attualmente timbrato.'
      )
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter({ text: 'Sistema Gestione Orari - Staff' });

    // 2. Creazione dei Pulsanti
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_timbra')
        .setLabel('Timbra')
        .setStyle(ButtonStyle.Success), // Verde

      new ButtonBuilder()
        .setCustomId('btn_stimbra')
        .setLabel('Stimbra')
        .setStyle(ButtonStyle.Danger), // Rosso

      new ButtonBuilder()
        .setCustomId('btn_pausa')
        .setLabel('Pausa')
        .setStyle(ButtonStyle.Secondary), // Grigio

      new ButtonBuilder()
        .setCustomId('btn_info')
        .setLabel('Info')
        .setStyle(ButtonStyle.Primary), // Blu

      new ButtonBuilder()
        .setCustomId('btn_inservizio')
        .setLabel('In Servizio')
        .setStyle(ButtonStyle.Primary) // Blu
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
