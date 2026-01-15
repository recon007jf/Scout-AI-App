"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Mic, FileText, LinkIcon, Sparkles, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Note {
  id: string
  type: "quick" | "structured" | "voice"
  content: string
  contactName?: string
  contactId?: string
  contactAvatar?: string
  date: string
  tags: string[]
  linkedTo?: { type: string; label: string }
  aiGenerated?: boolean
}

export function NotesView() {
  const [notes, setNotes] = useState<Note[]>([])
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [noteType, setNoteType] = useState<"quick" | "structured" | "voice">("quick")
  const [newNoteContent, setNewNoteContent] = useState("")
  const [selectedContact, setSelectedContact] = useState("")
  const [noteTags, setNoteTags] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [filter, setFilter] = useState<"all" | "quick" | "structured" | "voice">("all")
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadNotes = async () => {
      // Direct Mock Mode Check - Silences console errors in dev
      if (process.env.NODE_ENV === "development") {
        try {
          const { mockNotes } = await import("@/lib/api/mock/notes")
          setNotes(mockNotes)
        } catch (error) {
          console.error("[v0] Failed to load mock notes:", error)
        } finally {
          setLoading(false)
        }
        return
      }

      try {
        const response = await fetch("/api/scout/notes")

        if (!response.ok) {
          throw new Error("API failed")
        }

        const data = await response.json()

        if (data.notes && data.notes.length > 0) {
          setNotes(data.notes)
        } else {
          // Fallback if API returns empty structure usage
          setNotes([])
        }
        setLoading(false)
      } catch (error) {
        console.error("[v0] Failed to load notes:", error)
        setLoading(false)
      }
    }

    loadNotes()
  }, [])

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note)
    setIsAddingNote(false)
    setIsEditingNote(false)
  }

  const handleEditNote = () => {
    if (selectedNote) {
      setNoteType(selectedNote.type)
      setNewNoteContent(selectedNote.content)
      setSelectedContact(selectedNote.contactName || "")
      setNoteTags(selectedNote.tags.join(", "))
      setIsEditingNote(true)
    }
  }

  const handleUpdateNote = () => {
    if (!selectedNote || !newNoteContent.trim()) return

    const updatedNote: Note = {
      ...selectedNote,
      type: noteType,
      content: newNoteContent,
      contactName: selectedContact || undefined,
      tags: noteTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    }

    setNotes(notes.map((note) => (note.id === selectedNote.id ? updatedNote : note)))
    setSelectedNote(updatedNote)
    setIsEditingNote(false)
    setNewNoteContent("")
    setSelectedContact("")
    setNoteTags("")
  }

  const handleDeleteNote = () => {
    if (!selectedNote) return
    if (confirm("Are you sure you want to delete this note?")) {
      setNotes(notes.filter((note) => note.id !== selectedNote.id))
      setSelectedNote(null)
    }
  }

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return

    try {
      const dossierId = selectedDossierId || "placeholder-dossier-id"

      let savedNote: any

      if (process.env.NODE_ENV === "development") {
        console.log("[v0] Mock Mode: Saving note locally")
        await new Promise(resolve => setTimeout(resolve, 500))
        savedNote = {
          note_id: `mock_note_${Date.now()}`,
          content: newNoteContent,
          created_at: new Date().toISOString()
        }
      } else {
        const response = await fetch("/api/scout/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dossier_id: dossierId,
            content: newNoteContent,
            note_type: noteType,
            tags: noteTags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to save note")
        }

        savedNote = await response.json()
      }

      console.log("[v0] Note saved:", savedNote)

      const newNote: Note = {
        id: savedNote.note_id || Date.now().toString(),
        type: noteType,
        content: newNoteContent,
        contactName: selectedContact || undefined,
        date: new Date().toISOString(),
        tags: noteTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      }

      setNotes([newNote, ...notes])
      setNewNoteContent("")
      setSelectedContact("")
      setNoteTags("")
      setIsAddingNote(false)
    } catch (error) {
      console.error("[v0] Error saving note:", error)
      alert("Failed to save note. Please try again.")
    }
  }

  const handleVoiceRecording = () => {
    setIsRecording(!isRecording)
    if (isRecording) {
      setNewNoteContent("[Voice recording will be transcribed by AI when backend is connected]")
    }
  }

  const filteredNotes = filter === "all" ? notes : notes.filter((note) => note.type === filter)

  const getNoteTypeIcon = (type: string) => {
    switch (type) {
      case "quick":
        return <FileText className="w-4 h-4" />
      case "structured":
        return <FileText className="w-4 h-4" />
      case "voice":
        return <Mic className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case "quick":
        return "text-blue-400"
      case "structured":
        return "text-purple-400"
      case "voice":
        return "text-green-400"
      default:
        return "text-gray-400"
    }
  }

  return (
    <div className="flex h-full">
      {/* Notes List */}
      <div className="w-1/2 border-r border-border overflow-y-auto">
        <div className="p-6 border-b border-border bg-card/40 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Notes</h2>
              <p className="text-sm text-muted-foreground">Capture insights and observations</p>
            </div>
            <Button onClick={() => setIsAddingNote(!isAddingNote)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Note
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
              All Notes
            </Button>
            <Button variant={filter === "quick" ? "default" : "outline"} size="sm" onClick={() => setFilter("quick")}>
              Quick
            </Button>
            <Button
              variant={filter === "structured" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("structured")}
            >
              Structured
            </Button>
            <Button variant={filter === "voice" ? "default" : "outline"} size="sm" onClick={() => setFilter("voice")}>
              Voice
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              className={cn(
                "p-4 bg-card/60 hover:bg-card/80 transition-colors cursor-pointer",
                selectedNote?.id === note.id && "ring-2 ring-primary bg-card/80",
              )}
              onClick={() => handleSelectNote(note)}
            >
              <div className="flex items-start gap-3 mb-2">
                <div className={cn("p-2 rounded-lg bg-card/50", getNoteTypeColor(note.type))}>
                  {getNoteTypeIcon(note.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] h-5">
                      {note.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(note.date).toLocaleDateString()} at{" "}
                      {new Date(note.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {note.aiGenerated && (
                      <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-white line-clamp-2 mb-2">{note.content}</p>
                  {note.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-2">
                      {note.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-[10px] h-5">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {note.contactName && (
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={note.contactAvatar || "/placeholder.svg"} />
                        <AvatarFallback>{note.contactName[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-foreground font-medium">{note.contactName}</span>
                    </div>
                  )}
                  {note.linkedTo && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <LinkIcon className="w-3 h-3" />
                      <span>
                        {note.linkedTo.type}: {note.linkedTo.label}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Note Entry / Detail Panel */}
      <div className="flex-1 overflow-y-auto p-6">
        {isAddingNote || isEditingNote ? (
          <Card className="p-6 bg-card/60">
            <h3 className="text-xl font-semibold text-foreground mb-4">
              {isEditingNote ? "Edit Note" : "Add New Note"}
            </h3>

            <div className="mb-4">
              <label className="text-sm text-muted-foreground mb-2 block">Note Type</label>
              <div className="flex gap-2">
                <Button
                  variant={noteType === "quick" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNoteType("quick")}
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Quick Capture
                </Button>
                <Button
                  variant={noteType === "structured" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNoteType("structured")}
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Structured
                </Button>
                <Button
                  variant={noteType === "voice" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNoteType("voice")}
                  className="gap-2"
                >
                  <Mic className="w-4 h-4" />
                  Voice
                </Button>
              </div>
            </div>

            {noteType === "voice" && (
              <div className="mb-4 p-4 bg-card/40 rounded-lg border border-border">
                <Button
                  onClick={handleVoiceRecording}
                  variant={isRecording ? "destructive" : "default"}
                  className="w-full gap-2"
                >
                  <Mic className="w-4 h-4" />
                  {isRecording ? "Stop Recording" : "Start Recording"}
                </Button>
                {isRecording && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Recording... (AI transcription will be generated when backend is connected)
                  </p>
                )}
              </div>
            )}

            <div className="mb-4">
              <label className="text-sm text-muted-foreground mb-2 block">
                {noteType === "voice" ? "Transcription" : "Note Content"}
              </label>
              <Textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder={noteType === "quick" ? "Quick thought or observation..." : "Detailed notes..."}
                className="min-h-[150px] resize-none bg-card/40"
              />
            </div>

            {noteType === "structured" && (
              <div className="space-y-4 mb-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Link to Contact</label>
                  <Select value={selectedContact} onValueChange={setSelectedContact}>
                    <SelectTrigger className="bg-card/40">
                      <SelectValue placeholder="Select a contact..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sarah Mitchell">Sarah Mitchell</SelectItem>
                      <SelectItem value="David Thompson">David Thompson</SelectItem>
                      <SelectItem value="Jennifer Park">Jennifer Park</SelectItem>
                      <SelectItem value="Robert Sullivan">Robert Sullivan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="text-sm text-muted-foreground mb-2 block">Tags (comma separated)</label>
              <Input
                value={noteTags}
                onChange={(e) => setNoteTags(e.target.value)}
                placeholder="opportunity, follow-up, urgent"
                className="bg-card/40"
              />
            </div>

            <div className="mb-6 p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">AI Integration:</strong> When backend is connected, notes will be
                  analyzed by Helix to identify potential signals, generate follow-up actions, and surface relevant
                  insights.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={isEditingNote ? handleUpdateNote : handleAddNote} className="flex-1">
                {isEditingNote ? "Update Note" : "Save Note"}
              </Button>
              <Button
                onClick={() => {
                  setIsAddingNote(false)
                  setIsEditingNote(false)
                  setNewNoteContent("")
                  setSelectedContact("")
                  setNoteTags("")
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </Card>
        ) : selectedNote ? (
          <Card className="p-6 bg-card/60">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-card/50", getNoteTypeColor(selectedNote.type))}>
                  {getNoteTypeIcon(selectedNote.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {selectedNote.type}
                    </Badge>
                    {selectedNote.aiGenerated && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(selectedNote.date).toLocaleDateString()} at{" "}
                    {new Date(selectedNote.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleEditNote} className="gap-2 bg-transparent">
                  <Pencil className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteNote}
                  className="gap-2 text-destructive bg-transparent"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Content</h3>
              <p className="text-sm text-foreground whitespace-pre-wrap">{selectedNote.content}</p>
            </div>

            {selectedNote.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Tags</h3>
                <div className="flex gap-2 flex-wrap">
                  {selectedNote.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {selectedNote.contactName && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Linked Contact</h3>
                <div className="flex items-center gap-3 p-3 bg-card/40 rounded-lg border border-border">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={selectedNote.contactAvatar || "/placeholder.svg"} />
                    <AvatarFallback>{selectedNote.contactName[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-foreground font-medium">{selectedNote.contactName}</span>
                </div>
              </div>
            )}

            {selectedNote.linkedTo && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Linked Items</h3>
                <div className="flex items-center gap-2 p-3 bg-card/40 rounded-lg border border-border">
                  <LinkIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    {selectedNote.linkedTo.type}: {selectedNote.linkedTo.label}
                  </span>
                </div>
              </div>
            )}
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Select or Create a Note</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Click on a note from the list to view details, or create a new note to capture insights from your
              conversations and research.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
