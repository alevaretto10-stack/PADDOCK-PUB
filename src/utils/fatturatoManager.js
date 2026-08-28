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
      fs.writeFileSync(DB_PATH, JSON.stringify({ vendite: [] }, null, 2));
    }
  } catch (err) {
    console.error('Errore inizializzazione DB:', err);
  }
}

function leggiDati() {
  initDB();
  try {
    if (!fs.existsSync(DB_PATH)) return { vendite: [] };
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Errore lettura DB vendite:', err);
    return { vendite: [] };
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

// Salva ogni vendita con il timestamp preciso
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

// Calcola i totali filtrate per un intervallo di tempo (in millisecondi)
export function getResocontoFiltrato(inizioMs, fineMs) {
  const dati = leggiDati();
  const dipendenti = {};
  let totaleAzienda = 0;

  if (Array.isArray(dati.vendite)) {
    dati.vendite.forEach(v => {
      // Controlla se la vendita rientra nel periodo richiesto
      if (v.timestamp >= inizioMs && v.timestamp <= fineMs) {
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
      }
    });
  }

  return {
    totaleAzienda,
    dipendenti: Object.values(dipendenti).sort((a, b) => b.totale - a.totale)
  };
}

// Reset manuale: svuota tutte le vendite registrate
export function resetSettimanaManuale() {
  salvaDati({ vendite: [] });
}
