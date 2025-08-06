import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackButton({
    to = "/",
    text = "Back to Home",
    variant = "default",
    size = "sm",
    className = "",
    ...props
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center space-x-4 ${className}`}
            {...props}
        >
            <Link to={to}>
                <Button variant={variant} size={size} className="cursor-pointer">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {text}
                </Button>
            </Link>
        </motion.div>
    );
}

export function BackLink({
    to = "/",
    text = "Back to tools",
    className = "",
    ...props
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`max-w-6xl mx-auto ${className}`}
            {...props}
        >
            <Link
                to={to}
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {text}
            </Link>
        </motion.div>
    );
} 