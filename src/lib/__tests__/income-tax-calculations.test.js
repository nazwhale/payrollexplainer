import { describe, test, expect } from 'vitest';
import {
    PERSONAL_ALLOWANCE,
    BASIC_RATE_LIMIT,
    HIGHER_RATE_LIMIT,
    BASIC_RATE,
    HIGHER_RATE,
    ADDITIONAL_RATE,
    calcAnnualIncomeTax,
    calcNonCumulativeIncomeTax,
    calcCumulativeIncomeTax,
    getActiveSalaryForPeriod,
    calcTaxDifference,
    getCumulativeTaxRates,
    cumulative,
    perPeriodThresholds
} from '../income-tax-calculations.js';

describe('Income Tax Constants', () => {
    test('should have correct 2025/26 tax year constants', () => {
        expect(PERSONAL_ALLOWANCE).toBe(12570);
        expect(BASIC_RATE_LIMIT).toBe(50270);
        expect(HIGHER_RATE_LIMIT).toBe(125140);
        expect(BASIC_RATE).toBe(0.20);
        expect(HIGHER_RATE).toBe(0.40);
        expect(ADDITIONAL_RATE).toBe(0.45);
    });
});

describe('perPeriodThresholds', () => {
    test('should calculate correct monthly thresholds', () => {
        const monthly = perPeriodThresholds();
        expect(monthly.periods).toBe(12);
        expect(monthly.personalAllowance).toBeCloseTo(12570 / 12, 2);
        expect(monthly.basicRateLimit).toBeCloseTo(50270 / 12, 2);
        expect(monthly.higherRateLimit).toBeCloseTo(125140 / 12, 2);
    });
});

describe('calcAnnualIncomeTax', () => {
    test('should return 0 for income below personal allowance', () => {
        expect(calcAnnualIncomeTax(10000)).toBe(0);
        expect(calcAnnualIncomeTax(12570)).toBe(0);
    });

    test('should calculate basic rate tax correctly', () => {
        const salary = 30000;
        const taxableIncome = salary - PERSONAL_ALLOWANCE;
        const expected = taxableIncome * BASIC_RATE;
        expect(calcAnnualIncomeTax(salary)).toBeCloseTo(expected, 2);
    });

    test('should calculate higher rate tax correctly', () => {
        const salary = 60000;
        const basicAmount = BASIC_RATE_LIMIT - PERSONAL_ALLOWANCE;
        const higherAmount = salary - BASIC_RATE_LIMIT;
        const expected = (basicAmount * BASIC_RATE) + (higherAmount * HIGHER_RATE);
        expect(calcAnnualIncomeTax(salary)).toBeCloseTo(expected, 2);
    });

    test('should calculate additional rate tax correctly', () => {
        const salary = 150000;
        const basicAmount = BASIC_RATE_LIMIT - PERSONAL_ALLOWANCE;
        const higherAmount = HIGHER_RATE_LIMIT - BASIC_RATE_LIMIT;
        const additionalAmount = salary - HIGHER_RATE_LIMIT;
        const expected = (basicAmount * BASIC_RATE) + (higherAmount * HIGHER_RATE) + (additionalAmount * ADDITIONAL_RATE);
        expect(calcAnnualIncomeTax(salary)).toBeCloseTo(expected, 2);
    });

    test('should match GOV.UK examples', () => {
        // £40,000 salary should result in £5,486 tax
        const tax40k = calcAnnualIncomeTax(40000);
        const expected40k = (40000 - 12570) * 0.20;
        expect(tax40k).toBeCloseTo(expected40k, 0);
        expect(tax40k).toBeCloseTo(5486, 0);
    });
});

describe('calcNonCumulativeIncomeTax', () => {
    test('should return array of correct length for monthly', () => {
        const result = calcNonCumulativeIncomeTax(30000);
        expect(result).toHaveLength(12);
    });

    test('should calculate consistent monthly tax for basic rate salary', () => {
        const result = calcNonCumulativeIncomeTax(30000);
        const monthlyPay = 30000 / 12;
        const monthlyPA = PERSONAL_ALLOWANCE / 12;
        const expectedMonthlyTax = (monthlyPay - monthlyPA) * BASIC_RATE;

        result.forEach(tax => {
            expect(tax).toBeCloseTo(expectedMonthlyTax, 2);
        });
    });

    test('should return 0 for all periods when salary below personal allowance', () => {
        const result = calcNonCumulativeIncomeTax(10000);
        result.forEach(tax => {
            expect(tax).toBe(0);
        });
    });

    test('should handle higher rate salary correctly', () => {
        const result = calcNonCumulativeIncomeTax(60000);
        const monthlyPay = 60000 / 12; // £5,000
        const monthlyPA = PERSONAL_ALLOWANCE / 12;
        const monthlyBasicLimit = BASIC_RATE_LIMIT / 12;

        const taxableIncome = monthlyPay - monthlyPA;
        const basicAmount = monthlyBasicLimit - monthlyPA;
        const higherAmount = taxableIncome - basicAmount;
        const expectedMonthlyTax = (basicAmount * BASIC_RATE) + (higherAmount * HIGHER_RATE);

        result.forEach(tax => {
            expect(tax).toBeCloseTo(expectedMonthlyTax, 2);
        });
    });
});

