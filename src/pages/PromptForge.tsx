import React, { useState, useEffect } from "react";
import { useChat } from "@/contexts/ChatContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Copy, Edit, Trash2, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { BackToChatButton } from "@/components/ui/BackToChatButton";

const QUICK_PROMPT_KEY = "nyxchat-quick-prompts-v1";
const DEFAULT_QUICK_PROMPTS = [
  "Explain Quantum Physics in simple terms",
  "Write a haiku about the moon",
  "Fix a bug in my code",
  "How do I stay motivated?"
];

export default function PromptForge() {
  const [inputPrompt, setInputPrompt] = useState("");
  const [enrichedPrompt, setEnrichedPrompt] = useState("");
  const [template, setTemplate] = useState("none");
  const [creativity, setCreativity] = useState(0.5);
  const [focus, setFocus] = useState("balanced");
  const [sortedPrompts, setSortedPrompts] = useState<any[]>([]);
  const [editingPrompt, setEditingPrompt] = useState<any>(null);
  const { currentProfile, sendMessage } = useChat();

  // Quick Prompts (Settings Control)
  const [quickPrompts, setQuickPrompts] = useState<string[]>(DEFAULT_QUICK_PROMPTS);
  useEffect(() => {
    const stored = localStorage.getItem(QUICK_PROMPT_KEY);
    if (stored) setQuickPrompts(JSON.parse(stored));
  }, []);
  const handleQuickPromptChange = (idx: number, txt: string) => {
    const updated = [...quickPrompts];
    updated[idx] = txt;
    setQuickPrompts(updated);
    localStorage.setItem(QUICK_PROMPT_KEY, JSON.stringify(updated));
  };
  const handleQuickPromptReorder = (from: number, to: number) => {
    const moved = [...quickPrompts];
    const [item] = moved.splice(from, 1);
    moved.splice(to, 0, item);
    setQuickPrompts(moved);
    localStorage.setItem(QUICK_PROMPT_KEY, JSON.stringify(moved));
  };
  const handleRestoreDefaults = () => {
    setQuickPrompts(DEFAULT_QUICK_PROMPTS);
    localStorage.setItem(QUICK_PROMPT_KEY, JSON.stringify(DEFAULT_QUICK_PROMPTS));
  };

  // Send Prompt to Chat
  const handleSendToChat = (enrichedPrompt: string) => {
    sendMessage(enrichedPrompt);
    toast.success("Prompt sent to chat!");
  };

  // Generate enhanced prompt
  const handleGeneratePrompt = async () => {
    if (!inputPrompt.trim()) {
      toast.error("Please enter a base prompt first");
      return;
    }

    // In a real implementation, this would call an API to enhance the prompt
    // For now, we'll just simulate it
    const templatePrefix = template === "none" ? "" : 
      template === "creative" ? "As a creative writer, " :
      template === "coder" ? "As a software developer, " :
      template === "analyst" ? "As a data analyst, " : "";
    
    const creativityAdjective = creativity < 0.3 ? "conservative" : 
      creativity > 0.7 ? "creative and imaginative" : "balanced";
    
    const focusDirective = focus === "clarity" ? "Focus on clarity and simplicity. " :
      focus === "detail" ? "Provide detailed and comprehensive information. " :
      "Maintain a balanced approach. ";
    
    const enhanced = `${templatePrefix}${focusDirective}Please respond in a ${creativityAdjective} way to the following: ${inputPrompt}`;
    
    setEnrichedPrompt(enhanced);
    toast.success("Prompt enhanced!");
  };

  // Save prompt to library
  const savePromptToLibrary = () => {
    if (!enrichedPrompt) return;
    
    const newPrompt = {
      id: crypto.randomUUID(),
      title: inputPrompt.substring(0, 30) + (inputPrompt.length > 30 ? "..." : ""),
      content: enrichedPrompt,
      tags: [template !== "none" ? template : "general", focus, creativityLevel()],
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    };
    
    // In a real implementation, this would save to IndexedDB
    // For now, we'll just simulate it with localStorage
    const savedPrompts = JSON.parse(localStorage.getItem("promptforge-library") || "[]");
    savedPrompts.push(newPrompt);
    localStorage.setItem("promptforge-library", JSON.stringify(savedPrompts));
    
    setSortedPrompts([newPrompt, ...sortedPrompts]);
    toast.success("Prompt saved to library!");
  };

  // Helper for creativity level text
  const creativityLevel = () => {
    if (creativity < 0.3) return "conservative";
    if (creativity > 0.7) return "creative";
    return "balanced";
  };

  // Load prompts on mount
  useEffect(() => {
    const savedPrompts = JSON.parse(localStorage.getItem("promptforge-library") || "[]");
    setSortedPrompts(savedPrompts);
  }, []);

  // Delete prompt
  const confirmDeletePrompt = (prompt: any) => {
    if (confirm("Are you sure you want to delete this prompt?")) {
      const updatedPrompts = sortedPrompts.filter(p => p.id !== prompt.id);
      setSortedPrompts(updatedPrompts);
      localStorage.setItem("promptforge-library", JSON.stringify(updatedPrompts));
      toast.success("Prompt deleted!");
    }
  };

  // Main UI
  return (
    <div className="max-w-3xl mx-auto py-6 px-2">
      <BackToChatButton />
      <h1 className="text-2xl font-bold mb-4">PromptForge</h1>
      <p className="text-muted-foreground mb-6">
        Create, enhance, and manage prompts for your AI assistant.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <label className="text-sm font-medium mb-1 block">Template</label>
          <Select value={template} onValueChange={setTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Template</SelectItem>
              <SelectItem value="creative">Creative Writer</SelectItem>
              <SelectItem value="coder">Coder</SelectItem>
              <SelectItem value="analyst">Analyst</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1">
          <label className="text-sm font-medium mb-1 block">Creativity: {creativityLevel()}</label>
          <Slider 
            value={[creativity]} 
            min={0} 
            max={1} 
            step={0.1} 
            onValueChange={([val]) => setCreativity(val)} 
          />
        </div>
        
        <div className="flex-1">
          <label className="text-sm font-medium mb-1 block">Focus</label>
          <Select value={focus} onValueChange={setFocus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="clarity">Clarity</SelectItem>
              <SelectItem value="balanced">Balanced</SelectItem>
              <SelectItem value="detail">Detail</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Textarea 
        className="mt-4 font-mono bg-card border-accent min-h-[88px]"
        value={inputPrompt}
        onChange={e => setInputPrompt(e.target.value)}
        rows={4}
        placeholder="Write your base prompt..."
      />
      
      <div className="flex gap-2 mt-3">
        <Button onClick={handleGeneratePrompt}>Generate Prompt</Button>
        {enrichedPrompt && (
          <>
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(enrichedPrompt)}>
              Copy to Clipboard
            </Button>
            <Button onClick={() => handleSendToChat(enrichedPrompt)} variant="secondary">
              Send to Chat
            </Button>
            <Button onClick={savePromptToLibrary} variant="ghost">
              Save to Library
            </Button>
          </>
        )}
      </div>
      
      {/* Output */}
      {enrichedPrompt && (
        <div className="mt-4 bg-muted rounded p-4 shadow-inner animate-fade-in font-mono">
          {enrichedPrompt}
        </div>
      )}

      {/* --- Quick Prompt Management UI --- */}
      <div className="mt-8">
        <h3 className="font-bold text-lg mb-2">Manage Quick Prompts</h3>
        {quickPrompts.map((q, idx) => (
          <div key={idx} className="flex gap-2 items-center mb-2">
            <Button
              variant="ghost"
              size="icon"
              disabled={idx === 0}
              onClick={() => handleQuickPromptReorder(idx, idx - 1)}
              title="Move up"
            >↑</Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={idx === quickPrompts.length - 1}
              onClick={() => handleQuickPromptReorder(idx, idx + 1)}
              title="Move down"
            >↓</Button>
            <Input
              value={q}
              className="flex-1"
              onChange={e => handleQuickPromptChange(idx, e.target.value)}
            />
          </div>
        ))}
        <div className="flex gap-2 mt-2">
          <Button variant="outline" onClick={handleRestoreDefaults}>Restore Defaults</Button>
        </div>
      </div>
      
      {/* --- Prompt Library: Card Grid --- */}
      <div className="mt-12">
        <h3 className="font-bold text-xl mb-4">Prompt Library</h3>
        {/* Cards: responsive grid, show title/preview/tags/date/stats/actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedPrompts.map(p => (
            <div className="bg-background rounded-lg p-4 shadow group hover:shadow-lg transition relative" key={p.id}>
              <div className="flex flex-col">
                <span className="font-semibold text-primary group-hover:underline">{p.title}</span>
                <span className="text-xs opacity-80 mt-1">{p.tags?.slice(0,3).join(", ")}</span>
                <span className="text-xs opacity-60 mt-1">Created {formatDistanceToNow(new Date(p.createdAt))} · Used {p.usageCount || 0}x</span>
                <div className="text-sm mt-2 line-clamp-3">{p.content.slice(0, 120)}</div>
              </div>
              <div className="absolute top-2 right-2 flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => navigator.clipboard.writeText(p.content)} title="Copy"><Copy className="w-4 h-4"/></Button>
                <Button size="icon" variant="ghost" onClick={() => setEditingPrompt(p)} title="Edit"><Edit className="w-4 h-4"/></Button>
                <Button size="icon" variant="destructive" onClick={() => confirmDeletePrompt(p)} title="Delete"><Trash2 className="w-4 h-4"/></Button>
                <Button size="icon" variant="secondary" onClick={() => handleSendToChat(p.content)} title="Send to Chat"><Send className="w-4 h-4"/></Button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Edit Modal (placeholder) */}
        {editingPrompt && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-4 rounded-lg w-full max-w-md">
              <h3 className="font-bold mb-2">Edit Prompt</h3>
              <Input 
                value={editingPrompt.title} 
                onChange={e => setEditingPrompt({...editingPrompt, title: e.target.value})}
                className="mb-2"
                placeholder="Title"
              />
              <Textarea 
                value={editingPrompt.content}
                onChange={e => setEditingPrompt({...editingPrompt, content: e.target.value})}
                className="mb-2"
                placeholder="Content"
                rows={5}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingPrompt(null)}>Cancel</Button>
                <Button onClick={() => {
                  const updated = sortedPrompts.map(p => 
                    p.id === editingPrompt.id ? {...editingPrompt, updatedAt: new Date()} : p
                  );
                  setSortedPrompts(updated);
                  localStorage.setItem("promptforge-library", JSON.stringify(updated));
                  setEditingPrompt(null);
                  toast.success("Prompt updated!");
                }}>Save</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
