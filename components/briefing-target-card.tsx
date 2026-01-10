"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, XCircle, Edit3, AlertCircle, Sparkles, Building2, Users, MapPin, TrendingUp } from "lucide-react"
import type { BriefingTarget } from "@/lib/types/scout"

interface BriefingTargetCardProps {
  target: BriefingTarget
  isApprovalDisabled: boolean
  onApprove: (targetId: string) => Promise<void>
  onReject: (targetId: string) => Promise<void>
  onEdit: (targetId: string, updates: { subject: string; body: string }) => Promise<void>
}

export function BriefingTargetCard({
  target,
  isApprovalDisabled,
  onApprove,
  onReject,
  onEdit,
}: BriefingTargetCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedSubject, setEditedSubject] = useState(target.draft.subject)
  const [editedBody, setEditedBody] = useState(target.draft.body)
  const [isLoading, setIsLoading] = useState(false)

  const matchScore = Math.min(100, Math.max(0, target.priority))

  const handleApprove = async () => {
    setIsLoading(true)
    try {
      await onApprove(target.targetId)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    setIsLoading(true)
    try {
      await onReject(target.targetId)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveEdit = async () => {
    setIsLoading(true)
    try {
      await onEdit(target.targetId, {
        subject: editedSubject,
        body: editedBody,
      })
      setIsEditing(false)
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className="bg-gray-900 border-gray-800 overflow-hidden">
      {/* Header: Broker Profile */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-start gap-4">
          {/* LinkedIn Profile Image Placeholder */}
          <Avatar className="w-16 h-16">
            <AvatarImage src={target.broker.avatar || "/placeholder.svg"} alt={target.broker.name} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-lg">
              {getInitials(target.broker.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">{target.broker.name}</h3>
                <p className="text-gray-400 text-sm">{target.broker.title}</p>
                <p className="text-gray-500 text-sm">{target.broker.firm}</p>
              </div>

              {/* Match Score */}
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  <span className="text-2xl font-bold text-white">{matchScore}%</span>
                </div>
                <span className="text-xs text-gray-400">Match Score</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signals: High-Contrast Badges */}
      <div className="px-6 py-4 bg-gray-950/50 border-b border-gray-800">
        <div className="flex flex-wrap gap-2">
          {target.signals.map((signal, idx) => (
            <Badge
              key={idx}
              variant="outline"
              className="bg-orange-500/10 border-orange-500/30 text-orange-400 font-medium"
            >
              <AlertCircle className="w-3 h-3 mr-1" />
              {signal.type.replace(/_/g, " ").toUpperCase()}
            </Badge>
          ))}
        </div>
      </div>

      {/* The Brain: Business Persona */}
      <div className="p-6 border-b border-gray-800 bg-blue-950/20">
        <div className="flex items-start gap-3 mb-3">
          <Sparkles className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-400 mb-1">AI Analysis</h4>
            <p className="text-white font-medium">{target.businessPersona.type}</p>
            <p className="text-gray-400 text-sm mt-1">{target.businessPersona.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-gray-900/50 p-3 rounded">
            <p className="text-xs text-gray-500 mb-1">Decision Style</p>
            <p className="text-sm text-white">{target.businessPersona.decisionStyle}</p>
          </div>
          <div className="bg-gray-900/50 p-3 rounded">
            <p className="text-xs text-gray-500 mb-1">Communication</p>
            <p className="text-sm text-white">{target.businessPersona.communicationPreference}</p>
          </div>
        </div>
      </div>

      {/* Sponsor Context */}
      <div className="p-6 border-b border-gray-800">
        <h4 className="text-sm font-semibold text-gray-400 mb-3">About {target.sponsor.name}</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4 text-gray-500" />
            <span className="text-gray-300">{target.sponsor.industry}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <span className="text-gray-300">{target.sponsor.revenue}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-gray-300">{target.sponsor.employees.toLocaleString()} employees</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-gray-300">{target.sponsor.location}</span>
          </div>
        </div>
      </div>

      {/* The Action: Draft Email */}
      <div className="p-6 border-b border-gray-800">
        <h4 className="text-sm font-semibold text-gray-400 mb-3">Proposed Outreach</h4>

        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Subject</label>
              <input
                type="text"
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Message</label>
              <Textarea
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                rows={8}
                className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          </div>
        ) : (
          <div className="bg-gray-950 border border-gray-700 rounded p-4">
            <p className="text-sm font-semibold text-white mb-2">Subject: {target.draft.subject}</p>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{target.draft.body}</p>
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div className="p-6 bg-gray-950/30">
        {isEditing ? (
          <div className="flex gap-3">
            <Button
              onClick={handleSaveEdit}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Changes
            </Button>
            <Button
              onClick={() => {
                setIsEditing(false)
                setEditedSubject(target.draft.subject)
                setEditedBody(target.draft.body)
              }}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button
              onClick={handleReject}
              disabled={isLoading}
              variant="outline"
              className="flex-1 bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button onClick={() => setIsEditing(true)} disabled={isLoading} variant="outline" className="flex-1">
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isApprovalDisabled || isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </div>
        )}

        {isApprovalDisabled && (
          <p className="text-xs text-yellow-500 text-center mt-3">Outreach is paused. Resume to enable approvals.</p>
        )}
      </div>
    </Card>
  )
}
