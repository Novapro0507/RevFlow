"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { SequencesHeader } from "@/components/sequences/sequences-header"
import { SequencesList } from "@/components/sequences/sequences-list"
import { SequenceStats } from "@/components/sequences/sequence-stats"
import type { Sequence } from "@/lib/types"

export default function SequencesPage() {
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchSequences()
  }, [])

  async function fetchSequences() {
    setLoading(true)
    const { data, error } = await supabase
      .from("sequences")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setSequences(data)
    }
    setLoading(false)
  }

  const totalStats = {
    enrolled: sequences.reduce((sum, s) => sum + ((s.stats as any)?.enrolled || 0), 0),
    completed: sequences.reduce((sum, s) => sum + ((s.stats as any)?.completed || 0), 0),
    replied: sequences.reduce((sum, s) => sum + ((s.stats as any)?.replied || 0), 0),
    bounced: sequences.reduce((sum, s) => sum + ((s.stats as any)?.bounced || 0), 0),
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <SequencesHeader />
      <SequenceStats stats={totalStats} />
      <SequencesList 
        sequences={sequences} 
        loading={loading} 
        onRefresh={fetchSequences}
      />
    </div>
  )
}
