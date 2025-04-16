// src/utils/taxUtils.js

/**
 * Realistische progressive Steuerberechnung basierend auf Jahreseinkommen
 * Werte sind vereinfacht und für Bildungszwecke
 * Für reale Steuererklärungen sollte man Steuerberatung konsultieren
 */
const taxCalculators = {
  Deutschland: (bruttoMonatlich) => {
    // Auf Jahreseinkommen umrechnen
    const brutto = bruttoMonatlich * 12;
    let steuer = 0;
    
    // Progressiver Steuersatz nach ESt-Tarif (vereinfacht)
    if (brutto <= 10908) {
      // Grundfreibetrag
      steuer = 0;
    } else if (brutto <= 15999) {
      // Erste Progressionszone (14-24%)
      const y = (brutto - 10908) / 10000;
      steuer = (1088.67 * y + 1400) * y;
    } else if (brutto <= 62809) {
      // Zweite Progressionszone (24-42%)
      const y = (brutto - 15999) / 10000;
      steuer = (206.43 * y + 2397) * y + 938.24;
    } else if (brutto <= 277826) {
      // Dritte Zone (42%)
      steuer = 0.42 * brutto - 9972.98;
    } else {
      // Vierte Zone (45%)
      steuer = 0.45 * brutto - 18307.73;
    }
    
    // Sozialversicherungsbeiträge (ca. 20% vereinfacht)
    const sozialabgaben = brutto * 0.20;
    
    // Kirchensteuer ignoriert
    
    // Monatlich zurückrechnen
    return (steuer + sozialabgaben) / 12;
  },
  
  Österreich: (bruttoMonatlich) => {
    // Auf Jahreseinkommen umrechnen
    const brutto = bruttoMonatlich * 12;
    let steuer = 0;
    
    // Einkommensteuer nach ESt-Staffel
    if (brutto <= 11693) {
      steuer = 0;
    } else if (brutto <= 19134) {
      steuer = (brutto - 11693) * 0.20;
    } else if (brutto <= 32075) {
      steuer = (brutto - 19134) * 0.30 + 1488.20;
    } else if (brutto <= 62080) {
      steuer = (brutto - 32075) * 0.40 + 5362.50;
    } else if (brutto <= 93120) {
      steuer = (brutto - 62080) * 0.48 + 17364.50;
    } else if (brutto <= 1000000) {
      steuer = (brutto - 93120) * 0.50 + 32286.70;
    } else {
      steuer = (brutto - 1000000) * 0.55 + 486186.70;
    }
    
    // Sozialversicherungsbeiträge (etwa 18% Mitarbeiteranteil)
    const sozialabgaben = brutto * 0.18;
    
    // Monatlich zurückrechnen
    return (steuer + sozialabgaben) / 12;
  },

  Italien: (bruttoMonatlich) => {
    // Auf Jahreseinkommen umrechnen
    const brutto = bruttoMonatlich * 12;
    let steuer = 0;

    // IRPEF‑Progressionsstufen (Scaglioni) ab 1.1.2024
    if (brutto <= 28000) {
      steuer = brutto * 0.23;
    } else if (brutto <= 50000) {
      steuer = 28000 * 0.23 + (brutto - 28000) * 0.35;
    } else {
      steuer = 28000 * 0.23 + (50000 - 28000) * 0.35 + (brutto - 50000) * 0.43;
    }

    // Sozialversicherungsbeiträge (Mitarbeiteranteil ca. 10%)
    const sozialabgaben = brutto * 0.10;

    // Monatlich zurückrechnen
    return (steuer + sozialabgaben) / 12;
  }
};

const defaultTaxCalculator = (brutto) => brutto * 0.3;

export function computeNet(brutto, country) {
  const calc = taxCalculators[country];
  if (calc) {
    const taxes = calc(brutto);
    return brutto - taxes;
  }
  return brutto - defaultTaxCalculator(brutto);
}
