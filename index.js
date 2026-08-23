import './src/app.js';
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Mappa per salvare l'orario d'inizio: { "userID": Date }
const turniInCorso = new Map();

client.on('ready', () => {
    console.log(`Bot avviato come ${client.user.tag}`);
});

// Comando per inviare il pannello di timbratura nel canale
client.on('messageCreate', async (message) => {
    if (message.content === '!pannello-timbra') {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_timbra')
                .setLabel('Timbra (Inizia Turno)')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('btn_stimbra')
                .setLabel('Stimbra (Fine Turno)')
                .setStyle(ButtonStyle.Danger)
        );

        await message.channel.send({
            content: '📌 **Pannello Gestione Turni**\nClicca su **Timbra** per iniziare il servizio o su **Stimbra** per terminarlo.',
            components: [row]
        });
    }
});

// Gestione dei click sui pulsanti
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const userId = interaction.user.id;

    if (interaction.customId === 'btn_timbra') {
        // Controlla se l'utente è già in servizio
        if (turniInCorso.has(userId)) {
            return interaction.reply({ 
                content: '⚠️ Sei già in servizio!', 
                ephemeral: true 
            });
        }

        // Salva l'orario di inizio attuale
        turniInCorso.set(userId, new Date());

        return interaction.reply({ 
            content: '✅ **Hai timbrato l\'inizio del servizio.** Buon lavoro!', 
            ephemeral: true 
        });
    }

    if (interaction.customId === 'btn_stimbra') {
        // Controlla se l'utente era effettivamente in servizio
        if (!turniInCorso.has(userId)) {
            return interaction.reply({ 
                content: '⚠️ Non sei in servizio! Devi prima timbrare l\'ingresso.', 
                ephemeral: true 
            });
        }

        // Calcola il tempo trascorso
        const orarioInizio = turniInCorso.get(userId);
        const orarioFine = new Date();
        const diffMs = orarioFine - orarioInizio; // Differenza in millisecondi

        // Conversione in ore, minuti e secondi
        const totaleSecondi = Math.floor(diffMs / 1000);
        const ore = Math.floor(totaleSecondi / 3600);
        const minuti = Math.floor((totaleSecondi % 3600) / 60);
        const secondi = totaleSecondi % 60;

        // Rimuove l'utente dai turni in corso
        turniInCorso.delete(userId);

        return interaction.reply({ 
            content: `🛑 **Servizio terminato.**\n⏱️ **Tempo totale in servizio:** ${ore} ore, ${minuti} minuti e ${secondi} secondi.`, 
            ephemeral: false // Imposta a true se vuoi che il messaggio sia visibile solo all'utente
        });
    }
});

client.login('IL_TUO_TOKEN_BOT');
