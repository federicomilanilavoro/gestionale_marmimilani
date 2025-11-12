// backend/src/utils/schedule.ts
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'

dayjs.extend(isBetween)

const ORA_INIZIO = 8
const ORA_FINE = 17
const ORE_GIORNALIERE = ORA_FINE - ORA_INIZIO // 9 ore

/**
 * Calcola la data di fine lavoro considerando l'orario 8-17
 * @param start - Data di inizio
 * @param sqm - Metri quadrati
 * @param ml - Metri lineari
 * @param coeffSqm - Coefficiente ore per m² (default 0.5)
 * @param coeffMl - Coefficiente ore per mL (default 0.2)
 */

export function calcolaFineLavoro(
  start: Date,
  sqm: number = 0,
  ml: number = 0,
  coeffSqm = 30,
  coeffMl = 12
): Date {
  // 🔒 Normalizza input
  const sqmNum = Number(sqm) || 0
  const mlNum = Number(ml) || 0
  const coeffSqmNum = Number(coeffSqm) || 0
  const coeffMlNum = Number(coeffMl) || 0

  const minutiTotali = sqmNum * coeffSqmNum + mlNum * coeffMlNum
  const oreTotali = minutiTotali / 60

  if (!isFinite(oreTotali) || oreTotali <= 0) {
    return dayjs(start).add(1, 'hour').toDate() // fallback sicuro
  }

  let fine = dayjs(start)
  let oreRimanenti = oreTotali

  // Assicurati che inizi in orario lavorativo
  if (fine.hour() < ORA_INIZIO) {
    fine = fine.hour(ORA_INIZIO).minute(0).second(0)
  } else if (fine.hour() >= ORA_FINE) {
    fine = fine.add(1, 'day').hour(ORA_INIZIO).minute(0).second(0)
  }

  while (oreRimanenti > 0) {
    const oraCorrente = fine.hour()
    const minutoCorrente = fine.minute()
    
    // Se siamo oltre l'orario, vai al giorno dopo
    if (oraCorrente >= ORA_FINE) {
      fine = fine.add(1, 'day').hour(ORA_INIZIO).minute(0).second(0)
      continue
    }

    // Calcola ore disponibili oggi
    const oreDisponibiliOggi = ORA_FINE - oraCorrente - minutoCorrente / 60
    const oreDaLavorare = Math.min(oreDisponibiliOggi, oreRimanenti)

    // Aggiungi le ore
    fine = fine.add(oreDaLavorare * 60, 'minute')
    oreRimanenti -= oreDaLavorare

    // Se siamo oltre le 17, vai al giorno dopo alle 8
    if (fine.hour() >= ORA_FINE) {
      const minutiOltre = (fine.hour() - ORA_FINE) * 60 + fine.minute()
      fine = fine.add(1, 'day').hour(ORA_INIZIO).minute(0).second(0)
      fine = fine.add(minutiOltre, 'minute')
    }
  }

  return fine.toDate()
}

/**
 * Trova il primo slot disponibile dopo una certa data
 */
export function trovaSlotDisponibile(
  dataRichiesta: Date,
  durata: number, // in ore
  ordiniEsistenti: Array<{ startDate: Date; endDate: Date }>
): Date {
  let tentativo = dayjs(dataRichiesta)

  // Normalizza all'orario lavorativo
  if (tentativo.hour() < ORA_INIZIO) {
    tentativo = tentativo.hour(ORA_INIZIO).minute(0).second(0)
  } else if (tentativo.hour() >= ORA_FINE) {
    tentativo = tentativo.add(1, 'day').hour(ORA_INIZIO).minute(0).second(0)
  }

  // Continua finché non trovi uno slot libero
  let trovato = false
  let maxIterazioni = 365 // limite sicurezza (1 anno)
  
  while (!trovato && maxIterazioni > 0) {
    const fineCalcolata = calcolaFineLavoro(tentativo.toDate(), durata / 0.5, 0, 0.5, 0)
    const collisione = controllaCollisione(
      tentativo.toDate(),
      fineCalcolata,
      ordiniEsistenti
    )

    if (!collisione) {
      trovato = true
    } else {
      // Salta alla fine dell'ordine che collide
      tentativo = dayjs(collisione.endDate)
      // Normalizza
      if (tentativo.hour() >= ORA_FINE) {
        tentativo = tentativo.add(1, 'day').hour(ORA_INIZIO).minute(0).second(0)
      }
    }
    
    maxIterazioni--
  }

  return tentativo.toDate()
}

/**
 * Controlla se c'è una collisione con ordini esistenti
 */
export function controllaCollisione(
  start: Date,
  end: Date,
  ordiniEsistenti: Array<{ startDate: Date; endDate: Date }>
): { startDate: Date; endDate: Date } | null {
  const s2 = dayjs(start)
  const e2 = dayjs(end)

  for (const order of ordiniEsistenti) {
    const s1 = dayjs(order.startDate)
    const e1 = dayjs(order.endDate)

    // Controlla sovrapposizione: (Start1 < End2) AND (End1 > Start2)
    if (s1.isBefore(e2) && e1.isAfter(s2)) {
      return order
    }
  }

  return null
}