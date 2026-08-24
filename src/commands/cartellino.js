import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('cartellino')
    .setDescription('Invia il pannello per il cartellino di servizio')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // 1. Avisa subito Discord che la risposta sta arrivando (evita il timeout in rosso)
    await interaction.deferReply({ flags: 64 });

    // 2. Costruzione della grafica
    const embed = new EmbedBuilder()
      .setColor('#3b82f6')
      .setAuthor({ name: 'Sistema Cartellino | Il Tuo Locale' })
      .setTitle('💳 Sistema Cartellino Dipendenti')
      .setDescription(
        'Benvenuto nel **sistema cartellini**!\n\n' +
        '🟢 **Timbra** ➔ Inizia il turno di servizio.\n' +
        '🔴 **Stimbra** ➔ Termina il turno di servizio.\n' +
        '🟡 **Pausa** ➔ Metti in pausa il turno.\n' +
        '🔵 **Info** ➔ Controlla le tue ore.\n' +
        '👥 **In Servizio** ➔ Visualizza chi è timbrato.'
      )
      .setFooter({ text: 'Sistema Gestione Orari - Staff' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('btn_timbra').setLabel('Timbra').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('btn_stimbra').setLabel('Stimbra').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('btn_pausa').setLabel('Pausa').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('btn_info').setLabel('Info').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('btn_inservizio').setLabel('In Servizio').setStyle(ButtonStyle.Primary)
    );

    // 3. Manda il messaggio visibile a tutti nel canale
    await interaction.channel.send({ embeds: [embed], components: [row] });

    // 4. Conferma l'invio solo all'admin che ha eseguito il comando
    await interaction.editReply({ content: '✅ Pannello inviato con successo nel canale!' });
  },
};
