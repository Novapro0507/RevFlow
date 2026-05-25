"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Loader2, Sparkles } from "lucide-react"
import Link from "next/link"

export default function NewSequencePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    trigger_type: "manual",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }

    const { data, error } = await supabase
      .from("sequences")
      .insert({
        user_id: user.id,
        name: formData.name,
        description: formData.description,
        trigger_type: formData.trigger_type,
        status: "draft",
      })
      .select()
      .single()

    if (!error && data) {
      router.push(`/sequences/${data.id}`)
    }
    setLoading(false)
  }

  return (
    <div className="flex-1 p-6 max-w-2xl mx-auto">
      <Link 
        href="/sequences" 
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sequences
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Create New Sequence</h1>
        <p className="text-muted-foreground mt-1">
          Set up an automated email sequence to nurture your leads
        </p>
      </div>

      <Card className="p-6 bg-card border-border">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Sequence Name</Label>
            <Input
              id="name"
              placeholder="e.g., Welcome Series, Cold Outreach, Follow-up"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="What is this sequence for?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-background resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trigger">Trigger Type</Label>
            <Select
              value={formData.trigger_type}
              onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}
            >
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual Enrollment</SelectItem>
                <SelectItem value="lead_created">When Lead is Created</SelectItem>
                <SelectItem value="deal_stage_changed">When Deal Stage Changes</SelectItem>
                <SelectItem value="tag_added">When Tag is Added</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose when leads should automatically enter this sequence
            </p>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">AI-Powered Sequences</p>
                <p className="text-sm text-muted-foreground">
                  After creating, use AI to generate personalized email content based on lead data
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Link href="/sequences">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={loading || !formData.name}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Sequence"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
