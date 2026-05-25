"use client"

import { useEffect, useState, startTransition } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  History, 
  Trash2, 
  Play, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Sparkles, 
  Lock,
  MessageSquareCode,
  Calendar,
  Layers,
  Terminal
} from 'lucide-react';
import { getMissionHistory, deleteMissionHistory } from '@/lib/actions/history';
import { formatDistanceToNow } from 'date-fns';

interface HistoryItem {
  id: string;
  taskDescription: string;
  selectedAI: string;
  aiUrl: string | null;
  reasoning: string;
  optimizedPrompt: string;
  isImageTask: boolean;
  executionOutput: string | null;
  createdAt: Date;
}

export function HistoryTab({ onRelaunch }: { onRelaunch: (task: string) => void }) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch history from DB
  const loadHistory = async () => {
    if (!session) {
      setHistory([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const records = await getMissionHistory();
      // Cast the Date since Prisma returns Date objects
      const formatted: HistoryItem[] = records.map((r: any) => ({
        ...r,
        createdAt: new Date(r.createdAt)
      }));
      setHistory(formatted);
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Fetch Failed",
        description: "Unable to retrieve your mission history from cloud database."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [session]);

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteMissionHistory(id);
      if (success) {
        setHistory(prev => prev.filter(item => item.id !== id));
        toast({
          title: "Mission Erased",
          description: "Database entry permanently deleted."
        });
      } else {
        throw new Error();
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "Could not remove history item."
      });
    }
  };

  const copyPrompt = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        title: "Copied to Clipboard",
        description: "Optimized prompt transferred."
      });
    } catch (err) {}
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter history based on search query
  const filteredHistory = history.filter(item => 
    item.taskDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.selectedAI.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.optimizedPrompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto py-16 animate-in fade-in duration-700">
        <Card className="glass-panel border-white/10 p-12 text-center space-y-8 bg-black/40">
          <div className="mx-auto h-20 w-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground shadow-inner">
            <Lock className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-3">
            <h3 className="text-3xl font-black text-white uppercase tracking-tight">Security Lock Active</h3>
            <p className="text-muted-foreground font-medium max-w-md mx-auto">
              Please sign in with Google under the Settings tab to sync and access your mission history database.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-4">
          <h2 className="text-5xl font-black tracking-tighter text-white font-headline flex items-center gap-3">
            <History className="h-10 w-10 text-primary" />
            Mission Log
          </h2>
          <p className="text-xl text-muted-foreground font-medium max-w-xl">
            Review previous prompts, model selections, and response outputs saved to PostgreSQL.
          </p>
        </div>
        
        {history.length > 0 && (
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30 group-focus-within:text-primary transition-colors" />
            <input 
              placeholder="Search history..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-6 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-all font-semibold"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-24 text-center space-y-4">
          <div className="relative inline-block">
            <div className="h-14 w-14 rounded-full border-2 border-primary border-t-transparent animate-spin flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-black uppercase tracking-widest">Accessing records...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <Card className="glass-panel border-white/10 p-16 text-center space-y-6">
          <div className="mx-auto h-20 w-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground shadow-inner">
            <History className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white">
              {searchQuery ? "No Matching Missions" : "No Missions Dispatched"}
            </h3>
            <p className="text-muted-foreground font-medium max-w-md mx-auto">
              {searchQuery 
                ? "Refine your search parameters to locate previous data streams." 
                : "Your routing activities will be stored in PostgreSQL automatically once you start executing missions."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredHistory.map((item) => {
            const isExpanded = !!expandedItems[item.id];
            
            return (
              <Card key={item.id} className="glass-panel border-white/5 overflow-hidden hover:border-white/15 transition-all duration-300">
                <CardHeader className="p-8 pb-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-4 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge className="bg-primary text-primary-foreground font-black text-[10px] px-3.5 py-1 uppercase tracking-widest">
                          {item.selectedAI}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-white/10 bg-white/5 text-muted-foreground">
                          {item.isImageTask ? 'Image Synthesizer' : 'Language Core'}
                        </Badge>
                        <div className="flex items-center gap-1.5 text-xs text-white/40 font-bold uppercase tracking-wider">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-white leading-relaxed">
                        {item.taskDescription}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        onClick={() => onRelaunch(item.taskDescription)}
                        className="h-12 w-12 rounded-xl bg-white text-black hover:bg-primary hover:text-white transition-all shadow-lg"
                        title="Relaunch Mission"
                      >
                        <Play className="h-5 w-5 fill-current" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleDelete(item.id)}
                        className="h-12 w-12 rounded-xl hover:bg-destructive/10 text-white/40 hover:text-destructive transition-all border border-white/10"
                        title="Delete record"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-8 pt-2 space-y-6 border-t border-white/5 bg-white/[0.01]">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
                      <Layers className="h-3.5 w-3.5" />
                      Reasoning Protocol
                    </div>
                    <p className="text-sm font-medium text-white/70 italic leading-relaxed">
                      "{item.reasoning}"
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-accent">
                        <MessageSquareCode className="h-3.5 w-3.5" />
                        Optimized Prompt
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyPrompt(item.id, item.optimizedPrompt)}
                        className="h-8 text-xs font-bold text-white/50 hover:text-white rounded-lg hover:bg-white/5 px-3"
                      >
                        {copiedId === item.id ? (
                          <><Check className="mr-1 h-3 w-3 text-emerald-500" /> Copied</>
                        ) : (
                          <><Copy className="mr-1 h-3 w-3" /> Copy</>
                        )}
                      </Button>
                    </div>
                    <div className="p-5 rounded-2xl bg-black/40 border border-white/5 font-mono text-sm text-white/90 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap select-all">
                      {item.optimizedPrompt}
                    </div>
                  </div>

                  {item.executionOutput && (
                    <div className="space-y-3 border-t border-white/5 pt-6">
                      <Button
                        variant="ghost"
                        onClick={() => toggleExpand(item.id)}
                        className="w-full flex justify-between items-center h-10 px-0 hover:bg-transparent text-white/60 hover:text-white"
                      >
                        <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-400">
                          <Terminal className="h-3.5 w-3.5" />
                          Execution Output payload
                        </span>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      
                      {isExpanded && (
                        <div className="p-6 rounded-2xl bg-black/60 border border-white/5 text-sm leading-relaxed max-h-60 overflow-y-auto">
                          {item.executionOutput.startsWith('data:image/') ? (
                            <div className="flex justify-center">
                              <img 
                                src={item.executionOutput} 
                                alt="Execution visual output" 
                                className="max-h-56 rounded-xl border border-white/10" 
                              />
                            </div>
                          ) : (
                            <div className="text-white/80 font-mono whitespace-pre-wrap">
                              {item.executionOutput}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
