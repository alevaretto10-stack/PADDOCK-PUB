import { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { registraVendita } from '../utils/fatturatoManager.js';

const PRODOTTI_FATTURA = [
  { label: '1x1 (1 Cibo + 1 Acqua)', value: '1x1', base: 800, vip: 1500 },
  { label: '2x2 (2 Cibo + 2 Acqua)', value: '2x2', base: 1500, vip: 3000 },
  { label: '3x3 (3 Cibo + 3 Acqua)', value: '3x3', base: 2500, vip: 4800 },
  { label: '5x5 (5 Cibo + 5 Acqua)', value: '5x5', base: 3500, vip: 5800 },
  { label: '10x10 (10 Cibo + 10 Acqua)', value: '10x10', base: 5800, vip: 11500 },
  { label: '20x20 (20 Cibo + 20 Acqua)', value: '20x20', base: 11000, vip: 22500 },
  { label: '50x50 (50 Cibo + 50 Acqua)', value: '50x50', base: 25500, vip: 50500 },
  { label: '100x100 (100 Cibo + 100 Acqua)', value: '100x100', base: 50500, vip: 95000 },
  { label: '200x200 (200 Cibo + 200 Acqua)', value: '200x200', base: 95500, vip: 180000 },
  { label: '500x500 (500 Cibo + 500 Acqua)', value: '500x500', base: 230500, vip: 420000 },
];

function getOraItaliana(data = new Date()) {
  return data.toLocaleTimeString('it-IT', { 
    timeZone: 'Europe/Rome', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function formatPrezzo(valore) {
  return '$' + valore.toLocaleString('it-IT');
}

export default {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isStringSelectMenu()) return;

    const { customId, values, user, guild } = interaction;
    if (!['select_fattura_base', 'select_fattura_vip'].includes(customId)) return;

    const canaleFatture = guild?.channels.cache.find(c => 
      c.name.toLowerCase().includes('gestione-fatture') || c.name.toLowerCase().includes('gestione_fatture')
    );

    if (!canaleFatture) {
      return await interaction.reply({
        content: '⚠️ **Errore:** Non ho trovato il canale `#gestione-fatture`!',
        flags: 64
      });
    }

    const val = values[0];
    const isVip = val.startsWith('vip_');
    const taglio = val.replace('base_', '').replace('vip_', '');
    const tipo = isVip ? '⭐ VIP' : '🟢 BASE';
    const orario = getOraItaliana();

    const prodotto = PRODOTTI_FATTURA.find(p => p.value === taglio);
    const prezzoNumerico = prodotto ? (isVip ? prodotto.vip : prodotto.base) : 0;
    const prezzoTesto = formatPrezzo(prezzoNumerico);

    // REGISTRA LA VENDITA NEL DATABASE SETTIMANALE
    registraVendita(user.id, user.username, prezzoNumerico);

    // 1. Invio messaggio di report su #gestione-fatture
    const embedLog = new EmbedBuilder()
      .setColor(isVip ? '#eab308' : '#10b981')
      .setTitle('🧾 Nuova Vendita Registrata')
      .setDescription(`**${user.username}** ha registrato una vendita!`)
      .addFields(
        { name: '👤 Dipendente', value: `${user}`, inline: true },
        { name: '📦 Pacchetto', value: `**${taglio}**`, inline: true },
        { name: '🏷️ Categoria', value: `**${tipo}**`, inline: true },
        { name: '💰 Prezzo', value: `**${prezzoTesto}**`, inline: true },
        { name: '🕒 Orario (IT)', value: `**${orario}**`, inline: true }
      )
      .setFooter({ text: 'Paddock Pub - Gestione Incassi' })
      .setTimestamp();

    await canaleFatture.send({ embeds: [embedLog] });

    // 2. Resetta le tendine
    const selectBase = new StringSelectMenuBuilder()
      .setCustomId('select_fattura_base')
      .setPlaceholder('🟢 Seleziona vendita BASE...')
      .addOptions(PRODOTTI_FATTURA.map(o => 
        new StringSelectMenuOptionBuilder()
          .setLabel(`🟢 BASE - ${o.label}`)
          .setDescription(`Prezzo: ${formatPrezzo(o.base)}`)
          .setValue(`base_${o.value}`)
      ));

    const selectVip = new StringSelectMenuBuilder()
      .setCustomId('select_fattura_vip')
      .setPlaceholder('⭐ Seleziona vendita VIP...')
      .addOptions(PRODOTTI_FATTURA.map(o => 
        new StringSelectMenuOptionBuilder()
          .setLabel(`⭐ VIP - ${o.label}`)
          .setDescription(`Prezzo: ${formatPrezzo(o.vip)}`)
          .setValue(`vip_${o.value}`)
      ));

    const rowBase = new ActionRowBuilder().addComponents(selectBase);
    const rowVip = new ActionRowBuilder().addComponents(selectVip);

    await interaction.update({ components: [rowBase, rowVip] });

    await interaction.followUp({
      content: `✅ Registrata vendita **${tipo}** (**${taglio}**) per **${prezzoTesto}**! Report inviato su ${canaleFatture}.`,
      flags: 64
    });
  },
};
