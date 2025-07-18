import React, { useState, useEffect } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

// Explicitly register only the pieces we need – fixes the “linear is not a registered scale” error
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  LineElement,
  Tooltip,
  Legend
);

/**
 * 2025/26 NIC thresholds
 */
const PT_ANNUAL = 12_570;
const UEL_ANNUAL = 50_270;
const TAX_YEAR_START = new Date("2025-04-06");
const TAX_YEAR_END = new Date("2026-04-05");

const fmtGBP = (n) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(n);

const perPeriodThresholds = (freq) => {
  const periods = freq === "monthly" ? 12 : 52;
  return {
    PT: PT_ANNUAL / periods,
    UEL: UEL_ANNUAL / periods,
    periods,
  };
};

const calcEmployeeNIC = (annualSalary, freq) => {
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

const calcAnnualNIC = (annualSalary) => {
  let ni = 0;
  if (annualSalary > PT_ANNUAL) {
    const abovePT = Math.min(annualSalary, UEL_ANNUAL) - PT_ANNUAL;
    ni += abovePT * 0.12;
    if (annualSalary > UEL_ANNUAL) ni += (annualSalary - UEL_ANNUAL) * 0.02;
  }
  return ni;
};

const calcDirectorAlternativeNIC = (annualSalary, freq) => {
  const per = calcEmployeeNIC(annualSalary, freq);
  const trueUp = calcAnnualNIC(annualSalary) - per.reduce((a, b) => a + b, 0);
  per[per.length - 1] += trueUp; // balancing charge in final period
  return per;
};

const calcDirectorStandardNIC = (annualSalary, freq, startDateStr) => {
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

const cumulative = (arr) => {
  const out = [];
  arr.reduce((acc, v) => {
    const next = acc + v;
    out.push(next);
    return next;
  }, 0);
  return out;
};

export default function DirectorsNIApp() {
  const [salary, setSalary] = useState(60_000);
  const [frequency, setFrequency] = useState("monthly");
  const [startDate, setStartDate] = useState("");

  const [barData, setBarData] = useState(null);
  const [lineData, setLineData] = useState(null);

  // Add loading state for charts
  const [isLoading, setIsLoading] = useState(true);

  // Recalculate datasets whenever inputs change
  useEffect(() => {
    setIsLoading(true);
    const emp = calcEmployeeNIC(salary, frequency);
    const alt = calcDirectorAlternativeNIC(salary, frequency);
    const std = calcDirectorStandardNIC(salary, frequency, startDate);

    const labels = emp.map((_, i) =>
      frequency === "monthly" ? `M${i + 1}` : `W${i + 1}`
    );

    setBarData({
      labels,
      datasets: [
        {
          label: "Standard (annual)",
          data: std,
          backgroundColor: "rgba(59,130,246,0.8)",
          borderColor: "rgba(59,130,246,1)",
          borderWidth: 1,
        },
        {
          label: "Alternative",
          data: alt,
          backgroundColor: "rgba(34,197,94,0.8)",
          borderColor: "rgba(34,197,94,1)",
          borderWidth: 1,
        },
        {
          label: "Employee baseline",
          data: emp,
          backgroundColor: "rgba(107,114,128,0.6)",
          borderColor: "rgba(107,114,128,1)",
          borderWidth: 1,
        },
      ],
    });

    setLineData({
      labels,
      datasets: [
        {
          label: "Standard (annual)",
          data: cumulative(std),
          borderColor: "rgba(59,130,246,1)",
          backgroundColor: "rgba(59,130,246,0.1)",
          borderWidth: 3,
          tension: 0.4,
        },
        {
          label: "Alternative",
          data: cumulative(alt),
          borderColor: "rgba(34,197,94,1)",
          backgroundColor: "rgba(34,197,94,0.1)",
          borderWidth: 3,
          tension: 0.4,
        },
        {
          label: "Employee baseline",
          data: cumulative(emp),
          borderColor: "rgba(107,114,128,1)",
          backgroundColor: "rgba(107,114,128,0.1)",
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.4,
        },
      ],
    });
    setIsLoading(false);
  }, [salary, frequency, startDate]);

  const copyExplanation = () => {
    const txt = `Two NI calculation styles for directors:\n\n• Standard (\"bucket\"): nothing until cumulative pay passes £12,570, then a spike.\n• Alternative (\"drip\"): NI calculated each pay run like a normal employee, with a tiny true‑up in the final period.\n\nTotal NI over the tax year is identical – only timing differs.`;
    navigator.clipboard.writeText(txt);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-8">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold tracking-tight text-center"
      >
        UK Payroll Explainer: <span className="font-normal text-muted-foreground">Directors' National Insurance - bucket vs drip‑feed</span>
      </motion.h1>

      {/* Controls */}
      <Card>
        <CardContent className="p-6 grid gap-4 md:grid-cols-3">
          {/* Salary slider */}
          <div>
            <label className="block mb-2 text-sm font-medium text-foreground" htmlFor="salary">
              Annual salary (£{salary.toLocaleString()})
            </label>
            <input
              id="salary"
              type="range"
              min="5000"
              max="200000"
              step="1000"
              value={salary}
              onChange={(e) => setSalary(+e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Pay frequency */}
          <div>
            <label className="block mb-2 text-sm font-medium text-foreground" htmlFor="freq">
              Pay frequency
            </label>
            <select
              id="freq"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          {/* Director start date */}
          <div>
            <label className="block mb-2 text-sm font-medium text-foreground" htmlFor="start">
              Director start‑date
            </label>
            <input
              id="start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-6 md:grid-cols-2">
          {/* Per-pay-run NI bar chart */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Per-pay-run NI</h3>
              <div className="h-64">
                <Bar
                  data={barData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                        labels: {
                          color: '#374151',
                          usePointStyle: true,
                          padding: 20,
                        }
                      },
                      tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#374151',
                        bodyColor: '#374151',
                        borderColor: '#d1d5db',
                        borderWidth: 1,
                        callbacks: {
                          label: function (context) {
                            return `${context.dataset.label}: ${fmtGBP(context.parsed.y)}`;
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        grid: {
                          color: '#e5e7eb',
                        },
                        ticks: {
                          color: '#6b7280',
                        }
                      },
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: '#e5e7eb',
                        },
                        ticks: {
                          color: '#6b7280',
                          callback: function (value) {
                            return fmtGBP(value);
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Shows the "spike vs smooth" contrast - Standard method creates sudden NI hits
              </p>
            </CardContent>
          </Card>

          {/* Cumulative NI line chart */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Cumulative NI</h3>
              <div className="h-64">
                <Line
                  data={lineData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                        labels: {
                          color: '#374151',
                          usePointStyle: true,
                          padding: 20,
                        }
                      },
                      tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#374151',
                        bodyColor: '#374151',
                        borderColor: '#d1d5db',
                        borderWidth: 1,
                        callbacks: {
                          label: function (context) {
                            return `${context.dataset.label}: ${fmtGBP(context.parsed.y)}`;
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        grid: {
                          color: '#e5e7eb',
                        },
                        ticks: {
                          color: '#6b7280',
                        }
                      },
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: '#e5e7eb',
                        },
                        ticks: {
                          color: '#6b7280',
                          callback: function (value) {
                            return fmtGBP(value);
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Proves totals end up identical while cash-flow differs
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Summary and explanation */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">The "Bucket vs Drip-feed" Analogy</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium text-blue-600">Standard (Annual) Method</h4>
                  <p className="text-sm text-muted-foreground">
                    Like a bucket: ignore weekly/monthly thresholds until cumulative pay spills over £12,570, then a sudden NI hit.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-green-600">Alternative Method</h4>
                  <p className="text-sm text-muted-foreground">
                    Like drip-feed: treat each pay run like an ordinary employee, with a tiny true-up at year-end.
                  </p>
                </div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Key insight:</strong> Total NI over the year is identical whichever method you pick – HMRC only cares about the annual figure – but cash-flow differs.
                  That's why founders on low regular salaries often prefer the alternative method: smaller, predictable deductions help personal budgeting.
                </p>
              </div>
            </div>
            <Button onClick={copyExplanation} variant="outline" size="sm">
              Copy explanation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Based on 2025/26 thresholds: PT £12,570, UEL £50,270 •
          <a
            href="https://www.gov.uk/guidance/work-out-directors-national-insurance-contributions"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Official HMRC guidance
          </a>
        </p>
      </div>
    </div>
  );
}