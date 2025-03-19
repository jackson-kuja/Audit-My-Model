import { ComponentProps } from "react";
import { formatDistanceToNow } from "date-fns";

import { cn } from "../../lib/utils";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { MailItem } from "./mail-dashboard";

interface MailListProps {
  items: MailItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function MailList({ items, selectedId, onSelect }: MailListProps) {
  return (
    <ScrollArea className="h-screen">
      <div className="flex flex-col gap-2 p-4 pt-0">
        {items.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No audits found</p>
          </div>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              className={cn(
                "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
                selectedId === item.id && "bg-muted"
              )}
              onClick={() => onSelect(item.id)}
            >
              <div className="flex w-full flex-col gap-1">
                <div className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">{item.name}</div>
                    {!item.read && (
                      <span className="flex h-2 w-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "ml-auto text-xs",
                      selectedId === item.id
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {formatDistanceToNow(new Date(item.date), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
                <div className="text-xs font-medium">{item.subject}</div>
              </div>
              <div className="line-clamp-2 text-xs text-muted-foreground">
                {item.text.substring(0, 300)}
              </div>
              {item.labels.length ? (
                <div className="flex items-center gap-2">
                  {item.labels.map((label) => (
                    <Badge key={label} variant={getBadgeVariantFromLabel(label)}>
                      {label}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </button>
          ))
        )}
      </div>
    </ScrollArea>
  );
}

function getBadgeVariantFromLabel(
  label: string
): ComponentProps<typeof Badge>["variant"] {
  if (["completed"].includes(label.toLowerCase())) {
    return "default";
  }

  if (["failed", "error"].includes(label.toLowerCase())) {
    return "destructive";
  }

  if (["in_progress", "pending"].includes(label.toLowerCase())) {
    return "secondary";
  }

  if (["excel", "csv", "json"].includes(label.toLowerCase())) {
    return "outline";
  }

  return "default";
} 