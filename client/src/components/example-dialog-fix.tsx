import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// ✅ CORRECT: Proper Dialog Usage Template
export function ExampleDialogFix() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Example Dialog</DialogTitle>
          <DialogDescription>
            This is how dialogs should be properly structured.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Your dialog content here */}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => setOpen(false)}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ❌ COMMON MISTAKES TO AVOID:
// 1. Don't use DialogContent outside of Dialog
// 2. Don't conditionally render Dialog root based on complex state
// 3. Don't nest Dialog components improperly
// 4. Don't use DialogPortal directly in your components