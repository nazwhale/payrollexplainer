import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Calculator, Users, FileText, TrendingUp, Code } from "lucide-react";

const tools = [
    {
        id: "directors-ni",
        title: "Directors' National Insurance",
        description: "Compare Standard vs Alternative NI calculation methods for company directors. Visualize the 'bucket vs drip-feed' difference in cash flow timing.",
        path: "/directors-national-insurance",
        icon: Calculator,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        available: true,
    },
    {
        id: "income-tax-calculator",
        title: "Income Tax",
        description: "Explore the cumulative nature of income tax. Compare cumulative vs non-cumulative tax codes and see how PAYE spreads your annual tax liability across the year.",
        path: "/income-tax-calculator",
        icon: FileText,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        available: true,
    },
    {
        id: "tax-code-explorer",
        title: "Tax Code Explorer",
        description: "Interactive tool to understand UK tax codes. Build different tax codes and see how they affect your tax-free allowance and monthly deductions.",
        path: "/tax-code-explorer",
        icon: Code,
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
        available: true,
    },
    {
        id: "pension-contributions",
        title: "Pension Contributions",
        description: "Calculate auto-enrollment pension contributions for employers and employees with various salary sacrifice scenarios.",
        path: "/pension-contributions",
        icon: TrendingUp,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        available: false,
    },
];

export default function Home() {
    return (
        <div className="min-h-screen bg-background text-foreground p-6 space-y-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4"
            >
                <h1 className="text-4xl font-bold tracking-tight">
                    UK Payroll Explainer
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Interactive tools to understand UK payroll calculations
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="max-w-4xl mx-auto"
            >
                <h2 className="text-2xl font-semibold mb-6">Available Tools</h2>

                <div className="grid gap-6 md:grid-cols-2">
                    {tools.map((tool, index) => {
                        const IconComponent = tool.icon;

                        return (
                            <motion.div
                                key={tool.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * index }}
                            >
                                <Card className={`h-full transition-all duration-200 ${tool.available
                                    ? 'hover:shadow-lg hover:scale-[1.02] cursor-pointer'
                                    : 'opacity-60 cursor-not-allowed'
                                    }`}>
                                    <CardContent className="p-6">
                                        {tool.available ? (
                                            <Link to={tool.path} className="block h-full">
                                                <div className="space-y-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className={`p-3 rounded-lg ${tool.bgColor}`}>
                                                            <IconComponent className={`h-6 w-6 ${tool.color}`} />
                                                        </div>
                                                        <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                                            Available
                                                        </span>
                                                    </div>

                                                    <div>
                                                        <h3 className="text-lg font-semibold mb-2">{tool.title}</h3>
                                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                                            {tool.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </Link>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex items-start justify-between">
                                                    <div className={`p-3 rounded-lg ${tool.bgColor}`}>
                                                        <IconComponent className={`h-6 w-6 ${tool.color}`} />
                                                    </div>
                                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                                        Coming Soon
                                                    </span>
                                                </div>

                                                <div>
                                                    <h3 className="text-lg font-semibold mb-2">{tool.title}</h3>
                                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                                        {tool.description}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
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
                        href="https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2025-to-2026"
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