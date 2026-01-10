"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface PauseDurationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDuration: string
  onDurationChange: (duration: string) => void
  onConfirm: () => void
}

export function PauseDurationModal({
  open,
  onOpenChange,
  selectedDuration,
  onDurationChange,
  onConfirm,
}: PauseDurationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pause Outreach</DialogTitle>
          <DialogDescription>How long should outreach be paused?</DialogDescription>
        </DialogHeader>

        <RadioGroup value={selectedDuration} onValueChange={onDurationChange} className="space-y-3">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="manual" id="manual" />
            <Label htmlFor="manual" className="font-normal cursor-pointer">
              Manual (until I resume)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="1h" id="1h" />
            <Label htmlFor="1h" className="font-normal cursor-pointer">
              1 hour
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="2h" id="2h" />
            <Label htmlFor="2h" className="font-normal cursor-pointer">
              2 hours
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="3h" id="3h" />
            <Label htmlFor="3h" className="font-normal cursor-pointer">
              3 hours
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="1d" id="1d" />
            <Label htmlFor="1d" className="font-normal cursor-pointer">
              1 day
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="2d" id="2d" />
            <Label htmlFor="2d" className="font-normal cursor-pointer">
              2 days
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="3d" id="3d" />
            <Label htmlFor="3d" className="font-normal cursor-pointer">
              3 days
            </Label>
          </div>
        </RadioGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} className="bg-orange-600 hover:bg-orange-700 text-white">
            Pause Outreach
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
