import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { getResocontoSettimanale, resetSettimanaManuale } from '../utils/fatturatoManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('resoconto')
    .setDescription('Mostra il resoconto del fatturato settimanale del Paddock Pub')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('settimanale')
        .setDescription('Mostra il fatturato aziendale e dei singoli dipendenti per la settimana in corso')
    )
    .addSubcommand(sub =>
      sub.setName('reset_settimana')
        .setDescription('Azzera manualmente le vendite della settimana corrente')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'reset_settimana') {
      resetSettimanaManuale();
      return await interaction.reply({
        content: '🔄 **Settimana azzerata con successo!** Il conteggio del fatturato riparte da $0.',
        flags: 64
      });
    }

    if (sub === 'settimanale') {
      const { totaleAzienda, dipendenti, settimanaInizio } = getResocontoSettimanale();
      const dataInizio = new Date(settimanaInizio).toLocaleDateString('it-IT');

      let descrizioneDipendenti = '';
      if (dipendenti.length === 0) {
        descrizioneDipendenti = '_Nessuna vendita registrata in questa settimana._';
      } else {
        dipendenti.forEach((dip, index) => {
          const medaglia = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤';
          descrizioneDipendenti += `${medaglia} **<@${dip.userId}>** (${dip.username})\n` +
                                   `└ Vendite: **${dip.numeroVendite}** | Incasso: **$${dip.totale.toLocaleString('it-IT')}**\n\n`;
        });
      }

      const embed = new EmbedBuilder()
        .setColor('#eab308')
        .setAuthor({ name: 'Paddock Pub | Direzione' })
        .setTitle('📊 Resoconto Incassi Settimanali')
        .setDescription(`📅 **Settimana iniziata il:** ${dataInizio} (Sabato 00:00)\n\n` +
                        `💰 **FATTURATO TOTALE AZIENDA:** **$${totaleAzienda.toLocaleString('it-IT')}**\n` +
                        `───────────────────────────\n\n` +
                        `🏆 **FATTURATO SINGOLI DIPENDENTI:**\n\n` +
                        descrizioneDipendenti)
        .setFooter({ text: 'Paddock Pub - Reset automatico ogni Sabato a mezzanotte' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },
};
