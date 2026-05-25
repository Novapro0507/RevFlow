"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Settings, 
  Play, 
  Pause,
  Loader2,
  Clock,
  Calendar
} from "lucide-react"
import type { Sequence } from "@/lib/types"

interface SequenceSettingsProps {
  sequence: Sequence
  onUpdate: () => void
}

export function SequenceSettings({ sequence, onUpdate }: SequenceSettingsProps) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState(sequence.settings as any || {
    sendOnWeekends: false,
    timezone: "America/New_York",
    sendTimeStart: "09:00",
    sendTimeEnd: "17:00",
  })

  async function saveSettings() {
    setSaving(true)
    await supabase
      .from("sequences")
      .update({ settings })
      .eq("id", sequence.id)
    onUpdate()
    setSaving(false)
  }

  async function toggleStatus() {
    setSaving(true)
    const newStatus = sequence.status === "active" ? "paused" : "active"
    await supabase
      .from("sequences")
      .update({ status: newStatus })
      .eq("id", sequence.id)
    onUpdate()
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Sequence Settings</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Trigger Type</Label>
            <Select
              value={sequence.trigger_type}
              onValueChange={async (value) => {
                await supabase
                  .from("sequences")
                  .update({ trigger_type: value })
                  .eq("id", sequence.id)
                onUpdate()
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual Enrollment</SelectItem>
                <SelectItem value="lead_created">When Lead Created</SelectItem>
                <SelectItem value="deal_stage_changed">Deal Stage Changed</SelectItem>
                <SelectItem value="tag_added">Tag Added</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select
              value={settings.timezone}
              onValueChange={(value) => setSettings({ ...settings, timezone: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                <SelectItem value="America/Chicago">Central Time</SelectItem>
                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Send on Weekends</Label>
              <p className="text-sm text-muted-foreground">
                Allow emails on Sat/Sun
              </p>
            </div>
            <Switch
              checked={settings.sendOnWeekends}
              onCheckedChange={(checked) => 
                setSettings({ ...settings, sendOnWeekends: checked })
              }
            />
          </div>

          <Button 
            onClick={saveSettings} 
            disabled={saving}
            variant="outline"
            className="w-full"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Save Settings
          </Button>
        </div>
      </Card>

      <Card className="p-4 bg-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Clock className="h-5 w-5 text-amber-400" />
          </div>
          <h3 className="font-semibold text-foreground">Send Window</h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={settings.sendTimeStart || "09:00"}
                onChange={(e) => setSettings({ 
                  ...settings, 
                  sendTimeStart: e.target.value 
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={settings.sendTimeEnd || "17:00"}
                onChange={(e) => setSettings({ 
                  ...settings, 
                  sendTimeEnd: e.target.value 
                })}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Emails will only be sent during this window
          </p>
        </div>
      </Card>

      <Card className="p-4 bg-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <Calendar className="h-5 w-5 text-emerald-400" />
          </div>
          <h3 className="font-semibold text-foreground">Sequence Status</h3>
        </div>

        <Button
          onClick={toggleStatus}
          disabled={saving || sequence.status === "draft"}
          className={`w-full gap-2 ${
            sequence.status === "active"
              ? "bg-amber-500 hover:bg-amber-600"
              : "bg-emerald-500 hover:bg-emerald-600"
          }`}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : sequence.status === "active" ? (
            <>
              <Pause className="h-4 w-4" />
              Pause Sequence
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Activate Sequence
            </>
          )}
        </Button>

        {sequence.status === "draft" && (
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Add at least one step to activate
          </p>
        )}
      </Card>
    </div>
  )
}
