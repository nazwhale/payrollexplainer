import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { HelpCircle, ExternalLink, Calculator, AlertTriangle, Info, CheckCircle, Share2, Copy } from "lucide-react";
import { PERSONAL_ALLOWANCE } from "@/lib/income-tax-calculations";

const fmtGBP = (n) => {
    const formatted = new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(n);
    return formatted.replace(/\.00$/, '');
};

// Helper functions for URL parameter management
const getUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
        number: params.get('number') || '1257',
        prefix: params.get('prefix') || '',
        suffix: params.get('suffix') || 'L',
        nonCumulative: params.get('nonCumulative') === 'true'
    };
};

const updateUrlParams = (number, prefix, suffix, nonCumulative) => {
    const params = new URLSearchParams();

    if (number) params.set('number', number);
    if (prefix) params.set('prefix', prefix);
    if (suffix) params.set('suffix', suffix);
    if (nonCumulative) params.set('nonCumulative', 'true');

    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState(null, '', newUrl);
};

// Tax code definitions and behavior
const TAX_CODE_PREFIXES = {
    'K': {
        description: 'Owes tax from previous year or has benefits',
        allowanceModifier: 'negative',
        explanation: 'Code K means you owe tax - the number is deducted from your standard allowance'
    },
    'S': {
        description: 'Scottish tax rates apply',
        allowanceModifier: 'standard',
        explanation: 'Same allowance as standard UK codes, but Scottish tax rates apply'
    },
    'C': {
        description: 'Welsh tax rates apply',
        allowanceModifier: 'standard',
        explanation: 'Same allowance as standard UK codes, but Welsh tax rates apply'
    }
};

const TAX_CODE_SUFFIXES = {
    'L': {
        description: 'Standard personal allowance',
        allowanceModifier: 'standard',
        explanation: 'You get the full personal allowance'
    },
    'M': {
        description: 'Marriage allowance - received from spouse',
        allowanceModifier: 'marriage_received',
        explanation: 'You receive 10% of your spouse\'s allowance (£1,257 extra)'
    },
    'N': {
        description: 'Marriage allowance - transferred to spouse',
        allowanceModifier: 'marriage_given',
        explanation: 'You transfer 10% of your allowance to your spouse (£1,257 less)'
    },
    'T': {
        description: 'Other items affect your allowance',
        allowanceModifier: 'review',
        explanation: 'HMRC has made adjustments - contact them for details'
    },
    'BR': {
        description: 'Basic rate on all income',
        allowanceModifier: 'none',
        explanation: '20% tax on every pound earned - no allowance',
        isEmergency: true
    },
    'D0': {
        description: 'Higher rate on all income',
        allowanceModifier: 'none',
        explanation: '40% tax on every pound earned - no allowance',
        isEmergency: true
    },
    'D1': {
        description: 'Additional rate on all income',
        allowanceModifier: 'none',
        explanation: '45% tax on every pound earned - no allowance',
        isEmergency: true
    },
    'NT': {
        description: 'No tax on this income',
        allowanceModifier: 'none',
        explanation: 'No tax deducted - rare special circumstances'
    }
};

const NON_CUMULATIVE_INDICATORS = {
    'X': 'Week 1/Month 1 basis - non-cumulative',
    'W1': 'Week 1 basis - non-cumulative',
    'M1': 'Month 1 basis - non-cumulative'
};

const calculateAllowance = (number, prefix, suffix) => {
    const baseAllowance = PERSONAL_ALLOWANCE;

    // Handle special suffix codes first
    if (['BR', 'D0', 'D1', 'NT'].includes(suffix)) {
        return suffix === 'NT' ? Infinity : 0;
    }

    let allowance = baseAllowance;

    // Apply number-based modifications
    if (number) {
        const numValue = parseInt(number);
        if (prefix === 'K') {
            // K codes: subtract the amount from standard allowance
            allowance = baseAllowance - (numValue * 10);
        } else {
            // Standard codes: the number represents the allowance in tens
            allowance = numValue * 10;
        }
    }

    // Apply suffix modifications
    switch (suffix) {
        case 'M':
            allowance += 1257; // Marriage allowance received
            break;
        case 'N':
            allowance -= 1257; // Marriage allowance given
            break;
    }

    return Math.max(0, allowance);
};

