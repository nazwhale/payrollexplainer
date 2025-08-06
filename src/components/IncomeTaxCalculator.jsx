import React, { useState, useEffect } from "react";
import { Bar, Line } from "react-chartjs-2";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { motion } from "framer-motion";
import { Calculator, Copy, Check, Building2, Clock, HelpCircle, Banknote, TrendingUp, Shield } from "lucide-react";
import {
    calcCumulativeIncomeTax,
    calcNonCumulativeIncomeTax,
    calcTaxDifference,
    getCumulativeTaxRates,
    cumulative,
    calcAnnualIncomeTax,
    getActiveSalaryForPeriod,
    calcCumulativeAllowance,
    calcNonCumulativeAllowance,
    calcAllowanceUtilization,
    PERSONAL_ALLOWANCE,
} from "@/lib/income-tax-calculations";

const fmtGBP = (n) => {
    const formatted = new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(n);
    return formatted.replace(/\.00$/, '');
};

export default function IncomeTaxCalculator() {
    const [salary, setSalary] = useState({ amount: 40000, startPeriod: 1 });
    const [frequency] = useState("monthly");
    const [isNonCumulative, setIsNonCumulative] = useState(false);

    const [barData, setBarData] = useState(null);
    const [lineData, setLineData] = useState(null);
    const [allowanceData, setAllowanceData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [copyFeedback, setCopyFeedback] = useState(false);
    const [cumulativeRates, setCumulativeRates] = useState([]);

    // Update salary amount
    const updateSalaryAmount = (amount) => {
        setSalary(prev => ({ ...prev, amount: parseInt(amount) || 0 }));
    };

    // Update salary start period
    const updateSalaryStartPeriod = (startPeriod) => {
        setSalary(prev => ({ ...prev, startPeriod: parseInt(startPeriod) || 1 }));
    };

    // Calculate example values for the info card
    const exampleSalary = salary.amount;
    const annualTax = calcAnnualIncomeTax(exampleSalary);
    const monthlyTaxPAYE = annualTax / 12;
    const monthlyTaxTraditional = calcNonCumulativeIncomeTax(exampleSalary)[0];

    // Calculate charts whenever inputs change
    useEffect(() => {
        setIsLoading(true);

        const periods = 12;
        const labels = Array.from({ length: periods }, (_, i) => `M${i + 1}`);
        const salaries = [salary]; // Convert to array format for existing calculation functions

        let cumulativeTax, nonCumulativeTax, differences;

        if (isNonCumulative) {
            // For non-cumulative mode, calculate period by period
            nonCumulativeTax = [];
            for (let period = 1; period <= periods; period++) {
                const activeSalary = getActiveSalaryForPeriod(salaries, period);
                const periodTax = activeSalary > 0 ? calcNonCumulativeIncomeTax(activeSalary)[0] : 0;
                nonCumulativeTax.push(periodTax);
            }
            cumulativeTax = new Array(periods).fill(0); // Not used in non-cumulative mode
            differences = new Array(periods).fill(0);
        } else {
            // Cumulative mode
            cumulativeTax = calcCumulativeIncomeTax(salaries);
            nonCumulativeTax = calcTaxDifference(salaries).map((diff, i) => cumulativeTax[i] + diff);
            differences = calcTaxDifference(salaries);
        }

        const rates = getCumulativeTaxRates(salaries);
        setCumulativeRates(rates);

        // Calculate allowance data
        const cumulativeAllowance = calcCumulativeAllowance(salaries);
        const nonCumulativeAllowance = calcNonCumulativeAllowance(salaries);
        const cumulativeAllowanceUsed = calcAllowanceUtilization(salaries, true);
        const nonCumulativeAllowanceUsed = calcAllowanceUtilization(salaries, false);

        setBarData({
            labels,
            datasets: [
                {
                    label: isNonCumulative ? "Non-cumulative tax" : "Cumulative tax (PAYE)",
                    data: isNonCumulative ? nonCumulativeTax : cumulativeTax,
                    backgroundColor: "rgba(59,130,246,0.8)",
                    borderColor: "rgba(59,130,246,1)",
                    borderWidth: 1,
                },
                ...(isNonCumulative ? [] : [{
                    label: "Non-cumulative comparison",
                    data: nonCumulativeTax,
                    backgroundColor: "rgba(239,68,68,0.6)",
                    borderColor: "rgba(239,68,68,1)",
                    borderWidth: 1,
                }]),
            ],
        });

        setAllowanceData({
            labels,
            datasets: [
                {
                    label: isNonCumulative ? "Available allowance (traditional)" : "Available allowance (cumulative)",
                    data: isNonCumulative ? nonCumulativeAllowance : cumulativeAllowance,
                    backgroundColor: "rgba(34,197,94,0.3)",
                    borderColor: "rgba(34,197,94,1)",
                    borderWidth: 2,
                    type: 'line',
                    fill: true,
                    tension: 0.1,
                },
                {
                    label: isNonCumulative ? "Allowance used (traditional)" : "Allowance used (cumulative)",
                    data: isNonCumulative ? nonCumulativeAllowanceUsed : cumulativeAllowanceUsed,
                    backgroundColor: "rgba(99,102,241,0.8)",
                    borderColor: "rgba(99,102,241,1)",
                    borderWidth: 1,
                },
                ...(isNonCumulative ? [] : [{
                    label: "Traditional method comparison",
                    data: nonCumulativeAllowanceUsed,
                    backgroundColor: "rgba(239,68,68,0.6)",
                    borderColor: "rgba(239,68,68,1)",
                    borderWidth: 1,
                }]),
            ],
        });

        setLineData({
            labels,
            datasets: [
                {
                    label: isNonCumulative ? "Cumulative non-cumulative tax" : "Cumulative tax paid",
                    data: cumulative(isNonCumulative ? nonCumulativeTax : cumulativeTax),
                    borderColor: "rgba(34,197,94,1)",
                    backgroundColor: "rgba(34,197,94,0.2)",
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1,
                },
                ...(isNonCumulative ? [] : [{
                    label: "Cumulative non-cumulative comparison",
                    data: cumulative(nonCumulativeTax),
                    borderColor: "rgba(239,68,68,1)",
                    backgroundColor: "rgba(239,68,68,0.1)",
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1,
                }]),
            ],
        });

        setIsLoading(false);
    }, [salary, isNonCumulative]);

    // Copy explanation to clipboard
    const copyExplanation = () => {
        const activePeriods = 12 - salary.startPeriod + 1;
        const totalAnnualSalary = salary.amount * activePeriods / 12;

        const explanation = `Income Tax Calculator Results:

Tax calculation method: ${isNonCumulative ? 'Non-cumulative (traditional)' : 'Cumulative (PAYE)'}
Pay frequency: Monthly
Annual salary: ${fmtGBP(salary.amount)}
Start month: ${salary.startPeriod}
Estimated annual earnings: ${fmtGBP(totalAnnualSalary)}
Estimated annual tax: ${fmtGBP(calcAnnualIncomeTax(totalAnnualSalary))}

${isNonCumulative ?
                `Non-cumulative method: Each pay period is taxed independently using the monthly thresholds. This was the traditional method before PAYE.` :
                `Cumulative method (PAYE): Tax is calculated on year-to-date totals, ensuring the correct annual tax is spread across the year. This is the current UK system.`}

Key insight: ${isNonCumulative ?
                `The non-cumulative method can result in overpayment early in the year if earnings are irregular, requiring reconciliation at year-end.` :
                `The cumulative method automatically adjusts each period to ensure the right amount of tax is collected over the full year, eliminating the need for most year-end adjustments.`}

Generated by UK Payroll Explainer - https://payroll-explainer.local`;

        navigator.clipboard.writeText(explanation).then(() => {
            setCopyFeedback(true);
            setTimeout(() => setCopyFeedback(false), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: function (context) {
                        return context.dataset.label + ': ' + fmtGBP(context.parsed.y);
                    }
                }
            },
        },
        scales: {
            x: {
                grid: {
                    display: true,
                    color: 'rgba(0,0,0,0.1)',
                },
            },
            y: {
                beginAtZero: true,
                grid: {
                    display: true,
                    color: 'rgba(0,0,0,0.1)',
                },
                ticks: {
                    callback: function (value) {
                        return fmtGBP(value);
                    }
                }
            },
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false,
        },
    };

    return (
        <div className="min-h-screen bg-gray-50 text-foreground p-6 space-y-8">
            {/* Header with back button */}
            <BackButton />

            <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold text-center"
            >
                Income Tax
                <span className="block text-lg font-normal text-muted-foreground mt-2">
                    Cumulative vs Non-cumulative Tax Codes, Tax-Free Allowance
                </span>
            </motion.h1>

            {/* Controls */}
            <Card className="bg-white shadow-sm border-0">
                <CardContent className="p-6 space-y-6">
                    {/* Tax calculation method toggle */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-center space-x-6">
                            <div className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-lg transition-all ${!isNonCumulative ? 'bg-green-50 border-2 border-green-200 text-green-800' : 'text-muted-foreground'}`}>
                                <div className="flex items-center space-x-2">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <div className="text-xs font-mono bg-green-100 px-2 py-1 rounded">
                                    Cumulative Tax Codes
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    e.g. 1257L, BR, D0
                                </div>
                            </div>

                            <button
                                onClick={() => setIsNonCumulative(!isNonCumulative)}
                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isNonCumulative ? 'bg-orange-500' : 'bg-green-500'}`}
                            >
                                <span
                                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-lg ${isNonCumulative ? 'translate-x-7' : 'translate-x-1'}`}
                                />
                            </button>

                            <div className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-lg transition-all ${isNonCumulative ? 'bg-orange-50 border-2 border-orange-200 text-orange-800' : 'text-muted-foreground'}`}>
                                <div className="flex items-center space-x-2">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div className="text-xs font-mono bg-orange-100 px-2 py-1 rounded">
                                    Non-cumulative Tax Codes
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    e.g. 1257L/X, BR/X, Week1/Month1
                                </div>
                            </div>
                        </div>

                        {/* Context-sensitive help card with immediate examples */}
                        <Card className="bg-blue-50 border-0 shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                        {isNonCumulative ? (
                                            <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                                        ) : (
                                            <Building2 className="h-5 w-5 text-green-600 mt-0.5" />
                                        )}
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="font-medium text-foreground">
                                            {isNonCumulative ? "Non-cumulative method" : "Default method"}
                                        </div>
                                        <div className="text-muted-foreground space-y-2">
                                            <div>
                                                {isNonCumulative ? (
                                                    <>
                                                        Each month is taxed independently using <strong>non-cumulative tax codes</strong> (with /X, Week1, or Month1 suffixes). For a £{fmtGBP(exampleSalary).replace('£', '')} salary, you'd pay <strong>{fmtGBP(monthlyTaxTraditional)}</strong> every month, which can lead to overpayment early in the year.
                                                    </>
                                                ) : (
                                                    <>
                                                        Tax spreads your annual liability evenly using <strong>cumulative tax codes</strong> (standard codes like 1257L). For a £{fmtGBP(exampleSalary).replace('£', '')} salary, you pay approximately <strong>{fmtGBP(monthlyTaxPAYE)}</strong> per month, automatically adjusting if you start mid-year.
                                                    </>
                                                )}
                                            </div>
                                            {salary.startPeriod > 1 && (
                                                <div className="text-sm bg-yellow-50 border-0 rounded p-2 mt-2 shadow-sm">
                                                    <strong>Mid-year start benefit:</strong> {isNonCumulative ? (
                                                        `With traditional codes, you lose £${fmtGBP((PERSONAL_ALLOWANCE / 12) * (salary.startPeriod - 1)).replace('£', '')} of unused allowance from months 1-${salary.startPeriod - 1}.`
                                                    ) : (
                                                        `With cumulative codes, you get catch-up allowance of £${fmtGBP((PERSONAL_ALLOWANCE / 12) * (salary.startPeriod - 1)).replace('£', '')} from the unused months 1-${salary.startPeriod - 1}.`
                                                    )}
                                                </div>
                                            )}
                                            <div className="text-xs border-l-2 border-blue-300 pl-2">
                                                {isNonCumulative ? (
                                                    <>
                                                        <strong>Tax code examples:</strong> 1257L/X, BR/X, D0/X - the "/X" or "Week1/Month1" tells payroll to ignore previous pay periods.
                                                    </>
                                                ) : (
                                                    <>
                                                        <strong>Tax code examples:</strong> 1257L, BR, D0 - no suffix means cumulative calculation based on year-to-date totals.
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-1 text-xs text-blue-600">
                                            <HelpCircle className="h-3 w-3" />
                                            <span>See the difference in the charts below</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Salary input */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center space-x-2">
                            <Banknote className="h-5 w-5" />
                            <span>Your Salary</span>
                        </h3>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-foreground">
                                    Annual Salary: <span className="font-semibold text-blue-600">{fmtGBP(salary.amount)}</span>
                                </label>
                                <div className="space-y-3">
                                    <input
                                        type="range"
                                        min="10000"
                                        max="100000"
                                        step="1000"
                                        value={salary.amount}
                                        onChange={(e) => updateSalaryAmount(e.target.value)}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer 
                                                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 
                                                 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer
                                                 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:hover:bg-blue-700
                                                 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full 
                                                 [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
                                    />
                                    <div className="relative text-xs text-muted-foreground" style={{ height: '1.25rem', paddingTop: '0.25rem' }}>
                                        <span className="absolute transform -translate-x-1/2" style={{ left: '0%' }}>£10k</span>
                                        <span className="absolute transform -translate-x-1/2" style={{ left: '33.33%' }}>£40k</span>
                                        <span className="absolute transform -translate-x-1/2" style={{ left: '66.67%' }}>£70k</span>
                                        <span className="absolute transform -translate-x-1/2" style={{ left: '100%' }}>£100k</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-foreground">
                                    Starts in Month: <span className="font-semibold text-blue-600">{salary.startPeriod} ({['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'][salary.startPeriod - 1]})</span>
                                </label>
                                <div className="space-y-3">
                                    <input
                                        type="range"
                                        min="1"
                                        max="12"
                                        step="1"
                                        value={salary.startPeriod}
                                        onChange={(e) => updateSalaryStartPeriod(e.target.value)}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer 
                                                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 
                                                 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer
                                                 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:hover:bg-blue-700
                                                 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full 
                                                 [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
                                    />
                                    <div className="relative text-xs text-muted-foreground" style={{ height: '1.25rem', paddingTop: '0.25rem' }}>
                                        <span className="absolute transform -translate-x-1/2" style={{ left: '0%' }}>Apr</span>
                                        <span className="absolute transform -translate-x-1/2" style={{ left: '27.27%' }}>Jul</span>
                                        <span className="absolute transform -translate-x-1/2" style={{ left: '54.55%' }}>Oct</span>
                                        <span className="absolute transform -translate-x-1/2" style={{ left: '81.82%' }}>Jan</span>
                                        <span className="absolute transform -translate-x-1/2" style={{ left: '100%' }}>Mar</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Charts */}
            {isLoading ? (
                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6 flex items-center justify-center h-64">
                        <div className="text-muted-foreground">Calculating...</div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {/* Main tax charts */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card className="bg-white shadow-sm border-0">
                            <CardContent className="p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                                    <Calculator className="h-5 w-5" />
                                    <span>Tax Per Period</span>
                                </h3>
                                <div className="h-80">
                                    <Bar data={barData} options={chartOptions} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white shadow-sm border-0">
                            <CardContent className="p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                                    <TrendingUp className="h-5 w-5" />
                                    <span>Cumulative Tax Paid</span>
                                </h3>
                                <div className="h-80">
                                    <Line data={lineData} options={chartOptions} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tax-free allowance chart */}
                    <Card className="bg-white shadow-sm border-0">
                        <CardContent className="p-6">
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold flex items-center space-x-2">
                                    <Shield className="h-5 w-5" />
                                    <span>Tax-Free Allowance Utilization</span>
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {isNonCumulative
                                        ? "Traditional method: Only gets monthly allowance (£1,048/month), loses unused allowance"
                                        : `Cumulative method: Builds up allowance over time, catches up if starting mid-year (£${fmtGBP(PERSONAL_ALLOWANCE).replace('£', '')} annual allowance)`
                                    }
                                </p>
                            </div>
                            <div className="h-80">
                                <Bar data={allowanceData} options={{
                                    ...chartOptions,
                                    plugins: {
                                        ...chartOptions.plugins,
                                        tooltip: {
                                            ...chartOptions.plugins.tooltip,
                                            callbacks: {
                                                label: function (context) {
                                                    return context.dataset.label + ': ' + fmtGBP(context.parsed.y);
                                                },
                                                afterBody: function (context) {
                                                    if (context[0].dataIndex < (salary.startPeriod - 1)) {
                                                        return isNonCumulative
                                                            ? "Traditional: No employment = no allowance available"
                                                            : "Cumulative: Allowance builds up even before employment starts";
                                                    }
                                                    return '';
                                                }
                                            }
                                        }
                                    }
                                }} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Explanation card */}
            <Card className="bg-white shadow-sm border-0">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold">Understanding the Calculation</h3>
                        <Button onClick={copyExplanation} size="sm" variant="outline">
                            {copyFeedback ? (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Explanation
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="prose max-w-none text-sm text-muted-foreground">
                        {isNonCumulative ? (
                            <div>
                                <p><strong>Non-cumulative tax codes:</strong> Each pay period is taxed independently using the period thresholds. This was the traditional method before PAYE was introduced.</p>
                                <p>With this method, if you earn irregularly throughout the year, you may overpay tax early on and require a refund at year-end, or underpay and owe additional tax.</p>
                            </div>
                        ) : (
                            <div>
                                <p><strong>Cumulative tax codes (PAYE):</strong> Your tax is calculated on your total pay to date, ensuring the correct amount is deducted across the full year.</p>
                                <p>This method automatically adjusts each period - if you start a job mid-year or change salaries, the system "catches up" to ensure you pay the right annual amount.</p>
                            </div>
                        )}

                        <p className="mt-4">
                            <strong>Key insight:</strong> The cumulative method is why PAYE works so well - it eliminates most need for year-end tax reconciliations by spreading your annual tax liability evenly across your actual working periods.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Info footer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center text-sm text-muted-foreground mt-12"
            >
                <p>
                    Based on 2025/26 tax year rates and thresholds •
                    <a
                        href="https://www.gov.uk/income-tax-rates"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-foreground ml-1"
                    >
                        Official HMRC guidance
                    </a>
                </p>
            </motion.div>
        </div>
    );
} 