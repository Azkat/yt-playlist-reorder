import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { PlaylistVideo } from "@/lib/types";

export function useDragAndDrop(
  videos: PlaylistVideo[],
  setVideos: (videos: PlaylistVideo[]) => void,
  pendingChanges: Map<string, number>,
  setPendingChanges: (changes: Map<string, number>) => void
) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id && over) {
      const oldIndex = videos.findIndex(v => v.id === active.id);
      const newIndex = videos.findIndex(v => v.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // Update videos order for immediate UI feedback
        const newVideos = arrayMove(videos, oldIndex, newIndex);
        setVideos(newVideos);
        
        // Add to pending changes (0-based index for API)
        const newChanges = new Map(pendingChanges);
        newChanges.set(active.id as string, newIndex);
        setPendingChanges(newChanges);
      }
    }
  };

  return {
    handleDragEnd,
  };
}