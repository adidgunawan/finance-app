import { Fragment } from "react";

import type { Account } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

import { HighlightText } from "@/components/Text/HighlightText";
import { Button } from "@/components/ui/button";
import { Minus, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface AccountTableProps {
  accounts: Account[];
  expandedParents: Set<string>;
  onToggleParentExpanded: (accountId: string) => void;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
  accountsWithTransactions: Set<string>;
  searchTerm: string;
}

export function AccountTable({
  accounts,
  expandedParents,
  onToggleParentExpanded,
  onEdit,
  onDelete,
  accountsWithTransactions,
  searchTerm,
}: AccountTableProps) {
  const parentAccounts = accounts.filter((acc) => !acc.parent_id);
  const getChildAccounts = (parentId: string) =>
    accounts.filter((acc) => acc.parent_id === parentId);

  const renderAccountRow = (account: Account, level: number = 0) => {
    const children = getChildAccounts(account.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedParents.has(account.id);
    const indent = level * 24;
    const isParent = level === 0;
    const hasLinkedTransactions = accountsWithTransactions.has(account.id);

    return (
      <Fragment key={account.id}>
        <tr className={cn("bg-background", isParent && "font-medium")}>
          <td className="py-2" style={{ paddingLeft: `${12 + indent}px` }}>
            {hasChildren && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mr-1 h-6 w-6"
                onClick={() => onToggleParentExpanded(account.id)}
              >
                {isExpanded ? (
                  <Minus className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            )}
            {!hasChildren && <span className="inline-block w-7" />}
            <span className={cn(isParent && "font-medium")}>
              <HighlightText
                text={account.account_number.toString()}
                highlight={searchTerm}
              />
            </span>
          </td>
          <td className="sticky left-0 z-10 border-r bg-background px-3 py-2">
            <span className={cn(isParent && "font-medium")}>
              <HighlightText text={account.name} highlight={searchTerm} />
            </span>
          </td>
          <td className={cn("px-3 py-2 text-right", isParent && "font-medium")}>
            {account.balance !== undefined
              ? formatCurrency(account.balance, "IDR")
              : "-"}
          </td>
          <td className="px-3 py-2">
            <div className="flex justify-end gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label="Edit account"
                    onClick={() => onEdit(account)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="destructive"
                    aria-label="Delete account"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(account);
                    }}
                    disabled={hasLinkedTransactions}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {hasLinkedTransactions ? "Cannot delete (linked)" : "Delete"}
                </TooltipContent>
              </Tooltip>
            </div>
          </td>
        </tr>
        {hasChildren && isExpanded && (
          <>
            {children
              .sort((a, b) => a.account_number - b.account_number)
              .map((child) => renderAccountRow(child, level + 1))}
          </>
        )}
      </Fragment>
    );
  };

  return (
    <TooltipProvider>
      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-[780px] text-sm">
          <thead className="text-muted-foreground">
            <tr className="sticky top-0 z-20 border-b bg-muted/40">
              <th className="w-[140px] px-3 py-2 text-left font-medium">
                Number
              </th>
              <th className="sticky left-0 z-30 border-r bg-muted/40 px-3 py-2 text-left font-medium">
                Account Name
              </th>
              <th className="w-[160px] px-3 py-2 text-right font-medium">
                Balance
              </th>
              <th className="w-[140px] px-3 py-2 text-right font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="[&_tr:hover]:bg-muted/30">
            {parentAccounts
              .sort((a, b) => a.account_number - b.account_number)
              .map((parent) => renderAccountRow(parent, 0))}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
}


