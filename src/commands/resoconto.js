import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { getResocontoFiltrato, resetSettimanaManuale } from '../utils/fatturatoManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('resoconto')
    .setDescription('Gestione resoconti e fatturato Paddock Pub')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('corrente')
        .setDescription('Fatturato degli ultimi 7 giorni (settimana in corso)')
    )
    .addSubcommand(sub =>
      sub.setName('settimana_scorsa')
        .setDescription('Fatturato della settimana precedente (da -14 giorni a -7 giorni fa)')
    )
    .addSubcommand(sub =>
      sub.setName('reset_manuale')
        .setDescription('Azzera manualmente tutti i dati del fatturato')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'reset_manuale') {
      resetSettimanaManuale();
      return await interaction.reply({
        content: '🔄 **Fatturato azzerato con successo!** Il database è stato completamente svuotato.',
        flags: 64
      });
    }

    const ora = Date.now();
    const giornoInMs = 24 * 60 * 60 * 1000;
    const setteGiorniInMs = 7 * giornoInMs;

    let inizio = 0;
    let fine = 0;
    let titoloPeriodo = '';

    if (sub === 'corrente') {
      fine = ora;
      inizio = ora - setteGiorniInMs;
      titoloPeriodo = '📊 Resoconto Settimana In Corso (Ultimi 7 Giorni)';
    } else if (sub === 'settimana_scorsa') {
      fine = ora - setteGiorniInMs;
      inizio = ora - (14 * giornoInMs);
      titoloPeriodo = '📜 Resoconto Settimana Scorsa';
    }

    const { totaleAzienda, totaleFattureNormale, totaleRuota, dipendenti } = getResocontoFiltrato(inizio, fine);

    const strInizio = new Date(inizio).toLocaleDateString('it-IT');
    const strFine = new Date(fine).toLocaleDateString('it-IT');

    let descrizioneDipendenti = '';
    if (dipendenti.length === 0) {
      descrizioneDipendenti = '_Nessuna vendita registrata in questo intervallo di tempo._';
    } else {
      dipendenti.forEach((dip, index) => {
        const medaglia = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤';
        descrizioneDipendenti += `${medaglia} **<@${dip.userId}>** (${dip.username})\n` +
                                 `└ Vendite: **${dip.numeroVendite}** | Cibo/Acqua: **$${dip.totaleNormale.toLocaleString('it-IT')}** | Ruota: **$${dip.totaleRuota.toLocaleString('it-IT')}**\n` +
                                 `└ **Totale Singolo: $${dip.totaleComplessivo.toLocaleString('it-IT')}**\n\n`;
      });
    }

    const embed = new EmbedBuilder()
      .setColor(sub === 'corrente' ? '#10b981' : '#3b82f6')
      .setAuthor({ name: 'Paddock Pub | Direzione' })
      .setTitle(titoloPeriodo)
      .setDescription(`📅 **Periodo:** dal **${strInizio}** al **${strFine}**\n\n` +
                      `💵 **Incasso Cibo & Bevande:** $${totaleFattureNormale.toLocaleString('it-IT')}\n` +
                      `🎡 **Incasso Ruota della Fortuna:** $${totaleRuota.toLocaleString('it-IT')}\n` +
                      `💰 **FATTURATO TOTALE AZIENDA:** **$${totaleAzienda.toLocaleString('it-IT')}**\n` +
                      `───────────────────────────\n\n` +
                      `🏆 **DETTAGLIO SINGOLI DIPENDENTI:**\n\n` +
                      descrizioneDipendenti)
      .setFooter({ text: 'Paddock Pub - Sistema Resoconti' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
