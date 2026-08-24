import { EmbedBuilder } from 'discord.js';

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

    const canaleFatture = guild?.channels.cache.find(c => c.name === 'gestione-fatture');
    const valoreSelezionato = values[0]; // es. base_5x5 oppure vip_5x5

    const isVip = valoreSelezionato.startsWith('vip_');
    const taglio = valoreSelezionato.replace('base_', '').replace('vip_', '');
    const tipo = isVip ? '⭐ VIP' : '🟢 BASE';
    const orario = getOraItaliana();

    // 1. Risposta PRIVATA per il dipendente che ha registrato la vendita
    const embedPrivato = new EmbedBuilder()
      .setColor(isVip ? '#eab308' : '#10b981')
      .setTitle('✅ Fattura Registrata')
      .setDescription(
        `Hai registrato con successo una vendita **${tipo}** per il pacchetto **${taglio}**.\n` +
        `🕒 Orario: **${orario}**`
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embedPrivato], flags: 64 });

    // 2. Invio del log nel canale riservato #gestione-fatture
    if (canaleFatture) {
      const embedLog = new EmbedBuilder()
        .setColor(isVip ? '#eab308' : '#10b981')
        .setTitle('🧾 Nuova Fattura Registrata')
        .addFields(
          { name: '👤 Dipendente', value: `${user} (${user.username})`, inline: true },
          { name: '📦 Pacchetto Venduto', value: `**${taglio}**`, inline: true },
          { name: '🏷️ Tipo Cliente', value: `**${tipo}**`, inline: true },
          { name: '🕒 Orario (IT)', value: `**${orario}**`, inline: true }
        )
        .setTimestamp();

      await canaleFatture.send({ embeds: [embedLog] });
    }
  },
};
