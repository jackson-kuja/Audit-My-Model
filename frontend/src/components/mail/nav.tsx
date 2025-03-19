"use client"

import * as React from "react";
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "../../lib/utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";

interface NavProps {
  isCollapsed: boolean;
  links: {
    title: string;
    label?: string;
    icon: LucideIcon;
    variant: "default" | "ghost";
  }[];
}

export function Nav({ links, isCollapsed }: NavProps) {
  return (
    <ScrollArea className="h-full py-2">
      <div className="flex flex-col gap-2 px-2">
        {links.map((link, index) => (
          <div key={index} className="relative">
            <Button
              variant={link.variant}
              className={cn(
                "w-full justify-start",
                isCollapsed ? "justify-center" : "px-2"
              )}
              onClick={() => {
                // Handle navigation or other actions
              }}
            >
              <link.icon className={cn("h-5 w-5", isCollapsed ? "" : "mr-2")} />
              {!isCollapsed && (
                <span className="flex-1 text-sm font-medium">
                  {link.title}
                </span>
              )}
              {!isCollapsed && link.label && (
                <Badge variant="secondary" className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                  {link.label}
                </Badge>
              )}
            </Button>
            {isCollapsed && link.label && (
              <Badge 
                variant="secondary" 
                className="absolute right-0 top-0 -mr-2 -mt-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px]"
              >
                {link.label}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
} 