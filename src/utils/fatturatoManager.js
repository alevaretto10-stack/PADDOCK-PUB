import fs from 'fs';
import path from 'path';

const DB_DIR = path.resolve('./data');
const DB_PATH = path.join(DB_DIR, 'vendite.json');

function initDB() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify({ settimanaInizio: getInizioSettimanaCorrente(), vendite: [] }, null, 2));
    }
  } catch (err) {
    console.error('Errore inizializzazione DB:', err);
  }
}

export function getInizioSettimanaCorrente() {
  const ora = new Date();
  const giorno = ora.getDay(); // 0 = Dom, 6 = Sab
  const giorniDaSabato = (giorno + 1) % 7; 

  const inizio = new Date(ora);
  inizio.setDate(ora.getDate() - giorniDaSabato);
  inizio.setHours(0, 0, 0, 0);

  return inizio.getTime();
}

function leggiDati() {
  initDB();
  try {
    if (!fs.existsSync(DB_PATH)) {
      return { settimanaInizio: getInizioSettimanaCorrente(), vendite: [] };
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    let json = JSON.parse(data);

    const inizioAttuale = getInizioSettimanaCorrente();
    if (!json.settimanaInizio || json.settimanaInizio < inizioAttuale) {
      json = { settimanaInizio: inizioAttuale, vendite: [] };
      salvaDati(json);
    }

    return json;
  } catch (err) {
    console.error('Errore lettura DB vendite:', err);
    return { settimanaInizio: getInizioSettimanaCorrente(), vendite: [] };
  }
}

function salvaDati(dati) {
  try {
    initDB();
    fs.writeFileSync(DB_PATH, JSON.stringify(dati, null, 2));
  } catch (err) {
    console.error('Errore salvataggio DB vendite:', err);
  }
}

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

export function getResocontoSettimanale() {
  const dati = leggiDati();
  const dipendenti = {};
  let totaleAzienda = 0;

  if (Array.isArray(dati.vendite)) {
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
  }

  return {
    totaleAzienda,
    dipendenti: Object.values(dipendenti).sort((a, b) => b.totale - a.totale),
    settimanaInizio: dati.settimanaInizio
  };
}

export function resetSettimanaManuale() {
  salvaDati({
    settimanaInizio: getInizioSettimanaCorrente(),
    vendite: []
  });
}
