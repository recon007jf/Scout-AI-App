"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, Mic, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface ContactNote {
  id: string
  content: string
  date: string
  type: "quick" | "voice"
  tags: string[]
}

interface ContactNotesProps {
  contactName: string
  contactId: string
  compact?: boolean
}

export function ContactNotes({ contactName, contactId, compact = false }: ContactNotesProps) {
  const [notes, setNotes] = useState<ContactNote[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [newNote, setNewNote] = useState("")
  const [noteType, setNoteType] = useState<"quick" | "voice">("quick")
  const [isRecording, setIsRecording] = useState(false)

  const handleAddNote = () => {
    if (!newNote.trim()) return

    const note: ContactNote = {
      id: Date.now().toString(),
      content: newNote,
      date: new Date().toISOString(),
      type: noteType,
      tags: [],
    }

    setNotes([note, ...notes])
    setNewNote("")
    setIsAdding(false)
  }

  if (compact) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-400" />
            <h3 className="font-medium text-foreground text-sm">Contact Notes</h3>
            <Badge variant="secondary" className="text-xs">
              {notes.length}
            </Badge>
          </div>
          <Button size="sm" variant="outline" onClick={() => setIsAdding(!isAdding)} className="gap-2 bg-transparent">
            <Plus className="w-3 h-3" />
            Add Note
          </Button>
        </div>

        {isAdding && (
          <div className="mb-4 p-3 bg-card/40 rounded-lg border border-border space-y-3">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={noteType === "quick" ? "default" : "outline"}
                onClick={() => setNoteType("quick")}
                className={noteType === "quick" ? "" : "bg-transparent"}
              >
                <FileText className="w-3 h-3 mr-1" />
                Quick
              </Button>
              <Button
                size="sm"
                variant={noteType === "voice" ? "default" : "outline"}
                onClick={() => {
                  setNoteType("voice")
                  setIsRecording(!isRecording)
                }}
                className={noteType === "voice" ? "" : "bg-transparent"}
              >
                <Mic className="w-3 h-3 mr-1" />
                Voice
              </Button>
            </div>
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder={`Add a note about ${contactName}...`}
              className="min-h-[80px] bg-card/40 text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddNote} className="flex-1">
                Save Note
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsAdding(false)} className="bg-transparent">
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2 max-h-[240px] overflow-y-auto">
          {notes.map((note) => (
            <div key={note.id} className="p-3 bg-card/40 rounded-lg border border-border/50">
              <div className="flex items-start gap-2 mb-1">
                <div
                  className={cn(
                    "p-1 rounded",
                    note.type === "voice" ? "bg-green-500/10 text-green-400" : "bg-orange-500/10 text-orange-400",
                  )}
                >
                  {note.type === "voice" ? <Mic className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(note.date).toLocaleDateString()} at{" "}
                    {new Date(note.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {note.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {note.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-[10px] h-4">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {notes.length === 0 && !isAdding && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No notes yet. Add a note to capture insights about {contactName}.
            </p>
          )}
        </div>

        <div className="mt-3 p-2 bg-orange-500/5 border border-orange-500/10 rounded text-xs text-muted-foreground flex items-start gap-2">
          <Sparkles className="w-3 h-3 text-orange-400 flex-shrink-0 mt-0.5" />
          <span>Notes are analyzed by Helix to generate signals and insights (when backend is connected)</span>
        </div>
      </div>
    )
  }

  return (
    <Card className="p-4 bg-card/60">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Notes</h3>
          <Badge variant="secondary" className="text-xs">
            {notes.length}
          </Badge>
        </div>
        <Button size="sm" variant="outline" onClick={() => setIsAdding(!isAdding)} className="gap-2">
          <Plus className="w-3 h-3" />
          Add Note
        </Button>
      </div>

      {isAdding && (
        <div className="mb-4 p-3 bg-card/40 rounded-lg border border-border space-y-3">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={noteType === "quick" ? "default" : "outline"}
              onClick={() => setNoteType("quick")}
            >
              <FileText className="w-3 h-3 mr-1" />
              Quick
            </Button>
            <Button
              size="sm"
              variant={noteType === "voice" ? "default" : "outline"}
              onClick={() => {
                setNoteType("voice")
                setIsRecording(!isRecording)
              }}
            >
              <Mic className="w-3 h-3 mr-1" />
              Voice
            </Button>
          </div>
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note about this contact..."
            className="min-h-[80px] bg-card/40 text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddNote} className="flex-1">
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {notes.map((note) => (
          <div key={note.id} className="p-3 bg-card/40 rounded-lg border border-border/50">
            <div className="flex items-start gap-2 mb-1">
              <div
                className={cn(
                  "p-1 rounded",
                  note.type === "voice" ? "bg-green-500/10 text-green-400" : "bg-blue-500/10 text-blue-400",
                )}
              >
                {note.type === "voice" ? <Mic className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white">{note.content}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(note.date).toLocaleDateString()} at{" "}
                  {new Date(note.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
                {note.tags.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {note.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-[9px] h-4">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {notes.length === 0 && !isAdding && (
          <p className="text-xs text-muted-foreground text-center py-4">
            No notes yet. Add a note to capture insights about {contactName}.
          </p>
        )}
      </div>

      <div className="mt-3 p-2 bg-primary/5 border border-primary/10 rounded text-[10px] text-muted-foreground flex items-start gap-1">
        <Sparkles className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
        <span>Notes are analyzed by Helix to generate signals and insights (when backend is connected)</span>
      </div>
    </Card>
  )
}
