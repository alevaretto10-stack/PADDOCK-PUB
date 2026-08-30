import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionFlagsBits } from 'discord.js';

export const PRODOTTI_FATTURA = [
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

export const OPZIONI_RUOTA = [
  { label: 'Giro Singolo', value: 'ruota_10k', prezzo: 10000 },
  { label: 'Pacchetto Medio', value: 'ruota_40k', prezzo: 40000 },
  { label: 'Pacchetto Grande', value: 'ruota_80k', prezzo: 80000 },
];

function formatPrezzo(valore) {
  return '$' + valore.toLocaleString('it-IT');
}

export default {
  data: new SlashCommandBuilder()
    .setName('fatture')
    .setDescription('Invia il pannello per registrare le fatture di vendita')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    let testoListino = '📋 **LISTINO PREZZI VENDITE**\n\n';
    
    PRODOTTI_FATTURA.forEach(item => {
      testoListino += `• **${item.value}** ➔ BASE: **${formatPrezzo(item.base)}** | VIP: **${formatPrezzo(item.vip)}**\n`;
    });

    testoListino += '\n🎡 **RUOTA DELLA FORTUNA**\n';
    OPZIONI_RUOTA.forEach(item => {
      testoListino += `• **${item.label}** ➔ Prezzo: **${formatPrezzo(item.prezzo)}**\n`;
    });

    testoListino += '\n*Seleziona dal menu a tendina sottostante per registrare la vendita.*';

    const embed = new EmbedBuilder()
      .setColor('#10b981')
      .setAuthor({ name: 'Sistema Fatture | Paddock Pub' })
      .setTitle('🧾 Registrazione Vendite & Fatture')
      .setDescription(testoListino)
      .setFooter({ text: 'Paddock Pub - Gestione Incassi' });

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

    await interaction.reply({ embeds: [embed], components: [rowBase, rowVip, rowRuota] });
  },
};
