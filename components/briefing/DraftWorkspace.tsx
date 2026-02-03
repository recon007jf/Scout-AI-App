/**
 * COMPONENT: DraftWorkspace
 * 
 * Purpose: Draft display + editing + regeneration UI
 * 
 * COMPOSITE EMAIL MODEL:
 * - Andrew writes plain TEXT (no HTML knowledge required)
 * - Marketing provides pre-made RICH ASSET (HTML block)
 * - System AUTO-COMBINES: text converted to HTML + rich asset below
 * 
 * View Modes:
 * - Preview: Combined view (text + rich asset rendered together)
 * - Text: Andrew's editable message
 * - Asset: View the attached marketing HTML block (read-only)
 */

"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Loader2,
    Sparkles,
    Pencil,
    Check,
    X,
    MessageSquare,
    Eye,
    FileText,
    ImageIcon,
    Upload,
    Trash2,
    Link2,
    ClipboardPaste,
} from "lucide-react"

interface Draft {
    subject: string
    body: string
    richAssetHtml?: string  // Pre-made marketing HTML block
}

interface DraftWorkspaceProps {
    draft: Draft | null
    isGenerating: boolean
    onSave: (subject: string, body: string) => Promise<void>
    onRegenerate: () => Promise<void>
    onRegenerateWithFeedback: (comments: string) => Promise<void>
}

type ViewMode = "preview" | "text" | "asset"

/**
 * Convert plain text to basic HTML
 * Preserves line breaks while wrapping in styled paragraphs
 */
function textToHtml(text: string): string {
    if (!text) return ""
    const paragraphs = text.split(/\n\n+/)
    return paragraphs
        .map(p => {
            const lines = p.split(/\n/)
            return `<p style="margin: 0 0 16px 0; line-height: 1.6;">${lines.join('<br/>')}</p>`
        })
        .join('')
}

/**
 * Generate combined HTML: Andrew's text + Rich Asset below
 */
