// Income Tax calculations for 2025/26 tax year
// Based on rates from https://www.gov.uk/income-tax-rates

// 2025/26 Income Tax rates and thresholds
export const PERSONAL_ALLOWANCE = 12570;
export const BASIC_RATE_LIMIT = 50270;
export const HIGHER_RATE_LIMIT = 125140;

// Tax rates
export const BASIC_RATE = 0.20;
export const HIGHER_RATE = 0.40;
export const ADDITIONAL_RATE = 0.45;

// Tax year dates
export const TAX_YEAR_START = new Date('2025-04-06');
export const TAX_YEAR_END = new Date('2026-04-05');

/**
 * Calculate monthly thresholds
 */
export const perPeriodThresholds = () => {
    const periods = 12;
    return {
        personalAllowance: PERSONAL_ALLOWANCE / periods,
        basicRateLimit: BASIC_RATE_LIMIT / periods,
        higherRateLimit: HIGHER_RATE_LIMIT / periods,
        periods,
    };
};

/**
 * Calculate annual income tax
 */
export const calcAnnualIncomeTax = (annualSalary) => {
    if (annualSalary <= PERSONAL_ALLOWANCE) return 0;

    let tax = 0;
    const taxableIncome = annualSalary - PERSONAL_ALLOWANCE;

    if (taxableIncome <= (BASIC_RATE_LIMIT - PERSONAL_ALLOWANCE)) {
        // All in basic rate
        tax = taxableIncome * BASIC_RATE;
    } else if (annualSalary <= HIGHER_RATE_LIMIT) {
        // Basic + higher rate
        const basicAmount = BASIC_RATE_LIMIT - PERSONAL_ALLOWANCE;
        const higherAmount = taxableIncome - basicAmount;
        tax = (basicAmount * BASIC_RATE) + (higherAmount * HIGHER_RATE);
    } else {
        // Basic + higher + additional rate
        const basicAmount = BASIC_RATE_LIMIT - PERSONAL_ALLOWANCE;
        const higherAmount = HIGHER_RATE_LIMIT - BASIC_RATE_LIMIT;
        const additionalAmount = annualSalary - HIGHER_RATE_LIMIT;
        tax = (basicAmount * BASIC_RATE) + (higherAmount * HIGHER_RATE) + (additionalAmount * ADDITIONAL_RATE);
    }

    return tax;
};

/**
 * Calculate non-cumulative income tax (traditional method)
 * Each period is calculated independently
 */
export const calcNonCumulativeIncomeTax = (annualSalary) => {
    const { personalAllowance, basicRateLimit, higherRateLimit, periods } = perPeriodThresholds();
    const periodPay = annualSalary / periods;

    return Array.from({ length: periods }, () => {
        if (periodPay <= personalAllowance) return 0;

        let tax = 0;
        const taxableIncome = periodPay - personalAllowance;

        if (periodPay <= basicRateLimit) {
            // All in basic rate
            tax = taxableIncome * BASIC_RATE;
        } else if (periodPay <= higherRateLimit) {
            // Basic + higher rate
            const basicAmount = basicRateLimit - personalAllowance;
            const higherAmount = taxableIncome - basicAmount;
            tax = (basicAmount * BASIC_RATE) + (higherAmount * HIGHER_RATE);
        } else {
            // Basic + higher + additional rate
            const basicAmount = basicRateLimit - personalAllowance;
            const higherAmount = higherRateLimit - basicRateLimit;
            const additionalAmount = periodPay - higherRateLimit;
            tax = (basicAmount * BASIC_RATE) + (higherAmount * HIGHER_RATE) + (additionalAmount * ADDITIONAL_RATE);
        }

        return tax;
    });
};

/**
 * Calculate cumulative income tax (PAYE method)
 * Each period considers year-to-date figures
 */
export const calcCumulativeIncomeTax = (salaries) => {
    const { periods } = perPeriodThresholds();
    const result = [];

    let cumulativePay = 0;
    let cumulativeTax = 0;

    for (let period = 0; period < periods; period++) {
        // Find the active salary for this period
        const activeSalary = getActiveSalaryForPeriod(salaries, period + 1);
        const periodPay = activeSalary / periods;

        cumulativePay += periodPay;

        // Calculate total tax due to date
        let totalTaxDue = 0;
        if (cumulativePay > PERSONAL_ALLOWANCE) {
            const taxableIncome = cumulativePay - PERSONAL_ALLOWANCE;

            if (cumulativePay <= BASIC_RATE_LIMIT) {
                totalTaxDue = taxableIncome * BASIC_RATE;
            } else if (cumulativePay <= HIGHER_RATE_LIMIT) {
                const basicAmount = BASIC_RATE_LIMIT - PERSONAL_ALLOWANCE;
                const higherAmount = taxableIncome - basicAmount;
                totalTaxDue = (basicAmount * BASIC_RATE) + (higherAmount * HIGHER_RATE);
            } else {
                const basicAmount = BASIC_RATE_LIMIT - PERSONAL_ALLOWANCE;
                const higherAmount = HIGHER_RATE_LIMIT - BASIC_RATE_LIMIT;
                const additionalAmount = cumulativePay - HIGHER_RATE_LIMIT;
                totalTaxDue = (basicAmount * BASIC_RATE) + (higherAmount * HIGHER_RATE) + (additionalAmount * ADDITIONAL_RATE);
            }
        }

        // Tax for this period is total due minus what's already been paid
        const periodTax = Math.max(0, totalTaxDue - cumulativeTax);
        result.push(periodTax);
        cumulativeTax = totalTaxDue;
    }

    return result;
};

