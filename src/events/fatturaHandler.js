import { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { registraVendita } from '../utils/fatturatoManager.js';
import { PRODOTTI_FATTURA, OPZIONI_RUOTA } from '../commands/fatture.js';

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

    const isRuotaSelect = customId === 'select_fattura_ruota';

    // Cerca il canale di destinazione in base al tipo di vendita
    let canaleDestinazione;

    if (isRuotaSelect) {
      // Cerca il canale dedicato alle ruote
      canaleDestinazione = guild?.channels.cache.find(c => 
        c.name.toLowerCase().includes('vendita-ruote') || c.name.toLowerCase().includes('vendita_ruote')
      );
    } else {
      // Cerca il canale per le fatture normali
      canaleDestinazione = guild?.channels.cache.find(c => 
        c.name.toLowerCase().includes('gestione-fatture') || c.name.toLowerCase().includes('gestione_fatture')
      );
    }

    const nomeCanaleManche = isRuotaSelect ? '#vendita-ruote' : '#gestione-fatture';

    if (!canaleDestinazione) {
      return await interaction.reply({
        content: `⚠️ **Errore:** Non ho trovato il canale \`${nomeCanaleManche}\`! Crealo o controlla i permessi del bot.`,
        flags: 64
      });
    }

    const val = values[0];
    const orario = getOraItaliana();
    let tipo = '';
    let taglio = '';
    let prezzoNumerico = 0;
    let coloreEmbed = '#10b981';

    // GESTIONE RUOTA DELLA FORTUNA
    if (isRuotaSelect) {
      const opzioneRuota = OPZIONI_RUOTA.find(r => r.value === val);
      tipo = '🎡 RUOTA DELLA FORTUNA';
      taglio = opzioneRuota ? opzioneRuota.label : val;
      prezzoNumerico = opzioneRuota ? opzioneRuota.prezzo : 0;
      coloreEmbed = '#a855f7'; // Viola per la Ruota
    } 
    // GESTIONE BASE E VIP
    else {
      const isVip = val.startsWith('vip_');
      taglio = val.replace('base_', '').replace('vip_', '');
      tipo = isVip ? '⭐ VIP' : '🟢 BASE';
      coloreEmbed = isVip ? '#eab308' : '#10b981';

      const prodotto = PRODOTTI_FATTURA.find(p => p.value === taglio);
      prezzoNumerico = prodotto ? (isVip ? prodotto.vip : prodotto.base) : 0;
    }

    const prezzoTesto = formatPrezzo(prezzoNumerico);

    // REGISTRA LA VENDITA NEL DATABASE GENERALE
    registraVendita(user.id, user.username, prezzoNumerico);

    // 1. Invio messaggio di report nel canale dedicato
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

    await interaction.update({ components: [rowBase, rowVip, rowRuota] });

    await interaction.followUp({
      content: `✅ Registrata vendita **${tipo}** (**${taglio}**) per **${prezzoTesto}**! Report inviato su ${canaleDestinazione}.`,
      flags: 64
    });
  },
};
