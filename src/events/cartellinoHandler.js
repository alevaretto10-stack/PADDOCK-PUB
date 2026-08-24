import { EmbedBuilder } from 'discord.js';

export const turniAttivi = new Map();
export const oreTotaliAccumulate = new Map();

export default {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isButton()) return;

    const { customId, user } = interaction;
    if (!['btn_timbra', 'btn_stimbra', 'btn_info', 'btn_inservizio'].includes(customId)) return;

    const userId = user.id;
    const oraAttuale = new Date();

    // 🟢 AZIONE: TIMBRA
    if (customId === 'btn_timbra') {
      if (turniAttivi.has(userId)) {
        return await interaction.reply({ content: `⚠️ **${user.username}**, sei già in servizio!`, flags: 64 });
      }

      turniAttivi.set(userId, { oraInizio: oraAttuale, username: user.username });
      const orarioFormattato = oraAttuale.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

      const embedTimbra = new EmbedBuilder()
        .setColor('#22c55e')
        .setTitle('🟢 Entrata in Servizio')
        .setDescription(`Hai timbrato il cartellino alle **${orarioFormattato}**.\n*Il conteggio delle ore è iniziato.*`)
        .setTimestamp();

      // Risposta visibile SOLO a chi clicca
      await interaction.reply({ embeds: [embedTimbra], flags: 64 });
    }

    // 🔴 AZIONE: STIMBRA
    else if (customId === 'btn_stimbra') {
      if (!turniAttivi.has(userId)) {
        return await interaction.reply({ content: `⚠️ **${user.username}**, non sei attualmente in servizio!`, flags: 64 });
      }

      const datiTurno = turniAttivi.get(userId);
      turniAttivi.delete(userId);

      const minutiLavorati = Math.floor((oraAttuale - datiTurno.oraInizio) / (1000 * 60));
      const oreTurno = Math.floor(minutiLavorati / 60);
      const minutiTurno = minutiLavorati % 60;

      const minutiPrecedenti = oreTotaliAccumulate.get(userId) || 0;
      const nuoviMinutiTotali = minutiPrecedenti + minutiLavorati;
      oreTotaliAccumulate.set(userId, nuoviMinutiTotali);

      const orarioUscita = oraAttuale.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

      const embedStimbra = new EmbedBuilder()
        .setColor('#ef4444')
        .setTitle('🔴 Uscita dal Servizio')
        .setDescription(
          `Hai stimbrato alle **${orarioUscita}**.\n\n` +
          `⏱️ **Turno svolto:** ${oreTurno}h ${minutiTurno}m\n` +
          `📊 **Totale cumulato:** ${Math.floor(nuoviMinutiTotali / 60)}h ${nuoviMinutiTotali % 60}m`
        )
        .setTimestamp();

      // Risposta visibile SOLO a chi clicca
      await interaction.reply({ embeds: [embedStimbra], flags: 64 });
    }

    // 🔵 AZIONE: INFO (PRIVATO)
    else if (customId === 'btn_info') {
      const minutiTotali = oreTotaliAccumulate.get(userId) || 0;
      const ore = Math.floor(minutiTotali / 60);
      const minuti = minutiTotali % 60;

      let messaggio = `📊 **Il tuo storico ore accumulate:** ${ore}h ${minuti}m (${minutiTotali} min totali).`;

      if (turniAttivi.has(userId)) {
        const oraInizio = turniAttivi.get(userId).oraInizio;
        const minutiAttuali = Math.floor((oraAttuale - oraInizio) / (1000 * 60));
        messaggio += `\n🟢 *Sei attualmente in turno da ${minutiAttuali} minuti.*`;
      } else {
        messaggio += `\n🔴 *Al momento non sei in servizio.*`;
      }

      await interaction.reply({ content: messaggio, flags: 64 });
    }

    // 👥 AZIONE: IN SERVIZIO (PRIVATO)
    else if (customId === 'btn_inservizio') {
      if (turniAttivi.size === 0) {
        return await interaction.reply({ content: '👥 **Nessun dipendente è attualmente in servizio.**', flags: 64 });
      }

      let lista = '👥 **Dipendenti attualmente in servizio:**\n\n';
      for (const [id, dati] of turniAttivi.entries()) {
        const minutiTurno = Math.floor((oraAttuale - dati.oraInizio) / (1000 * 60));
        const orarioInizioStr = dati.oraInizio.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        lista += `• **${dati.username}** (Dalle **${orarioInizioStr}** — da ${minutiTurno} min)\n`;
      }

      await interaction.reply({ content: lista, flags: 64 });
    }
  },
};