const getCodeExplanation = (number, prefix, suffix, nonCumulative) => {
    const allowance = calculateAllowance(number, prefix, suffix);
    const baseCode = `${prefix || ''}${number || ''}${suffix || ''}`;
    const fullCode = `${baseCode}${nonCumulative ? '/X' : ''}`;

    let explanation = [];

    // Code structure explanation
    if (prefix && TAX_CODE_PREFIXES[prefix]) {
        explanation.push(TAX_CODE_PREFIXES[prefix].explanation);
    }

    if (number && !['BR', 'D0', 'D1', 'NT'].includes(suffix)) {
        if (prefix === 'K') {
            explanation.push(`The number ${number} means £${number * 10} is deducted from your standard allowance`);
        } else {
            explanation.push(`The number ${number} represents your allowance: £${number * 10}`);
        }
    }

    if (suffix && TAX_CODE_SUFFIXES[suffix]) {
        explanation.push(TAX_CODE_SUFFIXES[suffix].explanation);
    }

    if (nonCumulative) {
        explanation.push('The /X means non-cumulative calculation - each pay period is independent');
    }

    return {
        code: fullCode,
        allowance,
        explanation: explanation.join('. '),
        isEmergency: TAX_CODE_SUFFIXES[suffix]?.isEmergency || false,
        isValid: true
    };
};

