
"use client"

import { useState } from 'react';
import { SUPPORTED_AIS } from '@/lib/ai-data';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Sparkles, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";




export function DirectoryTab() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    modelName: '',
    modelUrl: '',
    description: ''
  });

  const handleSubmitModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.modelName || !formData.modelUrl) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit model');
      }

      toast({
        title: "Model Intelligence Logged",
        description: "Your model parameters have been saved to the database.",
      });
      
      setFormData({ modelName: '', modelUrl: '', description: '' });
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Could not save model data. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="text-center space-y-4">
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter text-glow">
          The Global <span className="text-primary italic">Fleet</span>
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          We route your mission to the world's most advanced intelligence platforms in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {SUPPORTED_AIS.map((ai) => (
          <Card key={ai.id} className="glass-panel border-white/5 group hover:border-primary/40 transition-all duration-500 overflow-hidden relative">
            <div className={`absolute -bottom-8 -right-8 p-3 opacity-5 group-hover:opacity-10 transition-opacity duration-1000`}>
              <ai.icon className={`h-32 w-32 ${ai.color}`} />
            </div>
            <CardHeader className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:bg-primary/20 group-hover:border-primary/30 transition-colors">
                  <ai.icon className={`h-6 w-6 ${ai.color}`} />
                </div>
                <Badge variant="outline" className="text-[10px] uppercase tracking-widest bg-white/5 border-white/10">
                  {ai.category}
                </Badge>
              </div>
              <CardTitle className="text-xl font-bold text-white group-hover:text-primary transition-colors">{ai.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <p className="text-muted-foreground text-sm leading-relaxed min-h-[60px]">
                {ai.description}
              </p>
            </CardContent>
            <CardFooter className="p-6">
              <Button 
                variant="ghost" 
                className="w-full justify-between bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/5" 
                onClick={() => window.open(ai.url, '_blank')}
              >
                Access Hub
                <ExternalLink className="h-4 w-4 ml-2 opacity-50" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="hero-gradient border border-primary/20 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <CardContent className="p-12 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="space-y-4">
            <h3 className="text-3xl font-black text-white flex items-center justify-center md:justify-start gap-3">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
              Dynamic Expansion
            </h3>
            <p className="text-white/70 text-lg max-w-xl">
              New models are launching every week. Our orchestrator updates its intelligence fleet automatically to ensure you always have the latest tech.
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-white/90 rounded-2xl px-12 py-8 text-lg font-black uppercase tracking-tighter transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/5"
              >
                Submit a Model
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-panel border-white/10 text-white rounded-[2rem] max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight">Mission Briefing: New Model</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Suggest a new intelligence source for the global fleet.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitModel} className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="modelName" className="text-xs font-black uppercase tracking-widest text-primary">Model Name</Label>
                  <Input 
                    id="modelName" 
                    placeholder="e.g. DeepSeek-V3" 
                    className="bg-white/5 border-white/10 rounded-xl h-12 text-white"
                    value={formData.modelName}
                    onChange={(e) => setFormData({...formData, modelName: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modelUrl" className="text-xs font-black uppercase tracking-widest text-primary">Access URL</Label>
                  <Input 
                    id="modelUrl" 
                    type="url"
                    placeholder="https://..." 
                    className="bg-white/5 border-white/10 rounded-xl h-12 text-white"
                    value={formData.modelUrl}
                    onChange={(e) => setFormData({...formData, modelUrl: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-primary">Specialization</Label>
                  <Textarea 
                    id="description" 
                    placeholder="What makes this model special?" 
                    className="bg-white/5 border-white/10 rounded-xl min-h-[100px] text-white"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <DialogFooter className="sm:justify-end gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setIsDialogOpen(false)}
                    className="text-white hover:bg-white/5 rounded-xl"
                  >
                    Abort
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-xl px-8"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    Confirm Entry
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