function generateCombinedHtml(body: string, richAssetHtml?: string): string {
    const textHtml = textToHtml(body)

    let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #333;">
    <div style="max-width: 600px; margin: 0 auto;">
        <!-- Andrew's Message -->
        <div style="margin-bottom: 24px;">
            ${textHtml}
        </div>
`

    if (richAssetHtml) {
        html += `
        <!-- Rich Asset -->
        <div style="margin-top: 24px; border-top: 1px solid #eee; padding-top: 24px;">
            ${richAssetHtml}
        </div>
`
    }

    html += `
    </div>
</body>
</html>`

    return html
}

export function DraftWorkspace({
    draft,
    isGenerating,
    onSave,
    onRegenerate,
    onRegenerateWithFeedback,
    onAssetChange,
}: DraftWorkspaceProps & { onAssetChange?: (html: string | undefined) => void }) {
    // LOCAL editing state
    const [isEditing, setIsEditing] = useState(false)
    const [editedSubject, setEditedSubject] = useState("")
    const [editedBody, setEditedBody] = useState("")
    const [localRichAsset, setLocalRichAsset] = useState<string | undefined>(undefined)
    const [showGuidedInput, setShowGuidedInput] = useState(false)
    const [guidedComments, setGuidedComments] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [isDragOver, setIsDragOver] = useState(false)

    // Asset import options
    const [importMode, setImportMode] = useState<"file" | "url" | "paste">("file")
    const [urlInput, setUrlInput] = useState("")
    const [pasteInput, setPasteInput] = useState("")
    const [isLoadingUrl, setIsLoadingUrl] = useState(false)

    // View Mode: preview (combined), text (Andrew's message), asset (marketing block)
    const [viewMode, setViewMode] = useState<ViewMode>("preview")

    // Sync local state when draft changes (new selection)
    useEffect(() => {
        if (draft && !isEditing) {
            setEditedSubject(draft.subject)
            setEditedBody(draft.body)
            setLocalRichAsset(draft.richAssetHtml)
            // Default to preview
            setViewMode("preview")
        }
    }, [draft, isEditing])

    const handleStartEdit = () => {
        if (draft) {
            setEditedSubject(draft.subject)
            setEditedBody(draft.body)
        }
        setIsEditing(true)
        setShowGuidedInput(false)
        setViewMode("text") // Switch to text mode for editing
    }

    const handleSaveEdit = async () => {
        setIsSaving(true)
        try {
            await onSave(editedSubject, editedBody)
            setIsEditing(false)
            setViewMode("preview") // Return to preview after save
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancelEdit = () => {
        setIsEditing(false)
        setShowGuidedInput(false)
        setGuidedComments("")
        // Restore from draft
        if (draft) {
            setEditedSubject(draft.subject)
            setEditedBody(draft.body)
        }
        setViewMode("preview")
    }

    const handleRegenerateWithFeedback = async () => {
        if (!guidedComments.trim()) return
        await onRegenerateWithFeedback(guidedComments)
        setGuidedComments("")
        setShowGuidedInput(false)
    }

    // File upload handlers
    const handleFileUpload = (file: File) => {
        const reader = new FileReader()

        if (file.type === 'text/html' || file.name.endsWith('.html')) {
            // Read HTML file as text
            reader.onload = (e) => {
                const html = e.target?.result as string
                setLocalRichAsset(html)
                onAssetChange?.(html)
            }
            reader.readAsText(file)
        } else if (file.type.startsWith('image/')) {
            // Convert image to data URL and wrap in img tag
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string
                const html = `<div style="text-align: center;"><img src="${dataUrl}" style="max-width: 100%; height: auto; border-radius: 8px;" alt="Rich Asset" /></div>`
                setLocalRichAsset(html)
                onAssetChange?.(html)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFileUpload(file)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(true)
    }

    const handleDragLeave = () => {
        setIsDragOver(false)
    }

    const handleRemoveAsset = () => {
        setLocalRichAsset(undefined)
        onAssetChange?.(undefined)
    }

    const handleImportFromUrl = async () => {
        if (!urlInput.trim()) return
        setIsLoadingUrl(true)
        try {
            // Fetch URL content via API proxy to avoid CORS
            const response = await fetch(`/api/fetch-url?url=${encodeURIComponent(urlInput)}`)
            if (response.ok) {
                const html = await response.text()
                setLocalRichAsset(html)
                onAssetChange?.(html)
                setUrlInput("")
            } else {
                console.error("Failed to fetch URL:", response.statusText)
            }
        } catch (error) {
            console.error("Error fetching URL:", error)
        } finally {
            setIsLoadingUrl(false)
        }
    }

    const handleImportFromPaste = () => {
        if (!pasteInput.trim()) return
        setLocalRichAsset(pasteInput)
        onAssetChange?.(pasteInput)
        setPasteInput("")
    }

    // Check if rich asset exists (use local state)
    const hasRichAsset = Boolean(localRichAsset)

    // Generate combined preview HTML (use local state)
    const combinedHtml = draft ? generateCombinedHtml(
        isEditing ? editedBody : draft.body,
        localRichAsset
    ) : ""

    // Loading state during generation
    if (isGenerating) {
        return (
            <Card className="p-6" data-testid="draft-workspace">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-3 text-muted-foreground">Generating draft...</p>
                </div>
            </Card>
        )
    }

    // No draft state
    if (!draft) {
        return (
            <Card className="p-6" data-testid="draft-workspace">
                <div className="text-center py-12 text-muted-foreground">
                    <p>No draft available for this target.</p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRegenerate}
                        className="mt-4"
                    >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Draft
                    </Button>
                </div>
            </Card>
        )
    }

    return (
        <Card className="p-6" data-testid="draft-workspace">
            {/* ===== HEADER: Subject Line ===== */}
            <div className="mb-4">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Subject Line
                </label>
                {isEditing ? (
                    <Input
                        value={editedSubject}
                        onChange={(e) => setEditedSubject(e.target.value)}
                        placeholder="Email subject..."
                        className="mt-1"
                        data-testid="subject-input"
                    />
                ) : (
                    <div className="text-lg font-semibold mt-1" data-testid="draft-subject">
                        {editedSubject || draft.subject}
                    </div>
                )}
            </div>

            {/* ===== TOOLBAR: View Controls (left) | Actions (right) ===== */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                    <button
                        onClick={() => setViewMode("preview")}
                        className={`flex items-center gap-1 text-xs px-2 py-1.5 rounded-md transition-all ${viewMode === "preview"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                        title="Preview combined email"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        Preview
                    </button>
                    <button
                        onClick={() => setViewMode("text")}
                        className={`flex items-center gap-1 text-xs px-2 py-1.5 rounded-md transition-all ${viewMode === "text"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                        title="Your message (editable)"
                    >
                        <FileText className="h-3.5 w-3.5" />
                        Text
                    </button>
                    <button
                        onClick={() => setViewMode("asset")}
                        disabled={!hasRichAsset}
                        className={`flex items-center gap-1 text-xs px-2 py-1.5 rounded-md transition-all ${viewMode === "asset"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                            } ${!hasRichAsset ? "opacity-50 cursor-not-allowed" : ""}`}
                        title={hasRichAsset ? "View rich asset" : "No rich asset attached"}
                    >
                        <ImageIcon className="h-3.5 w-3.5" />
                        Asset
                    </button>
                </div>

                {/* Action Buttons - Compact */}
                <div className="flex items-center gap-1">
                    {isEditing ? (
                        <>
                            <Button
                                size="sm"
                                onClick={handleSaveEdit}
                                disabled={isSaving}
                                data-testid="save-button"
                            >
                                {isSaving ? (
                                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Check className="mr-1 h-3.5 w-3.5" />
                                )}
                                Save
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEdit}
                            >
                                <X className="mr-1 h-3.5 w-3.5" />
                                Cancel
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleStartEdit}
                                className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                data-testid="edit-button"
                            >
                                <Pencil className="mr-1 h-3.5 w-3.5" />
                                Edit
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRegenerate}
                                disabled={isGenerating}
                                className="border-violet-500/30 text-violet-600 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-950/30"
                            >
                                <Sparkles className="mr-1 h-3.5 w-3.5" />
                                AI Rewrite
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowGuidedInput(true)}
                                disabled={isGenerating}
                                className="border-indigo-500/30 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
                            >
                                <MessageSquare className="mr-1 h-3.5 w-3.5" />
                                Guided
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* ===== CONTENT AREA ===== */}
            <div className="min-h-[300px]">
                {/* PREVIEW MODE: Combined email view */}
                {viewMode === "preview" && (
                    <div className="border rounded-lg overflow-hidden bg-white h-[400px]">
                        <iframe
                            title="Email Preview"
                            srcDoc={combinedHtml}
                            className="w-full h-full border-0"
                            sandbox="allow-same-origin"
                        />
                    </div>
                )}

                {/* TEXT MODE: Andrew's editable message + asset preview below */}
                {viewMode === "text" && (
                    <div className="space-y-4">
                        {/* Andrew's Message */}
                        {isEditing ? (
                            <Textarea
                                value={editedBody}
                                onChange={(e) => setEditedBody(e.target.value)}
                                placeholder="Write your message here..."
                                className="min-h-[200px] text-sm"
                                data-testid="body-textarea"
                            />
                        ) : (
                            <div
                                className="prose prose-sm max-w-none whitespace-pre-wrap max-h-[250px] overflow-y-auto p-4 bg-muted/30 rounded-lg"
                                data-testid="draft-body"
                            >
                                {editedBody || draft.body}
                            </div>
                        )}

                        {/* Attached Asset Preview (collapsed) */}
                        {hasRichAsset && (
                            <div className="border-t pt-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                    <ImageIcon className="h-4 w-4" />
                                    <span className="font-medium">Attached Rich Asset</span>
                                    <span className="text-xs">(appears below your message)</span>
                                </div>
                                <div className="border rounded-lg overflow-hidden bg-white h-[120px] opacity-80">
                                    <iframe
                                        title="Asset Preview (Collapsed)"
                                        srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin: 0; padding: 8px; font-family: sans-serif; transform: scale(0.8); transform-origin: top left;">${draft.richAssetHtml}</body></html>`}
                                        className="w-full h-full border-0 pointer-events-none"
                                        sandbox="allow-same-origin"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ASSET MODE: View rich asset with controls */}
                {viewMode === "asset" && hasRichAsset && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <ImageIcon className="h-4 w-4" />
                                <span>Rich Asset (appears below your message)</span>
                            </div>
                            <div className="flex gap-2">
                                <label className="cursor-pointer">
                                    <input
                                        type="file"
                                        accept=".html,image/*"
                                        className="hidden"
                                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                                    />
                                    <Button variant="outline" size="sm" asChild>
                                        <span>
                                            <Upload className="h-3.5 w-3.5 mr-1" />
                                            Replace
                                        </span>
                                    </Button>
                                </label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRemoveAsset}
                                    className="text-red-600 border-red-500/30 hover:bg-red-50"
                                >
                                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                                    Remove
                                </Button>
                            </div>
                        </div>
                        <div className="border rounded-lg overflow-hidden bg-white h-[320px]">
                            <iframe
                                title="Rich Asset Preview"
                                srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin: 0; padding: 16px; font-family: sans-serif;">${localRichAsset}</body></html>`}
                                className="w-full h-full border-0"
                                sandbox="allow-same-origin"
                            />
                        </div>
                    </div>
                )}

                {/* ASSET MODE: No asset - show import options */}
                {viewMode === "asset" && !hasRichAsset && (
                    <div className="space-y-4">
                        {/* Import Mode Tabs */}
                        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
                            <button
                                onClick={() => setImportMode("file")}
                                className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-md transition-all ${importMode === "file"
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <Upload className="h-3.5 w-3.5" />
                                File
                            </button>
                            <button
                                onClick={() => setImportMode("url")}
                                className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-md transition-all ${importMode === "url"
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <Link2 className="h-3.5 w-3.5" />
                                URL
                            </button>
                            <button
                                onClick={() => setImportMode("paste")}
                                className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-md transition-all ${importMode === "paste"
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <ClipboardPaste className="h-3.5 w-3.5" />
                                Paste
                            </button>
                        </div>

                        {/* FILE IMPORT: Drag & Drop Zone */}
                        {importMode === "file" && (
                            <div
                                className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${isDragOver
                                        ? "border-primary bg-primary/5"
                                        : "border-muted-foreground/30 hover:border-muted-foreground/50"
                                    }`}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                            >
                                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                                <p className="font-medium mb-1">Drag & Drop Your Asset</p>
                                <p className="text-sm text-muted-foreground mb-3">
                                    HTML file or image
                                </p>
                                <label className="cursor-pointer">
                                    <input
                                        type="file"
                                        accept=".html,image/*"
                                        className="hidden"
                                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                                    />
                                    <Button variant="outline" size="sm" asChild>
                                        <span>
                                            <Upload className="h-3.5 w-3.5 mr-1" />
                                            Choose File
                                        </span>
                                    </Button>
                                </label>
                            </div>
                        )}

                        {/* URL IMPORT: Enter URL */}
                        {importMode === "url" && (
                            <div className="border rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <Link2 className="h-5 w-5 text-muted-foreground" />
                                    <span className="font-medium">Import from URL</span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Paste a link to an HTML template or hosted asset
                                </p>
                                <div className="flex gap-2">
                                    <Input
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                        placeholder="https://example.com/template.html"
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={handleImportFromUrl}
                                        disabled={!urlInput.trim() || isLoadingUrl}
                                    >
                                        {isLoadingUrl ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                        ) : (
                                            <Link2 className="h-4 w-4 mr-1" />
                                        )}
                                        Import
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* PASTE IMPORT: Paste HTML */}
                        {importMode === "paste" && (
                            <div className="border rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <ClipboardPaste className="h-5 w-5 text-muted-foreground" />
                                    <span className="font-medium">Paste HTML</span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Paste HTML code from an email template or marketing content
                                </p>
                                <Textarea
                                    value={pasteInput}
                                    onChange={(e) => setPasteInput(e.target.value)}
                                    placeholder="<div>Paste your HTML here...</div>"
                                    className="min-h-[150px] font-mono text-xs mb-3"
                                />
                                <Button
                                    onClick={handleImportFromPaste}
                                    disabled={!pasteInput.trim()}
                                >
                                    <ClipboardPaste className="h-4 w-4 mr-1" />
                                    Use This HTML
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ===== GUIDED REWRITE INPUT ===== */}
            {showGuidedInput && (
                <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                        <MessageSquare className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                            Guided Rewrite
                        </span>
                    </div>
                    <Textarea
                        value={guidedComments}
                        onChange={(e) => setGuidedComments(e.target.value)}
                        placeholder="Tell the AI what to change or improve..."
                        className="min-h-[80px] mb-3 bg-background"
                    />
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={handleRegenerateWithFeedback}
                            disabled={!guidedComments.trim() || isGenerating}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Regenerate
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setShowGuidedInput(false)
                                setGuidedComments("")
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    )
}
