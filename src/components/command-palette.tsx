import * as React from "react"
import { useNavigate } from "react-router-dom"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  FiBarChart2,
  FiCreditCard,
  FiFileText,
  FiHome,
  FiLogOut,
  FiPlus,
  FiRefreshCw,
  FiRepeat,
  FiUsers,
} from "react-icons/fi"
import { useAuth } from "@/contexts/AuthContext"

type CommandPaletteProps = {
  open: boolean
  setOpen: (open: boolean) => void
}

export function CommandPalette({ open, setOpen }: CommandPaletteProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const run = React.useCallback(
    (fn: () => void) => {
      setOpen(false)
      // wait for dialog close animation
      window.setTimeout(fn, 0)
    },
    [setOpen]
  )

  const handleLogout = React.useCallback(() => {
    run(async () => {
      try {
        await logout()
        window.location.href = "/login"
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e)
      }
    })
  }, [logout, run])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => run(() => navigate("/home"))}>
            <FiHome />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => navigate("/chart-of-accounts"))}
          >
            <FiBarChart2 />
            <span>Chart of Accounts</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate("/transactions"))}>
            <FiRepeat />
            <span>Transactions</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate("/contacts"))}>
            <FiUsers />
            <span>Contacts</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate("/reports"))}>
            <FiFileText />
            <span>Reports</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate("/reconciliation"))}>
            <FiRefreshCw />
            <span>Reconciliation</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate("/banks"))}>
            <FiCreditCard />
            <span>Banks</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick actions">
          <CommandItem
            onSelect={() => run(() => navigate("/transactions/income/new"))}
          >
            <FiPlus />
            <span>New Income</span>
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => navigate("/transactions/expense/new"))}
          >
            <FiPlus />
            <span>New Expense</span>
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => navigate("/transactions/transfer/new"))}
          >
            <FiPlus />
            <span>New Transfer</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Session">
          <CommandItem onSelect={handleLogout}>
            <FiLogOut />
            <span>Log out</span>
            <CommandShortcut>↵</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
