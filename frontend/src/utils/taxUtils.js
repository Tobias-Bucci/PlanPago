// src/utils/taxUtils.js

const taxCalculators = {
  Germany: (grossMonthly) => {
    // Convert to annual income
    const gross = grossMonthly * 12;
    let tax = 0;

    // Progressive tax rate according to income tax schedule (simplified)
    if (gross <= 10908) {
      // Basic tax-free allowance
      tax = 0;
    } else if (gross <= 15999) {
      // First progression zone (14-24%)
      const y = (gross - 10908) / 10000;
      tax = (1088.67 * y + 1400) * y;
    } else if (gross <= 62809) {
      // Second progression zone (24-42%)
      const y = (gross - 15999) / 10000;
      tax = (206.43 * y + 2397) * y + 938.24;
    } else if (gross <= 277826) {
      // Third zone (42%)
      tax = 0.42 * gross - 9972.98;
    } else {
      // Fourth zone (45%)
      tax = 0.45 * gross - 18307.73;
    }

    // Social security contributions (approx. 20% simplified)
    const socialContributions = gross * 0.20;

    // Church tax ignored

    // Convert back to monthly
    return (tax + socialContributions) / 12;
  },

  Austria: (grossMonthly) => {
    // Convert to annual income
    const gross = grossMonthly * 12;
    let tax = 0;

    // Income tax according to tax brackets
    if (gross <= 11693) {
      tax = 0;
    } else if (gross <= 19134) {
      tax = (gross - 11693) * 0.20;
    } else if (gross <= 32075) {
      tax = (gross - 19134) * 0.30 + 1488.20;
    } else if (gross <= 62080) {
      tax = (gross - 32075) * 0.40 + 5362.50;
    } else if (gross <= 93120) {
      tax = (gross - 62080) * 0.48 + 17364.50;
    } else if (gross <= 1000000) {
      tax = (gross - 93120) * 0.50 + 32286.70;
    } else {
      tax = (gross - 1000000) * 0.55 + 486186.70;
    }

    // Social security contributions (about 18% employee share)
    const socialContributions = gross * 0.18;

    // Convert back to monthly
    return (tax + socialContributions) / 12;
  },

  Italy: (grossMonthly) => {
    // Convert to annual income
    const gross = grossMonthly * 12;
    let tax = 0;

    // IRPEF progression brackets (Scaglioni) from 1.1.2024
    if (gross <= 28000) {
      tax = gross * 0.23;
    } else if (gross <= 50000) {
      tax = 28000 * 0.23 + (gross - 28000) * 0.35;
    } else {
      tax = 28000 * 0.23 + (50000 - 28000) * 0.35 + (gross - 50000) * 0.43;
    }

    // Social security contributions (employee share approx. 10%)
    const socialContributions = gross * 0.10;

    // Convert back to monthly
    return (tax + socialContributions) / 12;
  },
};

export function computeNet(grossMonthly, country) {
  const calculator = taxCalculators[country];
  if (!calculator) {
    console.warn(`No tax calculator available for country: ${country}`);
    return grossMonthly * 0.7; // fallback: assume 30% total deductions
  }
  const deductions = calculator(grossMonthly);
  return Math.max(0, grossMonthly - deductions);
}
