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

    // 1. Risposta immediata a Discord per evitare il timeout dei 3 secondi
    try {
      await interaction.deferUpdate();
    } catch (err) {
      console.error('Errore durante il deferUpdate:', err);
    }

    const isRuotaSelect = customId === 'select_fattura_ruota';
    const targetChannelName = isRuotaSelect ? 'vendita-ruote' : 'gestione-fatture';

    // 2. Cerca il canale nella cache o ricarica tutti i canali del server
    let canaleDestinazione = guild?.channels.cache.find(c => 
      c.name.toLowerCase().includes(targetChannelName) || c.name.toLowerCase().replace('-', '_').includes(targetChannelName)
    );

    if (!canaleDestinazione && guild) {
      try {
        const fetchedChannels = await guild.channels.fetch();
        canaleDestinazione = fetchedChannels.find(c => 
          c && c.name.toLowerCase().includes(targetChannelName)
        );
      } catch (err) {
        console.error('Errore nel caricamento dei canali:', err);
      }
    }

    if (!canaleDestinazione) {
      return await interaction.followUp({
        content: `⚠️ **Errore:** Non ho trovato il canale \`#${targetChannelName}\`! Assicurati che esista e che il bot abbia i permessi di vederlo ed inviare messaggi.`,
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
      coloreEmbed = '#a855f7';
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

    // 3. Invio del report di vendita
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

    // 4. Ripristina lo stato del menu a tendina
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
  },
};
