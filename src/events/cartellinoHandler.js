import { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';

export const turniAttivi = new Map();
export const oreTotaliAccumulate = new Map();

function getOraItaliana(data = new Date()) {
  return data.toLocaleTimeString('it-IT', { 
    timeZone: 'Europe/Rome', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

export default {
  name: 'interactionCreate',
  async execute(interaction) {
    const { user, guild } = interaction;
    const userId = user.id;
    const oraAttuale = new Date();

    // 1. GESTIONE PULSANTI (Timbra, Stimbra, Fattura, Info, In Servizio)
    if (interaction.isButton()) {
      const { customId } = interaction;
      if (!['btn_timbra', 'btn_stimbra', 'btn_fattura', 'btn_info', 'btn_inservizio'].includes(customId)) return;

      const canaleLogCartellino = guild?.channels.cache.find(c => c.name === 'timbratura-dipendenti');

      // 🧾 APRE IL MENU FATTURE
      if (customId === 'btn_fattura') {
        const opzioni = [
          { label: '1x1 (1 Cibo + 1 Acqua)', value: '1x1' },
          { label: '2x2 (2 Cibo + 2 Acqua)', value: '2x2' },
          { label: '3x3 (3 Cibo + 3 Acqua)', value: '3x3' },
          { label: '4x4 (4 Cibo + 4 Acqua)', value: '4x4' },
          { label: '5x5 (5 Cibo + 5 Acqua)', value: '5x5' },
          { label: '10x10 (10 Cibo + 10 Acqua)', value: '10x10' },
          { label: '20x20 (20 Cibo + 20 Acqua)', value: '20x20' },
          { label: '50x50 (50 Cibo + 50 Acqua)', value: '50x50' },
          { label: '100x100 (100 Cibo + 100 Acqua)', value: '100x100' },
          { label: '200x200 (200 Cibo + 200 Acqua)', value: '200x200' },
          { label: '500x500 (500 Cibo + 500 Acqua)', value: '500x500' },
        ];

        const selectBase = new StringSelectMenuBuilder()
          .setCustomId('select_fattura_base')
          .setPlaceholder('🟢 Seleziona vendita BASE...')
          .addOptions(opzioni.map(o => new StringSelectMenuOptionBuilder().setLabel(`BASE - ${o.label}`).setValue(`base_${o.value}`)));

        const selectVip = new StringSelectMenuBuilder()
          .setCustomId('select_fattura_vip')
          .setPlaceholder('⭐ Seleziona vendita VIP...')
          .addOptions(opzioni.map(o => new StringSelectMenuOptionBuilder().setLabel(`VIP - ${o.label}`).setValue(`vip_${o.value}`)));

        return await interaction.reply({
          content: '🧾 **Seleziona il pacchetto venduto dal menu a tendina:**',
          components: [new ActionRowBuilder().addComponents(selectBase), new ActionRowBuilder().addComponents(selectVip)],
          flags: 64
        });
      }

      // 🟢 TIMBRA
      if (customId === 'btn_timbra') {
        if (turniAttivi.has(userId)) return await interaction.reply({ content: `⚠️ Sei già in servizio!`, flags: 64 });
        turniAttivi.set(userId, { oraInizio: oraAttuale, username: user.username });
        const orario = getOraItaliana(oraAttuale);

        await interaction.reply({ embeds: [new EmbedBuilder().setColor('#22c55e').setTitle('🟢 Entrata in Servizio').setDescription(`Hai timbrato alle **${orario}**.`)] , flags: 64 });
        if (canaleLogCartellino) {
          await canaleLogCartellino.send({ embeds: [new EmbedBuilder().setColor('#22c55e').setTitle('📥 Log Entrata Turno').setDescription(`👤 **Dipendente:** ${user}\n🕒 **Ora Entrata:** ${orario}`).setTimestamp()] });
        }
      }

      // 🔴 STIMBRA
      else if (customId === 'btn_stimbra') {
        if (!turniAttivi.has(userId)) return await interaction.reply({ content: `⚠️ Non sei in servizio!`, flags: 64 });
        const datiTurno = turniAttivi.get(userId);
        turniAttivi.delete(userId);

        const minutiLavorati = Math.floor((oraAttuale - datiTurno.oraInizio) / (1000 * 60));
        const nuoviMinutiTotali = (oreTotaliAccumulate.get(userId) || 0) + minutiLavorati;
        oreTotaliAccumulate.set(userId, nuoviMinutiTotali);
        const orario = getOraItaliana(oraAttuale);

        await interaction.reply({ embeds: [new EmbedBuilder().setColor('#ef4444').setTitle('🔴 Uscita dal Servizio').setDescription(`Hai stimbrato alle **${orario}**.\n⏱️ **Turno:** ${Math.floor(minutiLavorati / 60)}h ${minutiLavorati % 60}m`)], flags: 64 });
        if (canaleLogCartellino) {
          await canaleLogCartellino.send({ embeds: [new EmbedBuilder().setColor('#ef4444').setTitle('📤 Log Uscita Turno').setDescription(`👤 **Dipendente:** ${user}\n🕒 **Ora Uscita:** ${orario}\n⏱️ **Durata Turno:** ${Math.floor(minutiLavorati / 60)}h ${minutiLavorati % 60}m`).setTimestamp()] });
        }
      }

      // 🔵 INFO
      else if (customId === 'btn_info') {
        const minutiTotali = oreTotaliAccumulate.get(userId) || 0;
        await interaction.reply({ content: `📊 **Storico ore:** ${Math.floor(minutiTotali / 60)}h ${minutiTotali % 60}m.`, flags: 64 });
      }

      // 👥 IN SERVIZIO
      else if (customId === 'btn_inservizio') {
        if (turniAttivi.size === 0) return await interaction.reply({ content: '👥 Nessuno in servizio.', flags: 64 });
        let lista = '👥 **Dipendenti in servizio:**\n';
        for (const [id, dati] of turniAttivi.entries()) {
          lista += `• **${dati.username}** (Dalle **${getOraItaliana(dati.oraInizio)}**)\n`;
        }
        await interaction.reply({ content: lista, flags: 64 });
      }
    }

    // 2. GESTIONE SELEZIONE MENU FATTURA
    if (interaction.isStringSelectMenu()) {
      const { customId, values } = interaction;
      if (!['select_fattura_base', 'select_fattura_vip'].includes(customId)) return;

      const canaleFatture = guild?.channels.cache.find(c => c.name === 'gestione-fatture');
      const val = values[0];
      const isVip = val.startsWith('vip_');
      const taglio = val.replace('base_', '').replace('vip_', '');
      const tipo = isVip ? '⭐ VIP' : '🟢 BASE';
      const orario = getOraItaliana();

      await interaction.reply({ content: `✅ Fattura **${tipo}** per **${taglio}** registrata!`, flags: 64 });

      if (canaleFatture) {
        const embedLog = new EmbedBuilder()
          .setColor(isVip ? '#eab308' : '#10b981')
          .setTitle('🧾 Nuova Fattura Registrata')
          .addFields(
            { name: '👤 Dipendente', value: `${user} (${user.username})`, inline: true },
            { name: '📦 Pacchetto', value: `**${taglio}**`, inline: true },
            { name: '🏷️ Tipo', value: `**${tipo}**`, inline: true },
            { name: '🕒 Orario (IT)', value: `**${orario}**`, inline: true }
          )
          .setTimestamp();

        await canaleFatture.send({ embeds: [embedLog] });
      }
    }
  },
};
