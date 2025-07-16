
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash, Plus, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface QuickAction {
  id: string;
  name: string;
  prompt: string;
  icon: string;
}

export const QuickActionsSettings = () => {
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [editingAction, setEditingAction] = useState<QuickAction | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    prompt: '',
    icon: 'fas fa-comment'
  });

  useEffect(() => {
    const saved = localStorage.getItem('nyx-quick-actions');
    if (saved) {
      setQuickActions(JSON.parse(saved));
    } else {
      const defaults = [
        { id: '1', name: 'Write Email', prompt: 'Help me write a professional email', icon: 'fas fa-envelope' },
        { id: '2', name: 'Explain', prompt: 'Explain a complex concept', icon: 'fas fa-lightbulb' },
        { id: '3', name: 'Brainstorm', prompt: 'Help me brainstorm ideas', icon: 'fas fa-brain' },
        { id: '4', name: 'Code Review', prompt: 'Review my code', icon: 'fas fa-code' }
      ];
      setQuickActions(defaults);
    }
  }, []);

  const saveQuickActions = (actions: QuickAction[]) => {
    setQuickActions(actions);
    localStorage.setItem('nyx-quick-actions', JSON.stringify(actions));
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.prompt.trim()) {
      toast.error('Name and prompt are required');
      return;
    }

    if (editingAction) {
      const updated = quickActions.map(action =>
        action.id === editingAction.id
          ? { ...editingAction, ...formData }
          : action
      );
      saveQuickActions(updated);
      toast.success('Quick action updated');
    } else {
      const newAction: QuickAction = {
        id: Date.now().toString(),
        ...formData
      };
      saveQuickActions([...quickActions, newAction]);
      toast.success('Quick action added');
    }

    setFormData({ name: '', prompt: '', icon: 'fas fa-comment' });
    setEditingAction(null);
  };

  const handleEdit = (action: QuickAction) => {
    setEditingAction(action);
    setFormData({
      name: action.name,
      prompt: action.prompt,
      icon: action.icon
    });
  };

  const handleDelete = (id: string) => {
    const updated = quickActions.filter(action => action.id !== id);
    saveQuickActions(updated);
    toast.success('Quick action deleted');
  };

  const commonIcons = [
    'fas fa-envelope', 'fas fa-lightbulb', 'fas fa-brain', 'fas fa-code',
    'fas fa-book', 'fas fa-calculator', 'fas fa-paint-brush', 'fas fa-music',
    'fas fa-camera', 'fas fa-chart-bar', 'fas fa-globe', 'fas fa-heart',
    'fas fa-star', 'fas fa-comment', 'fas fa-question', 'fas fa-rocket'
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Customize the quick action buttons that appear on the welcome screen.
        </p>
      </div>

      {/* Quick Actions List */}
      <div className="space-y-2">
        {quickActions.map((action) => (
          <div key={action.id} className="flex items-center gap-3 p-3 border rounded-lg">
            <i className={`${action.icon} text-lg text-primary`} />
            <div className="flex-1">
              <p className="font-medium">{action.name}</p>
              <p className="text-sm text-muted-foreground truncate">{action.prompt}</p>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleEdit(action)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => handleDelete(action.id)}
              >
                <Trash className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form */}
      <div className="border-t pt-4 space-y-4">
        <h4 className="font-medium">
          {editingAction ? 'Edit Quick Action' : 'Add Quick Action'}
        </h4>

        <div className="grid gap-4">
          <div>
            <Label htmlFor="action-name">Name</Label>
            <Input
              id="action-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Write Email"
            />
          </div>

          <div>
            <Label htmlFor="action-prompt">Prompt</Label>
            <Input
              id="action-prompt"
              value={formData.prompt}
              onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
              placeholder="e.g., Help me write a professional email"
            />
          </div>

          <div>
            <Label htmlFor="action-icon">Icon</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="action-icon"
                value={formData.icon}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="FontAwesome class (e.g., fas fa-envelope)"
              />
              <i className={`${formData.icon} text-lg text-primary`} />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {commonIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  className="p-2 border rounded hover:bg-accent"
                  onClick={() => setFormData(prev => ({ ...prev, icon }))}
                >
                  <i className={`${icon} text-sm`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave}>
            <Plus className="w-4 h-4 mr-2" />
            {editingAction ? 'Update' : 'Add'} Action
          </Button>
          {editingAction && (
            <Button
              variant="outline"
              onClick={() => {
                setEditingAction(null);
                setFormData({ name: '', prompt: '', icon: 'fas fa-comment' });
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
