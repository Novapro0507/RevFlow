"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Zap } from "lucide-react"

export function SequencesHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Email Sequences</h1>
        <p className="text-muted-foreground mt-1">
          Automate your outreach with intelligent email sequences
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" className="gap-2">
          <Zap className="h-4 w-4" />
          AI Templates
        </Button>
        <Link href="/sequences/new">
          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            New Sequence
          </Button>
        </Link>
      </div>
    </div>
  )
}