export default function TaxCodeExplorer() {
    // Initialize state from URL parameters
    const urlParams = getUrlParams();
    const [number, setNumber] = useState(urlParams.number);
    const [prefix, setPrefix] = useState(urlParams.prefix);
    const [suffix, setSuffix] = useState(urlParams.suffix);
    const [nonCumulative, setNonCumulative] = useState(urlParams.nonCumulative);
    const [showHelp, setShowHelp] = useState(false);
    const [copied, setCopied] = useState(false);

    // Copy URL to clipboard function
    const copyUrl = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy URL:', err);
        }
    };

    // Update URL parameters when state changes
    useEffect(() => {
        updateUrlParams(number, prefix, suffix, nonCumulative);
    }, [number, prefix, suffix, nonCumulative]);

    // Handle browser navigation (back/forward buttons)
    useEffect(() => {
        const handlePopState = () => {
            const urlParams = getUrlParams();
            setNumber(urlParams.number);
            setPrefix(urlParams.prefix);
            setSuffix(urlParams.suffix);
            setNonCumulative(urlParams.nonCumulative);
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const codeInfo = getCodeExplanation(number, prefix, suffix, nonCumulative);

    // Common tax codes for quick selection
    const commonCodes = [
        { code: '1257L', desc: 'Standard allowance' },
        { code: 'BR', desc: 'Basic rate on all income' },
        { code: 'D0', desc: 'Higher rate on all income' },
        { code: 'K100L', desc: 'Owes £1,000 tax' },
        { code: '944L', desc: 'Reduced allowance' }
    ];

    const setCommonCode = (codeStr) => {
        // Parse common code strings
        const match = codeStr.match(/^(K|S|C)?(\d+)?(L|M|N|T|BR|D0|D1|NT)$/);
        if (match) {
            const newPrefix = match[1] || '';
            const newNumber = match[2] || '';
            const newSuffix = match[3] || '';
            const newNonCumulative = false;

            setPrefix(newPrefix);
            setNumber(newNumber);
            setSuffix(newSuffix);
            setNonCumulative(newNonCumulative);
        }
    };

    return (
        <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6 space-y-8">
                {/* Simplified Header */}
                <div className="text-center space-y-2">
                    <div className="flex justify-center">
                        <a
                            href="https://www.gov.uk/tax-codes"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                        >
                            <span>Official Guide</span>
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                </div>

                {/* Quick Select - More Compact */}
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Quick Select Common Codes:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {commonCodes.map((common) => {
                            const isSelected = codeInfo.code === common.code;
                            return (
                                <Button
                                    key={common.code}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCommonCode(common.code)}
                                    className={`p-3 h-auto flex flex-col items-center space-y-1 border transition-colors ${isSelected
                                        ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                                        : "bg-white text-gray-900 border-gray-300 hover:bg-blue-50 hover:border-blue-400"
                                        }`}
                                >
                                    <span className="font-mono font-semibold">{common.code}</span>
                                    <span className="text-xs opacity-75 text-center leading-tight">
                                        {common.desc}
                                    </span>
                                </Button>
                            );
                        })}
                    </div>
                </div>

                {/* Simplified Tax Code Builder */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700">Build Your Tax Code:</h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Prefix */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Prefix (optional)</label>
                            <select
                                value={prefix}
                                onChange={(e) => setPrefix(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">None</option>
                                {Object.entries(TAX_CODE_PREFIXES).map(([key, info]) => (
                                    <option key={key} value={key}>{key} - {info.description}</option>
                                ))}
                            </select>
                        </div>

                        {/* Number */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Number</label>
                            <input
                                type="text"
                                value={number}
                                onChange={(e) => setNumber(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                placeholder="1257"
                                className="w-full p-3 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                disabled={['BR', 'D0', 'D1', 'NT'].includes(suffix)}
                            />
                        </div>

                        {/* Suffix */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Suffix</label>
                            <select
                                value={suffix}
                                onChange={(e) => setSuffix(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                                {Object.entries(TAX_CODE_SUFFIXES).map(([key, info]) => (
                                    <option key={key} value={key}>{key} - {info.description}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Non-cumulative toggle - simplified */}
                    <div className="flex items-center space-x-3 pt-2">
                        <button
                            onClick={() => setNonCumulative(!nonCumulative)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${nonCumulative ? 'bg-orange-500' : 'bg-green-500'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${nonCumulative ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                        <span className="text-sm text-gray-600">
                            {nonCumulative ? 'Non-cumulative (X, Week1/Month1)' : 'Cumulative'}
                        </span>
                    </div>
                </div>

                {/* Clean Result Display */}
                <div className="bg-blue-50 rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <span className="text-3xl font-mono font-bold text-blue-700">
                                {codeInfo.code || 'Enter code'}
                            </span>
                            {codeInfo.isEmergency && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    Emergency Code
                                </span>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            {codeInfo.isValid && (
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={copyUrl}
                                className="flex items-center space-x-2 text-blue-600 border-blue-300 hover:bg-blue-50"
                            >
                                {copied ? (
                                    <>
                                        <CheckCircle className="h-4 w-4" />
                                        <span>Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Share2 className="h-4 w-4" />
                                        <span>Share</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between py-2">
                            <span className="text-gray-600">Tax-free allowance:</span>
                            <span className="text-2xl font-semibold text-green-700">
                                {codeInfo.allowance === Infinity ? 'No tax' :
                                    codeInfo.allowance === 0 ? 'No allowance' :
                                        fmtGBP(codeInfo.allowance)}
                            </span>
                        </div>

                        {codeInfo.explanation && (
                            <div className="bg-white rounded-lg p-4 border-l-4 border-blue-400">
                                <p className="text-sm text-gray-700 leading-relaxed">{codeInfo.explanation}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Simplified Monthly Impact */}
                {codeInfo.allowance !== Infinity && (
                    <div className="border-t pt-6">
                        <h4 className="font-medium text-gray-700 mb-4">Monthly Impact (£40k salary example)</h4>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">{fmtGBP(codeInfo.allowance / 12)}</div>
                                <div className="text-sm text-gray-500">Monthly allowance</div>
                            </div>
                            <div className="text-center">
                                <div className={`text-2xl font-bold ${(PERSONAL_ALLOWANCE - codeInfo.allowance) * 0.2 / 12 > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {(PERSONAL_ALLOWANCE - codeInfo.allowance) * 0.2 / 12 > 0 ? '+' : ''}{fmtGBP((PERSONAL_ALLOWANCE - codeInfo.allowance) * 0.2 / 12)}
                                </div>
                                <div className="text-sm text-gray-500">Tax difference vs standard</div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
} 