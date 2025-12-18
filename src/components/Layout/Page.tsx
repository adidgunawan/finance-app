import * as React from "react";

import { cn } from "@/lib/utils";

export interface PageProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Page({ className, ...props }: PageProps) {
  return (
    <div
      className={cn("w-full min-w-0 space-y-6", className)}
      {...props}
    />
  );
}