describe('getActiveSalaryForPeriod', () => {
    test('should return correct salary for single salary starting in period 1', () => {
        const salaries = [{ amount: 40000, startPeriod: 1 }];
        expect(getActiveSalaryForPeriod(salaries, 1)).toBe(40000);
        expect(getActiveSalaryForPeriod(salaries, 6)).toBe(40000);
        expect(getActiveSalaryForPeriod(salaries, 12)).toBe(40000);
    });

    test('should return 0 for period before salary starts', () => {
        const salaries = [{ amount: 40000, startPeriod: 3 }];
        expect(getActiveSalaryForPeriod(salaries, 1)).toBe(0);
        expect(getActiveSalaryForPeriod(salaries, 2)).toBe(0);
    });

    test('should return correct salary after start period', () => {
        const salaries = [{ amount: 40000, startPeriod: 3 }];
        expect(getActiveSalaryForPeriod(salaries, 3)).toBe(40000);
        expect(getActiveSalaryForPeriod(salaries, 4)).toBe(40000);
    });

    test('should handle multiple salary changes correctly', () => {
        const salaries = [
            { amount: 30000, startPeriod: 1 },
            { amount: 50000, startPeriod: 6 },
            { amount: 60000, startPeriod: 9 }
        ];

        expect(getActiveSalaryForPeriod(salaries, 1)).toBe(30000);
        expect(getActiveSalaryForPeriod(salaries, 5)).toBe(30000);
        expect(getActiveSalaryForPeriod(salaries, 6)).toBe(50000);
        expect(getActiveSalaryForPeriod(salaries, 8)).toBe(50000);
        expect(getActiveSalaryForPeriod(salaries, 9)).toBe(60000);
        expect(getActiveSalaryForPeriod(salaries, 12)).toBe(60000);
    });
});

describe('calcCumulativeIncomeTax', () => {
    test('should calculate cumulative tax correctly for single salary', () => {
        const salaries = [{ amount: 40000, startPeriod: 1 }];
        const result = calcCumulativeIncomeTax(salaries);

        expect(result).toHaveLength(12);

        // Check that cumulative total matches annual calculation
        const totalTax = result.reduce((sum, tax) => sum + tax, 0);
        const expectedAnnual = calcAnnualIncomeTax(40000);
        expect(totalTax).toBeCloseTo(expectedAnnual, 2);
    });

    test('should handle salary starting mid-year', () => {
        const salaries = [{ amount: 40000, startPeriod: 6 }];
        const result = calcCumulativeIncomeTax(salaries);

        // First 5 months should have 0 tax
        for (let i = 0; i < 5; i++) {
            expect(result[i]).toBe(0);
        }

        // Tax only starts when cumulative pay exceeds personal allowance
        // For £40k starting month 6, this happens around month 9
        expect(result[8]).toBeGreaterThan(0); // Month 9
        expect(result[9]).toBeGreaterThan(0); // Month 10
        expect(result[11]).toBeGreaterThan(0); // Month 12
    });

    test('should handle salary increases correctly', () => {
        const salaries = [
            { amount: 30000, startPeriod: 1 },
            { amount: 60000, startPeriod: 7 }
        ];
        const result = calcCumulativeIncomeTax(salaries);

        expect(result).toHaveLength(12);

        // Tax should be lower in first 6 months, then higher
        const firstHalfAvg = result.slice(0, 6).reduce((sum, tax) => sum + tax, 0) / 6;
        const secondHalfAvg = result.slice(6, 12).reduce((sum, tax) => sum + tax, 0) / 6;

        expect(secondHalfAvg).toBeGreaterThan(firstHalfAvg);
    });
});

