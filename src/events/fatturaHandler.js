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
    const val = values[0];
    const isVip = val.startsWith('vip_');
    const taglio = val.replace('base_', '').replace('vip_', '');
    const tipo = isVip ? '⭐ VIP' : '🟢 BASE';
    const orario = getOraItaliana();

    // 1. Messaggio di conferma temporaneo / privato per chi registra
    await interaction.reply({ 
      content: `✅ Registrata vendita **${tipo}** per il pacchetto **${taglio}**! La fattura è stata inviata su #gestione-fatture.`, 
      flags: 64 
    });

    // 2. Invio del report visibile a tutti nel canale #gestione-fatture
    if (canaleFatture) {
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
    }
  },
};
