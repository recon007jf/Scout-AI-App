"use client"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface ThresholdWarningModalProps {
  open: boolean
  onResume: () => void
  onKeepPaused: () => void
}

export function ThresholdWarningModal({ open, onResume, onKeepPaused }: ThresholdWarningModalProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <AlertDialogTitle>Outreach Still Paused</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Outreach has been paused for 2 hours. Do you want to continue pausing?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button onClick={onKeepPaused} variant="outline">
            Keep Paused
          </Button>
          <Button onClick={onResume} className="bg-green-600 hover:bg-green-700 text-white">
            Resume Outreach
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
