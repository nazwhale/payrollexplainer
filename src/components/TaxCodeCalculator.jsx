import React from "react";
import { BackButton } from "@/components/ui/back-button";
import TaxCodeExplorer from "./TaxCodeExplorer";
import { motion } from "framer-motion";

export default function TaxCodeCalculator() {
    return (
        <div className="min-h-screen bg-gray-50 text-foreground p-6 space-y-8">
            {/* Header with back button */}
            <BackButton />

            <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold text-center"
            >
                Tax Code Explorer
                <span className="block text-lg font-normal text-muted-foreground mt-2">
                    Build and understand UK Tax Codes and Their Effects on Your Allowance
                </span>
            </motion.h1>

            {/* Tax Code Explorer */}
            <TaxCodeExplorer />

            {/* Educational content */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg p-6 shadow-sm border-0 space-y-4"
            >
                <h2 className="text-xl font-semibold text-foreground">Understanding Your Tax Code</h2>

                <div className="prose max-w-none text-sm text-muted-foreground space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <h3 className="font-semibold text-foreground">Common Tax Codes</h3>
                            <div className="space-y-2">
                                <div><strong>1257L:</strong> Standard personal allowance (£12,570)</div>
                                <div><strong>1257M:</strong> Marriage allowance received (+£1,257)</div>
                                <div><strong>1257N:</strong> Marriage allowance transferred (-£1,257)</div>
                                <div><strong>BR:</strong> Basic rate (20%) on all income</div>
                                <div><strong>D0:</strong> Higher rate (40%) on all income</div>
                                <div><strong>K100L:</strong> Owes £1,000 from previous year</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-semibold text-foreground">Emergency Tax Codes</h3>
                            <div className="space-y-2">
                                <div><strong>1257L/X:</strong> Non-cumulative calculation</div>
                                <div><strong>BR/X:</strong> Emergency basic rate</div>
                                <div><strong>Week1/Month1:</strong> Same as /X suffix</div>
                                <div className="text-xs bg-orange-50 p-2 rounded border-l-4 border-orange-400">
                                    <strong>Note:</strong> Emergency codes often result in overpaying tax early in the year
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-4 mt-6">
                        <h3 className="font-semibold text-foreground mb-2">When Your Tax Code Changes</h3>
                        <div className="space-y-1">
                            <p>• Starting a new job mid-year</p>
                            <p>• Changes in benefits (company car, medical insurance)</p>
                            <p>• Marriage allowance applications</p>
                            <p>• Outstanding tax from previous years</p>
                            <p>• Moving between England/Wales and Scotland</p>
                        </div>
                    </div>
                </div>
            </motion.div>

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
                        href="https://www.gov.uk/tax-codes"
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