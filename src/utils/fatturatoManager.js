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

// Salva la vendita specificando se è "RUOTA" o "NORMALE"
export function registraVendita(userId, username, importo, tipoVendita = 'NORMALE') {
  const dati = leggiDati();
  dati.vendite.push({
    userId,
    username,
    importo,
    tipoVendita, // 'NORMALE' o 'RUOTA'
    timestamp: Date.now()
  });
  salvaDati(dati);
}

// Calcola i totali separando le vendite standard da quelle della ruota
export function getResocontoFiltrato(inizioMs, fineMs) {
  const dati = leggiDati();
  const dipendenti = {};
  let totaleFattureNormale = 0;
  let totaleRuota = 0;

  if (Array.isArray(dati.vendite)) {
    dati.vendite.forEach(v => {
      if (v.timestamp >= inizioMs && v.timestamp <= fineMs) {
        
        // Divisione dei totali aziendali
        if (v.tipoVendita === 'RUOTA') {
          totaleRuota += v.importo;
        } else {
          totaleFattureNormale += v.importo;
        }

        // Conteggio per singolo dipendente
        if (!dipendenti[v.userId]) {
          dipendenti[v.userId] = {
            username: v.username,
            totaleNormale: 0,
            totaleRuota: 0,
            totaleComplessivo: 0,
            numeroVendite: 0
          };
        }

        if (v.tipoVendita === 'RUOTA') {
          dipendenti[v.userId].totaleRuota += v.importo;
        } else {
          dipendenti[v.userId].totaleNormale += v.importo;
        }

        dipendenti[v.userId].totaleComplessivo += v.importo;
        dipendenti[v.userId].numeroVendite += 1;
      }
    });
  }

  return {
    totaleAzienda: totaleFattureNormale + totaleRuota,
    totaleFattureNormale,
    totaleRuota,
    dipendenti: Object.values(dipendenti).sort((a, b) => b.totaleComplessivo - a.totaleComplessivo)
  };
}

export function resetSettimanaManuale() {
  salvaDati({ vendite: [] });
}
