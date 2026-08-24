import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('fatture')
    .setDescription('Invia il pannello per registrare le fatture di vendita')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#10b981')
      .setAuthor({ name: 'Sistema Fatture | Paddock Pub' })
      .setTitle('🧾 Registrazione Vendite & Fatture')
      .setDescription(
        'Seleziona dal menu a tendina il pacchetto venduto per registrarlo.\n\n' +
        '🟢 **Menu BASE:** Vendite standard (prezzo base).\n' +
        '⭐ **Menu VIP:** Vendite VIP (prezzo maggiorato).'
      )
      .setFooter({ text: 'Paddock Pub - Gestione Incassi' });

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

    await interaction.reply({ embeds: [embed], components: [rowBase, rowVip] });
  },
};
