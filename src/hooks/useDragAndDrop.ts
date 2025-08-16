import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { PlaylistVideo } from "@/lib/types";

export function useDragAndDrop(
  videos: PlaylistVideo[],
  setVideos: (videos: PlaylistVideo[]) => void,
  pendingChanges: Map<string, number>,
  setPendingChanges: (changes: Map<string, number>) => void,
  currentPage: number,
  videosPerPage: number
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
        
        // Calculate the absolute position in the playlist
        // Page offset: (currentPage - 1) * videosPerPage
        // Absolute position: pageOffset + newIndex (0-based for API)
        const pageOffset = (currentPage - 1) * videosPerPage;
        const absolutePosition = pageOffset + newIndex;
        
        // Add to pending changes with absolute position
        const newChanges = new Map(pendingChanges);
        newChanges.set(active.id as string, absolutePosition);
        setPendingChanges(newChanges);
      }
    }
  };

  return {
    handleDragEnd,
  };
}