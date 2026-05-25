"use client"

import { useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  MoreHorizontal, 
  Play, 
  Pause, 
  Copy, 
  Trash2, 
  Mail,
  Clock,
  Users,
  TrendingUp,
  Loader2
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Sequence } from "@/lib/types"

interface SequencesListProps {
  sequences: Sequence[]
  loading: boolean
  onRefresh: () => void
}

export function SequencesList({ sequences, loading, onRefresh }: SequencesListProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const supabase = createClient()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      case "paused":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20"
      case "draft":
        return "bg-slate-500/10 text-slate-400 border-slate-500/20"
      case "archived":
        return "bg-red-500/10 text-red-400 border-red-500/20"
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20"
    }
  }

  async function toggleStatus(sequence: Sequence) {
    setActionLoading(sequence.id)
    const newStatus = sequence.status === "active" ? "paused" : "active"
    
    await supabase
      .from("sequences")
      .update({ status: newStatus })
      .eq("id", sequence.id)
    
    onRefresh()
    setActionLoading(null)
  }

  async function deleteSequence(id: string) {
    if (!confirm("Are you sure you want to delete this sequence?")) return
    
    setActionLoading(id)
    await supabase.from("sequences").delete().eq("id", id)
    onRefresh()
    setActionLoading(null)
  }

  if (loading) {
    return (
      <Card className="p-12 bg-card border-border">
        <div className="flex flex-col items-center justify-center text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading sequences...</p>
        </div>
      </Card>
    )
  }

  if (sequences.length === 0) {
    return (
      <Card className="p-12 bg-card border-border">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="p-4 rounded-full bg-primary/10 mb-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No sequences yet
          </h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            Create your first email sequence to automate outreach and nurture leads
          </p>
          <Link href="/sequences/new">
            <Button className="bg-primary hover:bg-primary/90">
              Create Your First Sequence
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {sequences.map((sequence) => {
        const stats = sequence.stats as any || { enrolled: 0, completed: 0, replied: 0 }
        const replyRate = stats.enrolled > 0 
          ? ((stats.replied / stats.enrolled) * 100).toFixed(1) 
          : "0"

        return (
          <Card 
            key={sequence.id} 
            className="p-4 bg-card border-border hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Link 
                      href={`/sequences/${sequence.id}`}
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {sequence.name}
                    </Link>
                    <Badge className={getStatusColor(sequence.status)}>
                      {sequence.status}
                    </Badge>
                    {sequence.trigger_type !== "manual" && (
                      <Badge variant="outline" className="text-xs">
                        Auto: {sequence.trigger_type.replace("_", " ")}
                      </Badge>
                    )}
                  </div>
                  {sequence.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {sequence.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{stats.enrolled} enrolled</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>{replyRate}% reply</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {new Date(sequence.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleStatus(sequence)}
                    disabled={actionLoading === sequence.id || sequence.status === "draft"}
                    className="gap-2"
                  >
                    {actionLoading === sequence.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : sequence.status === "active" ? (
                      <>
                        <Pause className="h-4 w-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Start
                      </>
                    )}
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/sequences/${sequence.id}`}>
                          Edit Sequence
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => deleteSequence(sequence.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
