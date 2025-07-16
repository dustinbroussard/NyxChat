
import React from 'react';
import { motion } from 'framer-motion';
import { MemoryEntry } from '@/types/memory';
import { formatDistanceToNow } from 'date-fns';

interface MemoryVisualizationProps {
  memories: MemoryEntry[];
  onSelectMemory: (memory: MemoryEntry) => void;
}

export const MemoryVisualization: React.FC<MemoryVisualizationProps> = ({
  memories,
  onSelectMemory,
}) => {
  // Group memories by month for timeline
  const timelineGroups = memories.reduce((acc, memory) => {
    const monthKey = memory.createdAt.toISOString().slice(0, 7); // YYYY-MM
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(memory);
    return acc;
  }, {} as Record<string, MemoryEntry[]>);

  // Generate tag cloud data from optional tags
  const tagCounts = memories.reduce((acc, memory) => {
    memory.tags?.forEach(tag => {
      if (!tag.startsWith('profile:')) {
        acc[tag] = (acc[tag] || 0) + 1;
      }
    });
    return acc;
  }, {} as Record<string, number>);

  const maxCount = Math.max(...Object.values(tagCounts), 1);

  return (
    <div className="space-y-6">
      {/* Memory Timeline */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Memory Timeline</h4>
        <div className="space-y-4 max-h-40 overflow-y-auto">
          {Object.entries(timelineGroups)
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 6)
            .map(([month, monthMemories]) => (
              <div key={month} className="space-y-2">
                <div className="text-xs text-muted-foreground font-medium">
                  {new Date(month + '-01').toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {monthMemories.slice(0, 3).map(memory => (
                    <motion.button
                      key={memory.id}
                      onClick={() => onSelectMemory(memory)}
                      className="text-left p-2 text-xs bg-muted/30 hover:bg-muted/50 rounded border-l-2 border-primary/30 transition-colors"
                      whileHover={{ x: 2 }}
                    >
                      <div className="truncate">{memory.content}</div>
                      <div className="text-muted-foreground text-[10px] mt-1">
                        {formatDistanceToNow(memory.createdAt, { addSuffix: true })}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Tag Cloud */}
      {Object.keys(tagCounts).length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Memory Tags</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(tagCounts)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 12)
              .map(([tag, count]) => {
                const intensity = count / maxCount;
                const opacity = 0.3 + (intensity * 0.7);
                const size = 0.7 + (intensity * 0.3);
                
                return (
                  <motion.span
                    key={tag}
                    className="px-2 py-1 bg-primary/20 rounded-full cursor-pointer hover:bg-primary/30 transition-colors"
                    style={{ 
                      opacity,
                      fontSize: `${size}rem`,
                      lineHeight: 1.2
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {tag} ({count})
                  </motion.span>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
