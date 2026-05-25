"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Plus, 
  Mail, 
  Clock, 
  Sparkles, 
  GripVertical, 
  Trash2,
  Edit2,
  Loader2
} from "lucide-react"
import type { Sequence, SequenceStep } from "@/lib/types"

interface SequenceBuilderProps {
  sequence: Sequence
  steps: SequenceStep[]
  onStepsChange: (steps: SequenceStep[]) => void
  onSequenceUpdate: () => void
}

export function SequenceBuilder({ 
  sequence, 
  steps, 
  onStepsChange, 
  onSequenceUpdate 
}: SequenceBuilderProps) {
  const supabase = createClient()
  const [addingStep, setAddingStep] = useState(false)
  const [editingStep, setEditingStep] = useState<SequenceStep | null>(null)
  const [generating, setGenerating] = useState(false)
  const [newStep, setNewStep] = useState({
    step_type: "email" as const,
    subject: "",
    body: "",
    wait_days: 1,
    wait_hours: 0,
  })

  async function addStep() {
    setAddingStep(true)
    
    const { data, error } = await supabase
      .from("sequence_steps")
      .insert({
        sequence_id: sequence.id,
        step_order: steps.length,
        step_type: newStep.step_type,
        subject: newStep.step_type === "email" ? newStep.subject : null,
        body: newStep.step_type === "email" ? newStep.body : null,
        wait_days: newStep.step_type === "wait" ? newStep.wait_days : 0,
        wait_hours: newStep.step_type === "wait" ? newStep.wait_hours : 0,
      })
      .select()
      .single()

    if (!error && data) {
      onStepsChange([...steps, data])
      setNewStep({
        step_type: "email",
        subject: "",
        body: "",
        wait_days: 1,
        wait_hours: 0,
      })
    }
    setAddingStep(false)
  }

  async function updateStep(step: SequenceStep) {
    await supabase
      .from("sequence_steps")
      .update({
        subject: step.subject,
        body: step.body,
        wait_days: step.wait_days,
        wait_hours: step.wait_hours,
      })
      .eq("id", step.id)

    onStepsChange(steps.map(s => s.id === step.id ? step : s))
    setEditingStep(null)
  }

  async function deleteStep(stepId: string) {
    await supabase.from("sequence_steps").delete().eq("id", stepId)
    onStepsChange(steps.filter(s => s.id !== stepId))
  }

  async function generateWithAI() {
    setGenerating(true)
    // Simulate AI generation - in production, this would call the AI API
    setTimeout(() => {
      setNewStep({
        ...newStep,
        subject: "Quick question about {{company}}",
        body: `Hi {{first_name}},

I noticed {{company}} is doing great things in {{industry}}. I wanted to reach out because we've helped similar companies achieve significant results.

Would you be open to a quick 15-minute call to discuss how we might be able to help?

Best regards`,
      })
      setGenerating(false)
    }, 1500)
  }

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{sequence.name}</h2>
          <p className="text-sm text-muted-foreground">
            {steps.length} {steps.length === 1 ? "step" : "steps"} in this sequence
          </p>
        </div>
        <Badge className={
          sequence.status === "active" 
            ? "bg-emerald-500/10 text-emerald-400" 
            : sequence.status === "paused"
            ? "bg-amber-500/10 text-amber-400"
            : "bg-slate-500/10 text-slate-400"
        }>
          {sequence.status}
        </Badge>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="relative">
            {index > 0 && (
              <div className="absolute left-6 -top-4 h-4 w-0.5 bg-border" />
            )}
            
            <div className="flex items-start gap-4 p-4 bg-background rounded-lg border border-border group hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className={`p-2 rounded-lg ${
                  step.step_type === "email" 
                    ? "bg-primary/10" 
                    : "bg-amber-500/10"
                }`}>
                  {step.step_type === "email" ? (
                    <Mail className="h-4 w-4 text-primary" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-400" />
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground">
                    Step {index + 1}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {step.step_type}
                  </Badge>
                </div>

                {step.step_type === "email" ? (
                  <div>
                    <p className="font-medium text-foreground truncate">
                      {step.subject || "No subject"}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {step.body || "No content"}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Wait {step.wait_days} day{step.wait_days !== 1 ? "s" : ""}
                    {step.wait_hours > 0 && ` ${step.wait_hours} hour${step.wait_hours !== 1 ? "s" : ""}`}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Dialog open={editingStep?.id === step.id} onOpenChange={(open) => !open && setEditingStep(null)}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setEditingStep(step)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Edit Step {index + 1}</DialogTitle>
                    </DialogHeader>
                    {editingStep && (
                      <div className="space-y-4 pt-4">
                        {editingStep.step_type === "email" ? (
                          <>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Subject</label>
                              <Input
                                value={editingStep.subject || ""}
                                onChange={(e) => setEditingStep({
                                  ...editingStep,
                                  subject: e.target.value
                                })}
                                placeholder="Email subject..."
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Body</label>
                              <Textarea
                                value={editingStep.body || ""}
                                onChange={(e) => setEditingStep({
                                  ...editingStep,
                                  body: e.target.value
                                })}
                                placeholder="Email content..."
                                rows={10}
                              />
                              <p className="text-xs text-muted-foreground">
                                Use {'{{first_name}}'}, {'{{company}}'}, {'{{industry}}'} for personalization
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Days</label>
                              <Input
                                type="number"
                                min={0}
                                value={editingStep.wait_days}
                                onChange={(e) => setEditingStep({
                                  ...editingStep,
                                  wait_days: parseInt(e.target.value) || 0
                                })}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Hours</label>
                              <Input
                                type="number"
                                min={0}
                                max={23}
                                value={editingStep.wait_hours}
                                onChange={(e) => setEditingStep({
                                  ...editingStep,
                                  wait_hours: parseInt(e.target.value) || 0
                                })}
                              />
                            </div>
                          </div>
                        )}
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setEditingStep(null)}>
                            Cancel
                          </Button>
                          <Button onClick={() => updateStep(editingStep)}>
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => deleteStep(step.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {index < steps.length - 1 && (
              <div className="absolute left-6 -bottom-4 h-4 w-0.5 bg-border" />
            )}
          </div>
        ))}

        {/* Add Step Section */}
        <div className="border-2 border-dashed border-border rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Select
                value={newStep.step_type}
                onValueChange={(value: "email" | "wait") => 
                  setNewStep({ ...newStep, step_type: value })
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="wait">Wait</SelectItem>
                </SelectContent>
              </Select>

              {newStep.step_type === "email" && (
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={generateWithAI}
                  disabled={generating}
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Generate with AI
                </Button>
              )}
            </div>

            {newStep.step_type === "email" ? (
              <div className="space-y-4">
                <Input
                  placeholder="Email subject..."
                  value={newStep.subject}
                  onChange={(e) => setNewStep({ ...newStep, subject: e.target.value })}
                />
                <Textarea
                  placeholder="Email content..."
                  value={newStep.body}
                  onChange={(e) => setNewStep({ ...newStep, body: e.target.value })}
                  rows={6}
                />
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={newStep.wait_days}
                    onChange={(e) => setNewStep({ 
                      ...newStep, 
                      wait_days: parseInt(e.target.value) || 0 
                    })}
                    className="w-20"
                  />
                  <span className="text-muted-foreground">days</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={newStep.wait_hours}
                    onChange={(e) => setNewStep({ 
                      ...newStep, 
                      wait_hours: parseInt(e.target.value) || 0 
                    })}
                    className="w-20"
                  />
                  <span className="text-muted-foreground">hours</span>
                </div>
              </div>
            )}

            <Button 
              onClick={addStep} 
              disabled={addingStep || (newStep.step_type === "email" && !newStep.subject)}
              className="gap-2"
            >
              {addingStep ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add Step
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
