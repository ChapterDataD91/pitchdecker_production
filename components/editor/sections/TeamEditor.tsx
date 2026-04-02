'use client'

import { useState, useCallback } from 'react'
import { v4 as uuid } from 'uuid'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import type { TeamSection, TeamMember, ConsultantSummary } from '@/lib/types'
import SlideOutPanel from '@/components/ui/SlideOutPanel'
import ConsultantPicker from './team/ConsultantPicker'
import TeamMemberCard from './team/TeamMemberCard'

interface TeamEditorProps {
  data: TeamSection
  onChange: (data: TeamSection) => void
}

type GroupKey = 'leadTeam' | 'network'

function consultantToMember(c: ConsultantSummary): TeamMember {
  return {
    id: uuid(),
    algoliaId: c.id,
    name: c.name,
    title: c.role,
    photoUrl: c.photoUrl,
    bio: c.bio,
    expertiseTags: [...c.sectors, ...c.functionalAreas],
  }
}

export default function TeamEditor({ data, onChange }: TeamEditorProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [targetGroup, setTargetGroup] = useState<GroupKey>('leadTeam')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // All selected algoliaIds across both groups
  const selectedIds = [
    ...data.leadTeam.map((m) => m.algoliaId),
    ...data.network.map((m) => m.algoliaId),
  ]

  const openPicker = useCallback((group: GroupKey) => {
    setTargetGroup(group)
    setPickerOpen(true)
  }, [])

  const handleSelect = useCallback(
    (consultant: ConsultantSummary) => {
      const member = consultantToMember(consultant)
      const updated = { ...data }
      updated[targetGroup] = [...updated[targetGroup], member]
      onChange(updated)
    },
    [data, onChange, targetGroup],
  )

  const handleBioChange = useCallback(
    (memberId: string, bio: string) => {
      const updated = { ...data }
      for (const group of ['leadTeam', 'network'] as const) {
        updated[group] = updated[group].map((m) =>
          m.id === memberId ? { ...m, bio } : m,
        )
      }
      onChange(updated)
    },
    [data, onChange],
  )

  const handleRemove = useCallback(
    (memberId: string) => {
      onChange({
        leadTeam: data.leadTeam.filter((m) => m.id !== memberId),
        network: data.network.filter((m) => m.id !== memberId),
      })
    },
    [data, onChange],
  )

  const handleMove = useCallback(
    (memberId: string) => {
      const inLead = data.leadTeam.find((m) => m.id === memberId)
      if (inLead) {
        onChange({
          leadTeam: data.leadTeam.filter((m) => m.id !== memberId),
          network: [...data.network, inLead],
        })
      } else {
        const inNetwork = data.network.find((m) => m.id === memberId)
        if (inNetwork) {
          onChange({
            leadTeam: [...data.leadTeam, inNetwork],
            network: data.network.filter((m) => m.id !== memberId),
          })
        }
      }
    },
    [data, onChange],
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const activeId = active.id as string
      const overId = over.id as string

      // Find which group the active item belongs to
      for (const group of ['leadTeam', 'network'] as const) {
        const items = data[group]
        const oldIndex = items.findIndex((m) => m.id === activeId)
        const newIndex = items.findIndex((m) => m.id === overId)
        if (oldIndex !== -1 && newIndex !== -1) {
          onChange({
            ...data,
            [group]: arrayMove(items, oldIndex, newIndex),
          })
          return
        }
      }
    },
    [data, onChange],
  )

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-8">
          {/* Lead Team */}
          <TeamGroup
            label="Lead Team"
            members={data.leadTeam}
            groupKey="leadTeam"
            onAdd={() => openPicker('leadTeam')}
            onBioChange={handleBioChange}
            onRemove={handleRemove}
            onMove={handleMove}
          />

          {/* Network */}
          <TeamGroup
            label="Network"
            members={data.network}
            groupKey="network"
            onAdd={() => openPicker('network')}
            onBioChange={handleBioChange}
            onRemove={handleRemove}
            onMove={handleMove}
          />
        </div>
      </DndContext>

      <SlideOutPanel
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={`Add to ${targetGroup === 'leadTeam' ? 'Lead Team' : 'Network'}`}
      >
        <ConsultantPicker
          selectedIds={selectedIds}
          onSelect={handleSelect}
        />
      </SlideOutPanel>
    </>
  )
}

// ---------------------------------------------------------------------------
// Sub-component: a single group (Lead Team or Network)
// ---------------------------------------------------------------------------

interface TeamGroupProps {
  label: string
  members: TeamMember[]
  groupKey: GroupKey
  onAdd: () => void
  onBioChange: (id: string, bio: string) => void
  onRemove: (id: string) => void
  onMove: (id: string) => void
}

function TeamGroup({
  label,
  members,
  groupKey,
  onAdd,
  onBioChange,
  onRemove,
  onMove,
}: TeamGroupProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text">{label}</h3>
        <span className="text-xs text-text-tertiary">
          {members.length} member{members.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="border border-border rounded-lg p-6 bg-bg-subtle">
        <SortableContext
          items={members.map((m) => m.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 gap-4">
            {members.map((member) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                group={groupKey}
                onBioChange={onBioChange}
                onRemove={onRemove}
                onMove={onMove}
              />
            ))}

            {/* Add member placeholder */}
            <button
              onClick={onAdd}
              className="border border-dashed border-border-dashed rounded-lg p-4 flex flex-col items-center justify-center min-h-[120px] cursor-pointer hover:border-accent hover:bg-accent-light transition-colors group"
            >
              <svg
                className="h-6 w-6 text-text-tertiary group-hover:text-accent mb-2 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
              <span className="text-sm font-medium text-text-tertiary group-hover:text-accent transition-colors">
                + Add member
              </span>
            </button>
          </div>
        </SortableContext>
      </div>
    </div>
  )
}
