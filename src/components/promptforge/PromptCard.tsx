
import React from 'react';
import { Edit, Copy, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface PromptCardProps {
  prompt: {
    id: string;
    title: string;
    content: string;
    tags: string[];
    usage: number;
    createdAt: string;
    updatedAt: string;
  };
  onEdit: (id: string) => void;
  onCopy: (id: string) => void;
  onDelete: (id: string) => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  onEdit,
  onCopy,
  onDelete,
}) => {
  return (
    <div className="bg-card rounded-xl border shadow p-5 flex flex-col group transition hover:shadow-lg animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold mb-1 text-base truncate">{prompt.title}</h3>
          <p className="text-muted-foreground text-xs mb-2 line-clamp-2">{prompt.content}</p>
        </div>
        <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition">
          <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => onEdit(prompt.id)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" aria-label="Copy" onClick={() => onCopy(prompt.id)}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => onDelete(prompt.id)}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex gap-2 mt-2 flex-wrap">
        {prompt.tags.slice(0, 3).map((tag, i) => (
          <span key={tag} className="text-xs bg-accent text-accent-foreground rounded px-2 py-0.5">
            {tag}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
        <span>Used {prompt.usage}x</span>
        <span>
          {new Date(prompt.updatedAt || prompt.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};
