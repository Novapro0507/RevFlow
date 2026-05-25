"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { SequenceBuilder } from "@/components/sequences/sequence-builder"
import { SequenceSettings } from "@/components/sequences/sequence-settings"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { Sequence, SequenceStep } from "@/lib/types"

export default function SequenceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [sequence, setSequence] = useState<Sequence | null>(null)
  const [steps, setSteps] = useState<SequenceStep[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSequence()
  }, [id])

  async function fetchSequence() {
    setLoading(true)
    
    const { data: sequenceData, error: sequenceError } = await supabase
      .from("sequences")
      .select("*")
      .eq("id", id)
      .single()

    if (sequenceError || !sequenceData) {
      router.push("/sequences")
      return
    }

    const { data: stepsData } = await supabase
      .from("sequence_steps")
      .select("*")
      .eq("sequence_id", id)
      .order("step_order", { ascending: true })

    setSequence(sequenceData)
    setSteps(stepsData || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!sequence) {
    return null
  }

  return (
    <div className="flex-1 p-6">
      <Link 
        href="/sequences" 
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sequences
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SequenceBuilder 
            sequence={sequence}
            steps={steps}
            onStepsChange={setSteps}
            onSequenceUpdate={fetchSequence}
          />
        </div>
        <div>
          <SequenceSettings 
            sequence={sequence}
            onUpdate={fetchSequence}
          />
        </div>
      </div>
    </div>
  )
}
