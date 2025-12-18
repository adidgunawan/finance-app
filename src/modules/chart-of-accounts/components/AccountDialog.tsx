import type { Account, AccountType } from "@/lib/types";

import { AccountForm } from "../AccountForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type AccountFormData = {
  name: string;
  type: AccountType;
  parent_id: string | null;
  initial_balance?: number;
  initial_balance_date?: string | null;
  is_wallet?: boolean;
  bank_id?: string | null;
};

interface AccountDialogProps {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  account?: Account;
  onSubmit: (data: AccountFormData) => Promise<void>;
  onCancel: () => void;
}

export function AccountDialog({
  mode,
  open,
  onOpenChange,
  accounts,
  account,
  onSubmit,
  onCancel,
}: AccountDialogProps) {
  const title = mode === "edit" ? "Edit Account" : "Add Account";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <AccountForm
          account={mode === "edit" ? account : undefined}
          accounts={accounts}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      </DialogContent>
    </Dialog>
  );
}