/**
 * Get the active salary for a given period based on start dates
 */
export const getActiveSalaryForPeriod = (salaries, period) => {
    // Sort salaries by start period
    const sortedSalaries = [...salaries].sort((a, b) => a.startPeriod - b.startPeriod);

    // Find the most recent salary that has started by this period
    for (let i = sortedSalaries.length - 1; i >= 0; i--) {
        if (sortedSalaries[i].startPeriod <= period) {
            return sortedSalaries[i].amount;
        }
    }

    // Default to 0 if no salary has started yet
    return 0;
};

/**
 * Calculate cumulative tax-free allowance for each period
 * This shows how allowance builds up when starting mid-year
 */
export const calcCumulativeAllowance = (salaries) => {
    const periods = 12;
    const result = [];

    for (let period = 1; period <= periods; period++) {
        const activeSalary = getActiveSalaryForPeriod(salaries, period);

        if (activeSalary > 0) {
            // Calculate how much allowance should be available
            // Based on how many periods have passed since start of employment
            const periodsWorked = period;
            const allowanceToDate = (PERSONAL_ALLOWANCE / periods) * periodsWorked;
            result.push(allowanceToDate);
        } else {
            // No employment yet, so no allowance used
            result.push(0);
        }
    }

    return result;
};

/**
 * Calculate non-cumulative tax-free allowance for each period
 * This shows how traditional method only gives monthly allowance
 */
export const calcNonCumulativeAllowance = (salaries) => {
    const periods = 12;
    const monthlyAllowance = PERSONAL_ALLOWANCE / periods;
    const result = [];

    for (let period = 1; period <= periods; period++) {
        const activeSalary = getActiveSalaryForPeriod(salaries, period);

        if (activeSalary > 0) {
            // Only get the monthly allowance, no catch-up
            result.push(monthlyAllowance);
        } else {
            result.push(0);
        }
    }

    return result;
};

/**
 * Calculate allowance utilization for each period
 * Shows how much of available allowance is actually used
 */
export const calcAllowanceUtilization = (salaries, isCumulative = true) => {
    const periods = 12;
    const result = [];
    const monthlyAllowance = PERSONAL_ALLOWANCE / periods;

    let cumulativePay = 0;
    let cumulativeAllowanceUsed = 0;

    for (let period = 1; period <= periods; period++) {
        const activeSalary = getActiveSalaryForPeriod(salaries, period);
        const periodPay = activeSalary / periods;

        if (activeSalary > 0) {
            if (isCumulative) {
                cumulativePay += periodPay;
                const allowanceAvailable = (PERSONAL_ALLOWANCE / periods) * period;
                const allowanceUsed = Math.min(cumulativePay, allowanceAvailable);
                const periodAllowanceUsed = allowanceUsed - cumulativeAllowanceUsed;
                cumulativeAllowanceUsed = allowanceUsed;
                result.push(periodAllowanceUsed);
            } else {
                // Non-cumulative: only monthly allowance available
                const allowanceUsed = Math.min(periodPay, monthlyAllowance);
                result.push(allowanceUsed);
            }
        } else {
            result.push(0);
        }
    }

    return result;
};

/**
 * Calculate the difference between cumulative and non-cumulative methods
 */
export const calcTaxDifference = (salaries) => {
    // For non-cumulative, we need to handle multiple salaries by period
    const { periods } = perPeriodThresholds();
    const nonCumulative = [];

    for (let period = 1; period <= periods; period++) {
        const activeSalary = getActiveSalaryForPeriod(salaries, period);
        const periodTax = calcNonCumulativeIncomeTax(activeSalary)[0]; // Get first period tax
        nonCumulative.push(periodTax);
    }

    const cumulative = calcCumulativeIncomeTax(salaries);

    return nonCumulative.map((nonCumTax, index) => nonCumTax - cumulative[index]);
};

/**
 * Utility function to create cumulative array
 */
export const cumulative = (arr) => {
    const result = [];
    let sum = 0;
    for (const val of arr) {
        sum += val;
        result.push(sum);
    }
    return result;
};

/**
 * Get tax rate information for each period in cumulative method
 */
export const getCumulativeTaxRates = (salaries) => {
    const { periods } = perPeriodThresholds();
    const rates = [];

    let cumulativePay = 0;

    for (let period = 1; period <= periods; period++) {
        const activeSalary = getActiveSalaryForPeriod(salaries, period);
        const periodPay = activeSalary / periods;
        cumulativePay += periodPay;

        let rateInfo = {
            period,
            cumulativePay,
            periodPay,
            activeSalary,
            rates: []
        };

        if (cumulativePay <= PERSONAL_ALLOWANCE) {
            rateInfo.rates.push({ rate: 0, description: "0% (within Personal Allowance)" });
        } else if (cumulativePay <= BASIC_RATE_LIMIT) {
            rateInfo.rates.push({ rate: 20, description: "20% (Basic rate)" });
        } else if (cumulativePay <= HIGHER_RATE_LIMIT) {
            rateInfo.rates.push({ rate: 20, description: "20% (Basic rate)" });
            rateInfo.rates.push({ rate: 40, description: "40% (Higher rate)" });
        } else {
            rateInfo.rates.push({ rate: 20, description: "20% (Basic rate)" });
            rateInfo.rates.push({ rate: 40, description: "40% (Higher rate)" });
            rateInfo.rates.push({ rate: 45, description: "45% (Additional rate)" });
        }

        rates.push(rateInfo);
    }

    return rates;
}; 