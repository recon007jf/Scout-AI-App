"use client";

import React, { useState, useCallback } from 'react';

/**
 * RichAssetEditor: Split-Pane Editor for Rich Email Content
 * 
 * Features:
 * - Drag & Drop / Paste HTML content
 * - "Broken Image" Validator: Blocks local file paths
 * - Live Preview
 * - Outlook Reality Disclaimer
 */

interface RichAssetEditorProps {
  candidateId: string;
  initialContent?: string;
  onContentChange: (htmlContent: string | null) => void;
  onValidationError?: (error: string) => void;
}

// Validates that all image sources are hosted (https://)
function validateImageSources(html: string): { valid: boolean; error?: string } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const images = doc.querySelectorAll('img');

  for (const img of images) {
    const src = img.getAttribute('src') || '';

    // Check for local file paths
    if (
      src.startsWith('file://') ||
      src.startsWith('/') ||
      src.startsWith('./') ||
      src.startsWith('../') ||
      src.match(/^[A-Za-z]:\\/) || // Windows paths
      src.startsWith('C:') ||
      src.startsWith('blob:') ||
      (!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:'))
    ) {
      return {
        valid: false,
        error: `Upload Failed: Local images detected (${src.substring(0, 50)}...). Please use hosted images (https://...) or they will appear broken to the recipient.`
      };
    }
  }

  return { valid: true };
}

export function RichAssetEditor({
  candidateId,
  initialContent = '',
  onContentChange,
  onValidationError
}: RichAssetEditorProps) {
  const [htmlContent, setHtmlContent] = useState(initialContent);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Validate on mount
  React.useEffect(() => {
    if (initialContent) {
      const validation = validateImageSources(initialContent);
      if (!validation.valid) {
        const msg = validation.error || 'Validation failed';
        setError(msg);
        onValidationError?.(msg);
      }
    }
  }, []); // Run once on mount

  const handleContentUpdate = useCallback((content: string) => {
    // Validate images
    const validation = validateImageSources(content);

    if (!validation.valid) {
      setError(validation.error || 'Validation failed');
      onValidationError?.(validation.error || 'Validation failed');
      // We do NOT clear content here, allowing user to fix it. 
      // But we notify parent of error.
      onContentChange(content);
      return;
    }

    setError(null);
    setHtmlContent(content);
    onContentChange(content);
    onValidationError?.(""); // Clear error
  }, [onContentChange, onValidationError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    // Check for HTML files
    const files = Array.from(e.dataTransfer.files);
    const htmlFile = files.find(f => f.name.endsWith('.html') || f.name.endsWith('.htm'));

    if (htmlFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        handleContentUpdate(content);
      };
      reader.readAsText(htmlFile);
      return;
    }

    // Check for pasted HTML content
    const html = e.dataTransfer.getData('text/html');
    if (html) {
      handleContentUpdate(html);
      return;
    }

    // Plain text fallback
    const text = e.dataTransfer.getData('text/plain');
    if (text) {
      setHtmlContent(text);
      onContentChange(text);
    }
  }, [handleContentUpdate, onContentChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const html = e.clipboardData.getData('text/html');
    if (html) {
      e.preventDefault();
      handleContentUpdate(html);
    }
  }, [handleContentUpdate]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    handleContentUpdate(content);
  }, [handleContentUpdate]);

  return (
    <div className="rich-asset-editor">
      {/* Outlook Reality Disclaimer */}
      <div className="outlook-disclaimer">
        <span className="warning-icon">⚠️</span>
        <span>
          <strong>Note:</strong> This is a browser preview. Outlook rendering depends on
          the recipient's version (Word engine). Images are validated for hosting, not layout.
        </span>
      </div>

      <div className="editor-split-pane">
        {/* Input Pane (Left) */}
        <div
          className={`input-pane ${isDragging ? 'dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className="pane-header">
            <h3>📨 Email Content</h3>
            <span className="hint">Drag & drop HTML file or paste content</span>
          </div>

          <textarea
            className="html-input"
            value={htmlContent}
            onChange={handleTextChange}
            onPaste={handlePaste}
            placeholder="Paste your newsletter HTML here, or drag & drop an .html file..."
            spellCheck={false}
          />

          {error && (
            <div className="validation-error">
              <span className="error-icon">🚫</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Preview Pane (Right) */}
        <div className="preview-pane">
          <div className="pane-header">
            <h3>👁️ Preview</h3>
            <span className="hint">How it will appear (browser approximation)</span>
          </div>

          <div
            className="preview-content"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </div>

      <style jsx>{`
        .rich-asset-editor {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

        .outlook-disclaimer {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border: 1px solid rgba(255, 193, 7, 0.3);
          border-radius: 8px;
          color: #ffc107;
          font-size: 13px;
          line-height: 1.5;
        }

        .warning-icon {
          font-size: 16px;
          flex-shrink: 0;
        }

        .editor-split-pane {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          min-height: 400px;
        }

        .input-pane,
        .preview-pane {
          display: flex;
          flex-direction: column;
          background: #0a0a0a;
          border: 1px solid #333;
          border-radius: 12px;
          overflow: hidden;
        }

        .input-pane.dragging {
          border-color: #3b82f6;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
        }

        .pane-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: #111;
          border-bottom: 1px solid #333;
        }

        .pane-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
        }

        .hint {
          font-size: 11px;
          color: #666;
        }

        .html-input {
          flex: 1;
          padding: 16px;
          background: transparent;
          border: none;
          color: #e0e0e0;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 12px;
          line-height: 1.6;
          resize: none;
        }

        .html-input:focus {
          outline: none;
        }

        .html-input::placeholder {
          color: #555;
        }

        .preview-content {
          flex: 1;
          padding: 16px;
          background: #fff;
          color: #000;
          overflow-y: auto;
        }

        .validation-error {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 12px 16px;
          background: rgba(239, 68, 68, 0.1);
          border-top: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          font-size: 13px;
          line-height: 1.4;
        }

        .error-icon {
          font-size: 16px;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .editor-split-pane {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default RichAssetEditor;
