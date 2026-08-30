import { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { registraVendita } from '../utils/fatturatoManager.js';

// Dati definiti direttamente per evitare problemi di importazione
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

const OPZIONI_RUOTA = [
  { label: 'Giro Singolo', value: 'ruota_10k', prezzo: 10000 },
  { label: 'Pacchetto Medio', value: 'ruota_40k', prezzo: 40000 },
  { label: 'Pacchetto Grande', value: 'ruota_80k', prezzo: 80000 },
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
    if (!['select_fattura_base', 'select_fattura_vip', 'select_fattura_ruota'].includes(customId)) return;

    try {
      // 1. Blocca subito il timer dei 3 secondi di Discord
      await interaction.deferUpdate();

      const isRuotaSelect = customId === 'select_fattura_ruota';
      const targetChannelName = isRuotaSelect ? 'vendita-ruote' : 'gestione-fatture';

      // 2. Cerca il canale di destinazione
      let canaleDestinazione = guild?.channels.cache.find(c => 
        c.name.toLowerCase().includes(targetChannelName)
      );

      if (!canaleDestinazione && guild) {
        const fetchedChannels = await guild.channels.fetch();
        canaleDestinazione = fetchedChannels.find(c => 
          c && c.name.toLowerCase().includes(targetChannelName)
        );
      }

      if (!canaleDestinazione) {
        return await interaction.followUp({
          content: `⚠️ **Errore:** Non ho trovato il canale \`#${targetChannelName}\`! Assicurati che esista e che il bot abbia i permessi necessari.`,
          flags: 64
        });
      }

      const val = values[0];
      const orario = getOraItaliana();
      let tipo = '';
      let taglio = '';
      let prezzoNumerico = 0;
      let coloreEmbed = '#10b981';

      if (isRuotaSelect) {
        const opzioneRuota = OPZIONI_RUOTA.find(r => r.value === val);
        tipo = '🎡 RUOTA DELLA FORTUNA';
        taglio = opzioneRuota ? opzioneRuota.label : val;
        prezzoNumerico = opzioneRuota ? opzioneRuota.prezzo : 0;
        coloreEmbed = '#a855f7';
      } else {
        const isVip = val.startsWith('vip_');
        taglio = val.replace('base_', '').replace('vip_', '');
        tipo = isVip ? '⭐ VIP' : '🟢 BASE';
        coloreEmbed = isVip ? '#eab308' : '#10b981';

        const prodotto = PRODOTTI_FATTURA.find(p => p.value === taglio);
        prezzoNumerico = prodotto ? (isVip ? prodotto.vip : prodotto.base) : 0;
      }

      const prezzoTesto = formatPrezzo(prezzoNumerico);

      // Registra la vendita
      registraVendita(user.id, user.username, prezzoNumerico);

      // Invia log
      const embedLog = new EmbedBuilder()
        .setColor(coloreEmbed)
        .setTitle(isRuotaSelect ? '🎡 Vendita Ruota della Fortuna Registrata' : '🧾 Nuova Vendita Registrata')
        .setDescription(`**${user.username}** ha registrato una vendita!`)
        .addFields(
          { name: '👤 Dipendente', value: `${user}`, inline: true },
          { name: '📦 Pacchetto / Taglio', value: `**${taglio}**`, inline: true },
          { name: '🏷️ Categoria', value: `**${tipo}**`, inline: true },
          { name: '💰 Prezzo', value: `**${prezzoTesto}**`, inline: true },
          { name: '🕒 Orario (IT)', value: `**${orario}**`, inline: true }
        )
        .setFooter({ text: 'Paddock Pub - Gestione Incassi' })
        .setTimestamp();

      await canaleDestinazione.send({ embeds: [embedLog] });

      // Rigenera i menu
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

      const selectRuota = new StringSelectMenuBuilder()
        .setCustomId('select_fattura_ruota')
        .setPlaceholder('🎡 Seleziona vendita RUOTA DELLA FORTUNA...')
        .addOptions(OPZIONI_RUOTA.map(o => 
          new StringSelectMenuOptionBuilder()
            .setLabel(`🎡 RUOTA - ${o.label}`)
            .setDescription(`Prezzo: ${formatPrezzo(o.prezzo)}`)
            .setValue(o.value)
        ));

      const rowBase = new ActionRowBuilder().addComponents(selectBase);
      const rowVip = new ActionRowBuilder().addComponents(selectVip);
      const rowRuota = new ActionRowBuilder().addComponents(selectRuota);

      await interaction.editReply({ components: [rowBase, rowVip, rowRuota] });

      await interaction.followUp({
        content: `✅ Registrata vendita **${tipo}** (**${taglio}**) per **${prezzoTesto}**! Report inviato su ${canaleDestinazione}.`,
        flags: 64
      });

    } catch (error) {
      console.error('Errore gestione fattura:', error);
    }
  },
};
