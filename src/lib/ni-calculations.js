/**
 * 2025/26 NIC thresholds
 */
export const PT_ANNUAL = 12_570;
export const UEL_ANNUAL = 50_270;
export const TAX_YEAR_START = new Date("2025-04-06");
export const TAX_YEAR_END = new Date("2026-04-05");

export const perPeriodThresholds = (freq) => {
    const periods = freq === "monthly" ? 12 : 52;
    return {
        PT: PT_ANNUAL / periods,
        UEL: UEL_ANNUAL / periods,
        periods,
    };
};

export const calcEmployeeNIC = (annualSalary, freq) => {
    const { PT, UEL, periods } = perPeriodThresholds(freq);
    const pay = annualSalary / periods;
    return Array.from({ length: periods }, () => {
        let ni = 0;
        if (pay > PT) {
            const abovePT = Math.min(pay, UEL) - PT;
            ni += abovePT * 0.12;
            if (pay > UEL) ni += (pay - UEL) * 0.02;
        }
        return ni;
    });
};

export const calcAnnualNIC = (annualSalary) => {
    let ni = 0;
    if (annualSalary > PT_ANNUAL) {
        const abovePT = Math.min(annualSalary, UEL_ANNUAL) - PT_ANNUAL;
        ni += abovePT * 0.12;
        if (annualSalary > UEL_ANNUAL) ni += (annualSalary - UEL_ANNUAL) * 0.02;
    }
    return ni;
};

export const calcDirectorAlternativeNIC = (annualSalary, freq) => {
    const per = calcEmployeeNIC(annualSalary, freq);
    const trueUp = calcAnnualNIC(annualSalary) - per.reduce((a, b) => a + b, 0);
    per[per.length - 1] += trueUp; // balancing charge in final period
    return per;
};

export const calcDirectorStandardNIC = (annualSalary, freq, startDateStr) => {
    const { periods } = perPeriodThresholds(freq);
    const pay = annualSalary / periods;
    let proratedPT = PT_ANNUAL;

    // Handle mid‑year appointments – pro‑rate PT
    if (startDateStr) {
        const start = new Date(startDateStr);
        if (start > TAX_YEAR_START) {
            const remainingDays = (TAX_YEAR_END - start) / 86_400_000 + 1;
            proratedPT = PT_ANNUAL * (remainingDays / 365);
        }
    }

    const per = [];
    let cumPay = 0,
        cumNI = 0;

    for (let i = 0; i < periods; i++) {
        cumPay += pay;
        let niToDate = 0;
        if (cumPay > proratedPT) {
            const abovePT = Math.min(cumPay, UEL_ANNUAL) - proratedPT;
            niToDate += abovePT * 0.12;
            if (cumPay > UEL_ANNUAL) niToDate += (cumPay - UEL_ANNUAL) * 0.02;
        }
        per.push(niToDate - cumNI);
        cumNI = niToDate;
    }
    return per;
};

export const cumulative = (arr) => {
    const out = [];
    arr.reduce((acc, v) => {
        const next = acc + v;
        out.push(next);
        return next;
    }, 0);
    return out;
}; 