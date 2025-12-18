import type { Account, AccountType } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

import { AccountTable } from "./AccountTable";

export interface AccountTypeSectionProps {
  type: AccountType;
  accounts: Account[];
  isExpanded: boolean;
  onToggleExpanded: () => void;
  expandedParents: Set<string>;
  onToggleParentExpanded: (accountId: string) => void;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
  accountsWithTransactions: Set<string>;
  searchTerm: string;
}

export function AccountTypeSection({
  type,
  accounts,
  isExpanded,
  onToggleExpanded,
  expandedParents,
  onToggleParentExpanded,
  onEdit,
  onDelete,
  accountsWithTransactions,
  searchTerm,
}: AccountTypeSectionProps) {
  return (
    <div className="rounded-md border">
      <Button
        type="button"
        variant="ghost"
        className="flex h-auto w-full items-center justify-start gap-2 rounded-none border-b bg-muted/40 px-3 py-2 text-sm font-medium hover:bg-muted/50"
        onClick={onToggleExpanded}
      >
        {isExpanded ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        <span>{type}</span>
      </Button>

      {isExpanded ? (
        <AccountTable
          accounts={accounts}
          expandedParents={expandedParents}
          onToggleParentExpanded={onToggleParentExpanded}
          onEdit={onEdit}
          onDelete={onDelete}
          accountsWithTransactions={accountsWithTransactions}
          searchTerm={searchTerm}
        />
      ) : null}
    </div>
  );
}


