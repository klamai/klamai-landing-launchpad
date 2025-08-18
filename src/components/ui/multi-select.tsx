"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";

const multiSelectVariants = cva(
    "flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    {
        variants: {
            variant: {
                default:
                    "h-10 w-full",
                compact: "h-8",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

interface MultiSelectProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof multiSelectVariants> {
    options: {
        label: string;
        value: string;
    }[];
    onValueChange: (value: string[]) => void;
    defaultValue?: string[];
    placeholder?: string;
    maxCount?: number;
}

const MultiSelect = React.forwardRef<
    HTMLDivElement,
    MultiSelectProps
>(
    (
        {
            className,
            variant,
            options,
            onValueChange,
            defaultValue = [],
            placeholder = "Select options",
            maxCount = 3,
            ...props
        },
        ref
    ) => {
        const [inputValue, setInputValue] = React.useState("");
        const [open, setOpen] = React.useState(false);
        const [selected, setSelected] = React.useState<string[]>(defaultValue);

        const handleSelect = (value: string) => {
            if (!selected.includes(value)) {
                const newSelected = [...selected, value];
                setSelected(newSelected);
                onValueChange(newSelected);
            }
        };

        const handleDeselect = (value: string) => {
            const newSelected = selected.filter((v) => v !== value);
            setSelected(newSelected);
            onValueChange(newSelected);
        };

        return (
            <CommandPrimitive>
                <div
                    ref={ref}
                    onClick={() => setOpen(true)}
                    className="w-full relative"
                >
                    <div className={cn(multiSelectVariants({ variant, className }))}>
                        <div className="flex gap-1 flex-wrap">
                            {selected.map((value) => {
                                const label = options.find(
                                    (option) => option.value === value
                                )?.label;
                                return (
                                    <Badge key={value} variant="secondary">
                                        {label}
                                        <button
                                            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeselect(value);
                                            }}
                                        >
                                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                        </button>
                                    </Badge>
                                );
                            })}
                            {selected.length === 0 && <span>{placeholder}</span>}
                        </div>
                    </div>
                </div>
                {open && (
                    <div className="absolute w-full z-10 top-0 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                        <CommandList>
                            <CommandGroup>
                                {options.map((option) => (
                                    <CommandItem
                                        key={option.value}
                                        onSelect={() => handleSelect(option.value)}
                                        style={{
                                            paddingLeft: "8px",
                                            cursor: "pointer"
                                        }}
                                        className="cursor-pointer"
                                    >
                                        {option.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </div>
                )}
            </CommandPrimitive>
        );
    }
);

MultiSelect.displayName = "MultiSelect";

export { MultiSelect };