describe('calcTaxDifference', () => {
    test('should show difference between cumulative and non-cumulative methods', () => {
        const salaries = [{ amount: 40000, startPeriod: 1 }];
        const differences = calcTaxDifference(salaries);

        expect(differences).toHaveLength(12);

        // For a single salary starting in period 1, there will be significant differences
        // because cumulative waits until personal allowance is exceeded
        expect(differences[0]).toBeGreaterThan(400); // First month: non-cumulative much higher
        expect(differences[4]).toBeLessThan(0); // Later months: cumulative catches up
    });

    test('should show larger differences with mid-year salary start', () => {
        const salaries = [{ amount: 60000, startPeriod: 6 }];
        const differences = calcTaxDifference(salaries);

        // Early months should have positive differences (non-cumulative higher)
        // Later months should have negative differences (cumulative catching up)
        expect(differences.some(diff => diff > 0)).toBe(true);
        expect(differences.some(diff => diff < 0)).toBe(true);
    });
});

describe('getCumulativeTaxRates', () => {
    test('should return correct rate information for basic rate salary', () => {
        const salaries = [{ amount: 30000, startPeriod: 1 }];
        const rates = getCumulativeTaxRates(salaries);

        expect(rates).toHaveLength(12);

        rates.forEach((rate, index) => {
            expect(rate.period).toBeGreaterThan(0);
            expect(rate.period).toBeLessThanOrEqual(12);
            expect(rate.activeSalary).toBe(30000);

            // Early months should be 0% (within personal allowance)
            // Later months should be 20% (basic rate)
            if (rate.cumulativePay <= PERSONAL_ALLOWANCE) {
                expect(rate.rates[0].rate).toBe(0);
                expect(rate.rates[0].description).toContain('Personal Allowance');
            } else {
                expect(rate.rates[0].rate).toBe(20);
                expect(rate.rates[0].description).toContain('Basic rate');
            }
        });
    });

    test('should show progressive rates for higher rate salary', () => {
        const salaries = [{ amount: 80000, startPeriod: 1 }];
        const rates = getCumulativeTaxRates(salaries);

        // Later periods should show multiple rate bands
        const laterPeriod = rates[11]; // Last month
        expect(laterPeriod.rates.length).toBeGreaterThan(1);
        expect(laterPeriod.rates.some(r => r.rate === 20)).toBe(true);
        expect(laterPeriod.rates.some(r => r.rate === 40)).toBe(true);
    });
});

describe('cumulative', () => {
    test('should create cumulative array correctly', () => {
        expect(cumulative([1, 2, 3, 4])).toEqual([1, 3, 6, 10]);
        expect(cumulative([100])).toEqual([100]);
        expect(cumulative([])).toEqual([]);
    });
});

describe('Integration Tests - Key Scenarios', () => {
    test('£40,000 salary - cumulative vs non-cumulative should have minimal difference', () => {
        const salaries = [{ amount: 40000, startPeriod: 1 }];
        const cumulative = calcCumulativeIncomeTax(salaries);
        const nonCumulative = calcNonCumulativeIncomeTax(40000);

        const cumulativeTotal = cumulative.reduce((sum, tax) => sum + tax, 0);
        const nonCumulativeTotal = nonCumulative.reduce((sum, tax) => sum + tax, 0);

        expect(cumulativeTotal).toBeCloseTo(nonCumulativeTotal, 1);
        expect(cumulativeTotal).toBeCloseTo(calcAnnualIncomeTax(40000), 2);
    });

    test('£80,000 salary starting mid-year should show interesting cumulative pattern', () => {
        const salaries = [{ amount: 80000, startPeriod: 6 }];
        const result = calcCumulativeIncomeTax(salaries);

        // First 5 months should be 0
        for (let i = 0; i < 5; i++) {
            expect(result[i]).toBe(0);
        }

        // Tax should start when cumulative pay exceeds personal allowance
        // Then show a catch-up pattern with higher amounts initially
        expect(result[7]).toBeGreaterThan(0); // Month 8 should have tax
        expect(result[8]).toBeGreaterThan(result[10]); // Month 9 > Month 11 (catch-up effect)
    });

    test('Multiple salary changes should demonstrate cumulative effect', () => {
        const salaries = [
            { amount: 20000, startPeriod: 1 },
            { amount: 80000, startPeriod: 6 },
            { amount: 120000, startPeriod: 9 }
        ];
        const result = calcCumulativeIncomeTax(salaries);

        // Should show escalating pattern as salary increases
        expect(result[5]).toBeGreaterThan(result[4]); // Salary increase effect
        expect(result[8]).toBeGreaterThan(result[7]); // Second salary increase effect
    });
}); 