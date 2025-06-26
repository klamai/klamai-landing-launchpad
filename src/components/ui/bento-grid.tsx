
"use client";

import { cn } from "@/lib/utils";
import {
    CheckCircle,
    Clock,
    Star,
    TrendingUp,
    Video,
    Globe,
} from "lucide-react";

export interface BentoItem {
    title: string;
    description: string;
    icon: React.ReactNode;
    status?: string;
    tags?: string[];
    meta?: string;
    cta?: string;
    colSpan?: number;
    hasPersistentHover?: boolean;
}

interface BentoGridProps {
    items: BentoItem[];
}

function BentoGrid({ items }: BentoGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 max-w-7xl mx-auto">
            {items.map((item, index) => (
                <div
                    key={index}
                    className={cn(
                        "group relative p-6 rounded-xl overflow-hidden transition-all duration-300",
                        "border border-blue-200/50 dark:border-blue-500/20 bg-white dark:bg-gray-800",
                        "hover:shadow-[0_8px_32px_rgba(37,99,235,0.1)] dark:hover:shadow-[0_8px_32px_rgba(37,99,235,0.2)]",
                        "hover:-translate-y-1 will-change-transform hover:border-blue-300 dark:hover:border-blue-400",
                        item.colSpan || "col-span-1",
                        item.colSpan === 2 ? "md:col-span-2" : "",
                        {
                            "shadow-[0_8px_32px_rgba(37,99,235,0.1)] -translate-y-1 border-blue-300 dark:border-blue-400":
                                item.hasPersistentHover,
                            "dark:shadow-[0_8px_32px_rgba(37,99,235,0.2)]":
                                item.hasPersistentHover,
                        }
                    )}
                >
                    <div
                        className={`absolute inset-0 ${
                            item.hasPersistentHover
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                        } transition-opacity duration-300`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-cyan-50/30 dark:from-blue-900/20 dark:via-transparent dark:to-cyan-900/20" />
                    </div>

                    <div className="relative flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                {item.icon}
                            </div>
                            <span
                                className={cn(
                                    "text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm",
                                    "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
                                    "transition-colors duration-300 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/60"
                                )}
                            >
                                {item.status || "Disponible"}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-bold text-gray-900 dark:text-white tracking-tight text-lg">
                                {item.title}
                                {item.meta && (
                                    <span className="ml-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
                                        {item.meta}
                                    </span>
                                )}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                                {item.description}
                            </p>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center space-x-2 text-xs">
                                {item.tags?.map((tag, i) => (
                                    <span
                                        key={i}
                                        className="px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium transition-all duration-200 hover:bg-blue-100 dark:hover:bg-blue-800/40"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <span className="text-sm text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                                {item.cta || "Conocer más →"}
                            </span>
                        </div>
                    </div>

                    <div
                        className={`absolute inset-0 -z-10 rounded-xl p-px bg-gradient-to-br from-blue-200/50 via-transparent to-cyan-200/50 dark:from-blue-500/30 dark:via-transparent dark:to-cyan-500/30 ${
                            item.hasPersistentHover
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                        } transition-opacity duration-300`}
                    />
                </div>
            ))}
        </div>
    );
}

export { BentoGrid, type BentoItem }
