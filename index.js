const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Mappe per salvare lo stato dei turni e delle pause
const turniInCorso = new Map(); // { userId: Date }
const pauseInCorso = new Map(); // { userId: Date }
const storicoOre = new Map();   // { userId: totaleMillisecondi }

client.on('ready', () => {
    console.log(`Bot avviato come ${client.user.tag}`);
});

// Comando per inviare il cartellino
client.on('messageCreate', async (message) => {
    if (message.content === '!cartellino') {
        const embed = new EmbedBuilder()
            .setTitle('📌 Sistema Cartellino')
            .setDescription(
                'Benvenuto nel **sistema cartellini**!\n' +
                'Qui sotto troverai i pulsanti per gestire il tuo cartellino di servizio.\n\n' +
                '🟢 **Timbra** ➔ Inizia il tuo turno di servizio registrando l\'orario.\n\n' +
                '🔴 **Stimbra** ➔ Termina il turno e registra le ore svolte.\n\n' +
                '🟡 **Pausa** ➔ Metti in pausa il turno (e riclicca per rientrare).\n\n' +
                '🔵 **Info** ➔ Controlla lo storico delle ore accumulate.'
            )
            .setColor(0x2b2d31);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_timbra').setLabel('Timbra').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('btn_stimbra').setLabel('Stimbra').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('btn_pausa').setLabel('Pausa').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('btn_info').setLabel('Info').setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

// Gestione dei click sui pulsanti
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    const userId = interaction.user.id;

    // --- TIMBRA ---
    if (interaction.customId === 'btn_timbra') {
        if (turniInCorso.has(userId)) {
            return interaction.reply({ content: '⚠️ Sei già in servizio!', ephemeral: true });
        }
        turniInCorso.set(userId, new Date());
        return interaction.reply({ content: '🟢 **Hai timbrato l\'inizio del servizio.** Buon lavoro!', ephemeral: true });
    }

    // --- STIMBRA ---
    if (interaction.customId === 'btn_stimbra') {
        if (!turniInCorso.has(userId)) {
            return interaction.reply({ content: '⚠️ Non sei in servizio!', ephemeral: true });
        }

        const inizio = turniInCorso.get(userId);
        let durata = new Date() - inizio;

        // Se era in pausa, toglie il tempo della pausa
        if (pauseInCorso.has(userId)) {
            const inizioPausa = pauseInCorso.get(userId);
            durata -= (new Date() - inizioPausa);
            pauseInCorso.delete(userId);
        }

        turniInCorso.delete(userId);

        // Salva le ore nello storico
        const orePrecedenti = storicoOre.get(userId) || 0;
        storicoOre.set(userId, orePrecedenti + durata);

        const totSec = Math.floor(durata / 1000);
        const ore = Math.floor(totSec / 3600);
        const min = Math.floor((totSec % 3600) / 60);

        return interaction.reply({ 
            content: `🔴 **Servizio terminato.**\n⏱️ Turno attuale: **${ore}h ${min}m**`, 
            ephemeral: false 
        });
    }

    // --- PAUSA ---
    if (interaction.customId === 'btn_pausa') {
        if (!turniInCorso.has(userId)) {
            return interaction.reply({ content: '⚠️ Devi prima timbrare l\'ingresso!', ephemeral: true });
        }

        if (pauseInCorso.has(userId)) {
            // Rientro dalla pausa
            const inizioPausa = pauseInCorso.get(userId);
            const tempoPausa = new Date() - inizioPausa;
            
            // Scaliamo il tempo di pausa dal turno
            const inizioTurno = turniInCorso.get(userId);
            turniInCorso.set(userId, new Date(inizioTurno.getTime() + tempoPausa));
            pauseInCorso.delete(userId);

            return interaction.reply({ content: '▶️ **Rientrato dalla pausa.** Il timer del servizio è ripartito!', ephemeral: true });
        } else {
            // Inizio pausa
            pauseInCorso.set(userId, new Date());
            return interaction.reply({ content: '🟡 **Sei andato in pausa.**', ephemeral: true });
        }
    }

    // --- INFO ---
    if (interaction.customId === 'btn_info') {
        const totaleMs = storicoOre.get(userId) || 0;
        const totSec = Math.floor(totaleMs / 1000);
        const ore = Math.floor(totSec / 3600);
        const min = Math.floor((totSec % 3600) / 60);

        return interaction.reply({ 
            content: `📊 **Storico Personale**\nTotale ore accumulate in servizio: **${ore} ore e ${min} minuti**.`, 
            ephemeral: true 
        });
    }
});

client.login(process.env.DISCORD_TOKEN);

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const { customId, user } = interaction;

  if (customId === 'btn_timbra') {
    // Salva l'ora di inizio su Database (es. Quick.db o MongoDB)
    await interaction.reply({ content: `✅ **${user.username}**, hai timbrato il cartellino! Buon lavoro.`, ephemeral: true });
  } 
  else if (customId === 'btn_stimbra') {
    // Calcola la differenza oraria e azzera il turno attivo
    await interaction.reply({ content: `🔴 **${user.username}**, hai stimbrato. Turno terminato!`, ephemeral: true });
  }
  else if (customId === 'btn_pausa') {
    await interaction.reply({ content: `🟡 Stato pausa aggiornato.`, ephemeral: true });
  }
  else if (customId === 'btn_info') {
    await interaction.reply({ content: `📊 Hai accumulato X ore questa settimana.`, ephemeral: true });
  }
  else if (customId === 'btn_inservizio') {
    await interaction.reply({ content: `👥 **Membri attualmente in servizio:** ...`, ephemeral: true });
  }
});
