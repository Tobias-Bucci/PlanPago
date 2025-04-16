// src/utils/taxUtils.js

// Beispielhafte progressive Steuerberechnung für verschiedene Länder
const taxCalculators = {
    Deutschland: (brutto) => {
      if (brutto <= 2000) return brutto * 0.2;
      if (brutto <= 5000) return brutto * 0.3;
      return brutto * 0.4;
    },
    Österreich: (brutto) => {
      if (brutto <= 2500) return brutto * 0.22;
      if (brutto <= 6000) return brutto * 0.33;
      return brutto * 0.45;
    },
    Schweiz: (brutto) => {
      if (brutto <= 3000) return brutto * 0.15;
      if (brutto <= 7000) return brutto * 0.25;
      return brutto * 0.35;
    },
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
  