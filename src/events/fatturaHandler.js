import { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';

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
    if (!interaction.isStringSelectMenu()) return;

    const { customId, values, user, guild } = interaction;
    if (!['select_fattura_base', 'select_fattura_vip'].includes(customId)) return;

    // Cerca il canale ignorando eventuali differenze di maiuscole o trattini
    const canaleFatture = guild?.channels.cache.find(c => 
      c.name.toLowerCase().includes('gestione-fatture') || c.name.toLowerCase().includes('gestione_fatture')
    );

    if (!canaleFatture) {
      return await interaction.reply({
        content: '⚠️ **Errore:** Non ho trovato il canale `#gestione-fatture`! Assicurati che esista e che il bot abbia i permessi di lettura/invio messaggi.',
        flags: 64
      });
    }

    const val = values[0]; // Es. base_5x5
    const isVip = val.startsWith('vip_');
    const taglio = val.replace('base_', '').replace('vip_', '');
    const tipo = isVip ? '⭐ VIP' : '🟢 BASE';
    const orario = getOraItaliana();

    // 1. Invia il log effettivo nel canale #gestione-fatture
    const embedLog = new EmbedBuilder()
      .setColor(isVip ? '#eab308' : '#10b981')
      .setTitle('🧾 Nuova Vendita Registrata')
      .setDescription(`**${user.username}** ha registrato una vendita!`)
      .addFields(
        { name: '👤 Dipendente', value: `${user}`, inline: true },
        { name: '📦 Pacchetto Venduto', value: `**${taglio}**`, inline: true },
        { name: '🏷️ Categoria', value: `**${tipo}**`, inline: true },
        { name: '🕒 Orario (IT)', value: `**${orario}**`, inline: true }
      )
      .setFooter({ text: 'Paddock Pub - Gestione Incassi' })
      .setTimestamp();

    await canaleFatture.send({ embeds: [embedLog] });

    // 2. Resetta i menu a tendina per permettere di selezionare SUBITO DI NUOVO lo stesso pacchetto (es. 5x5 più volte)
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

    const rowBase = new ActionRowBuilder().addComponents(selectBase);
    const rowVip = new ActionRowBuilder().addComponents(selectVip);

    // 3. Aggiorna il messaggio del pannello e invia la notifica privata
    await interaction.update({ components: [rowBase, rowVip] });

    await interaction.followUp({
      content: `✅ Registrata vendita **${tipo}** per **${taglio}**! Report inviato su ${canaleFatture}.`,
      flags: 64
    });
  },
};
