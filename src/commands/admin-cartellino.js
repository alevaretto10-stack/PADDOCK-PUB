import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('admin-cartellino')
    .setDescription('Visualizza il resoconto completo dei turni e delle ore di tutti i dipendenti')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    // Importiamo le mappe dal gestore cartellino
    const { turniAttivi, oreTotaliAccumulate } = await import('../events/cartellinoHandler.js');
    const oraAttuale = new Date();

    const embed = new EmbedBuilder()
      .setColor('#f59e0b')
      .setTitle('📊 Report Direzione | Gestione Cartellini')
      .setTimestamp();

    // Sezione Dipendenti In Servizio
    let testoInServizio = '';
    if (turniAttivi.size === 0) {
      testoInServizio = '❌ *Nessun dipendente attualmente in turno.*';
    } else {
      for (const [id, dati] of turniAttivi.entries()) {
        const minutiTurno = Math.floor((oraAttuale - dati.oraInizio) / (1000 * 60));
        const orarioInizioStr = dati.oraInizio.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        testoInServizio += `• **${dati.username}** (Dalle **${orarioInizioStr}** — da ${minutiTurno} min)\n`;
      }
    }

    // Sezione Storico Ore Accumulate
    let testoTotali = '';
    if (oreTotaliAccumulate.size === 0) {
      testoTotali = '*Nessun dato registrato.*';
    } else {
      for (const [id, minutiTotali] of oreTotaliAccumulate.entries()) {
        const ore = Math.floor(minutiTotali / 60);
        const minuti = minutiTotali % 60;
        testoTotali += `• <@${id}>: **${ore}h ${minuti}m** (${minutiTotali} min totali)\n`;
      }
    }

    embed.addFields(
      { name: '🟢 Dipendenti Attualmente in Turno', value: testoInServizio },
      { name: '📈 Ore Totali Accumulate (Storico Staff)', value: testoTotali }
    );

    // Risposta riservata/ephemeral per chi usa il comando
    await interaction.reply({ embeds: [embed], flags: 64 });
  },
};
