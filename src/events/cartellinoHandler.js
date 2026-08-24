import { EmbedBuilder } from 'discord.js';

// Mappa temporanea in memoria per memorizzare l'orario di inizio del turno
const turniAttivi = new Map();

export default {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isButton()) return;

    const { customId, user, channel } = interaction;
    if (!['btn_timbra', 'btn_stimbra', 'btn_info'].includes(customId)) return;

    const userId = user.id;
    const oraAttuale = new Date();

    // 🟢 AZIONE: TIMBRA
    if (customId === 'btn_timbra') {
      if (turniAttivi.has(userId)) {
        return await interaction.reply({ content: `⚠️ **${user.username}**, sei già in servizio!`, flags: 64 });
      }

      turniAttivi.set(userId, oraAttuale);
      const orarioFormattato = oraAttuale.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

      const embedTimbra = new EmbedBuilder()
        .setColor('#22c55e')
        .setTitle('🟢 Entrata in Servizio')
        .setDescription(`**${user.username}** ha timbrato il cartellino alle **${orarioFormattato}**.\n*Il conteggio delle ore è iniziato.*`)
        .setTimestamp();

      await interaction.reply({ content: '✅ Timbratura registrata!', flags: 64 });
      await channel.send({ embeds: [embedTimbra] });
    }

    // 🔴 AZIONE: STIMBRA
    else if (customId === 'btn_stimbra') {
      if (!turniAttivi.has(userId)) {
        return await interaction.reply({ content: `⚠️ **${user.username}**, non sei attualmente in servizio!`, flags: 64 });
      }

      const orarioInizio = turniAttivi.get(userId);
      turniAttivi.delete(userId);

      // Calcolo della durata del turno
      const differenzaMs = oraAttuale - orarioInizio;
      const minutiLavorati = Math.floor(differenzaMs / (1000 * 60));
      const oreLavorate = Math.floor(minutiLavorati / 60);
      const minutiRimanenti = minutiLavorati % 60;

      const orarioUscita = oraAttuale.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

      const embedStimbra = new EmbedBuilder()
        .setColor('#ef4444')
        .setTitle('🔴 Uscita dal Servizio')
        .setDescription(
          `**${user.username}** ha stimbrato alle **${orarioUscita}** ed è uscito dal servizio.\n\n` +
          `⏱️ **Tempo Totale Turno:** ${oreLavorate}h ${minutiRimanenti}m (${minutiLavorati} minuti totali).`
        )
        .setTimestamp();

      await interaction.reply({ content: '✅ Stimbratura registrata!', flags: 64 });
      await channel.send({ embeds: [embedStimbra] });
    }

    // 🔵 AZIONE: INFO
    else if (customId === 'btn_info') {
      if (!turniAttivi.has(userId)) {
        return await interaction.reply({ content: `ℹ️ **${user.username}**, al momento non sei in servizio.`, flags: 64 });
      }

      const orarioInizio = turniAttivi.get(userId);
      const orarioInizioStr = orarioInizio.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      const minutiInCorso = Math.floor((oraAttuale - orarioInizio) / (1000 * 60));

      await interaction.reply({
        content: `ℹ️ **${user.username}**, sei in servizio dalle **${orarioInizioStr}** (in turno da **${minutiInCorso} minuti**).`,
        flags: 64
      });
    }
  },
};
