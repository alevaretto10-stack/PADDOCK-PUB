import fs from 'fs';
import path from 'path';

const DB_PATH = path.resolve('./data/vendite.json');

// Assicura che la cartella data/ e il file JSON esistano
function initDB() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ settimanaInizio: getInizioSettimanaCorrente(), vendite: [] }, null, 2));
  }
}

// Trova il timestamp del Sabato ore 00:00 precedente/corrente
export function getInizioSettimanaCorrente() {
  const ora = new Date();
  const giorno = ora.getDay(); // 0 = Domenica, 6 = Sabato
  
  // Calcola quanti giorni indietro tornare per arrivare allo scorso Sabato
  const giorniDaSabato = (giorno + 1) % 7; 

  const inizio = new Date(ora);
  inizio.setDate(ora.getDate() - giorniDaSabato);
  inizio.setHours(0, 0, 0, 0);

  return inizio.getTime();
}

function leggiDati() {
  initDB();
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    let json = JSON.parse(data);

    const inizioAttuale = getInizioSettimanaCorrente();
    // Se è iniziata una nuova settimana (dopo Sabato 00:00), resetta automatico
    if (!json.settimanaInizio || json.settimanaInizio < inizioAttuale) {
      json = {
        settimanaInizio: inizioAttuale,
        vendite: []
      };
      salvaDati(json);
    }

    return json;
  } catch (err) {
    console.error('Errore lettura DB vendite:', err);
    return { settimanaInizio: getInizioSettimanaCorrente(), vendite: [] };
  }
}

function salvaDati(dati) {
  fs.writeFileSync(DB_PATH, JSON.stringify(dati, null, 2));
}

// Salva una nuova vendita
export function registraVendita(userId, username, importo) {
  const dati = leggiDati();
  dati.vendite.push({
    userId,
    username,
    importo,
    timestamp: Date.now()
  });
  salvaDati(dati);
}

// Ottiene i dati della settimana corrente
export function getResocontoSettimanale() {
  const dati = leggiDati();
  const dipendenti = {};
  let totaleAzienda = 0;

  dati.vendite.forEach(v => {
    totaleAzienda += v.importo;
    if (!dipendenti[v.userId]) {
      dipendenti[v.userId] = {
        username: v.username,
        totale: 0,
        numeroVendite: 0
      };
    }
    dipendenti[v.userId].totale += v.importo;
    dipendenti[v.userId].numeroVendite += 1;
  });

  return {
    totaleAzienda,
    dipendenti: Object.values(dipendenti).sort((a, b) => b.totale - a.totale),
    settimanaInizio: dati.settimanaInizio
  };
}

// Reset manuale (se necessario)
export function resetSettimanaManuale() {
  const json = {
    settimanaInizio: getInizioSettimanaCorrente(),
    vendite: []
  };
  salvaDati(json);
