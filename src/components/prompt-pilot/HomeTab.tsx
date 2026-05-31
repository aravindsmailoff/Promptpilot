
"use client"

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  Loader2, 
  Copy, 
  RefreshCw, 
  Check, 
  Sparkles, 
  Zap, 
  ArrowRight, 
  ImagePlus, 
  FileTerminal, 
  X, 
  FileText,
  Activity,
  Cpu,
  Layers,
  Trash2,
  ExternalLink,
  Info,
  User
} from 'lucide-react';
import { analyzeTaskAndGeneratePrompt } from '@/ai/flows/analyze-task-and-generate-prompt';
import { refinePrompt } from '@/ai/flows/refine-prompt-flow';
import { executePromptViaApi } from '@/ai/actions/execute-prompt';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getAIById } from '@/lib/ai-data';
import Image from 'next/image';
import { useSettings } from '@/components/providers/SettingsProvider';
import { saveMissionHistory, updateMissionHistoryOutput, updateMissionHistoryPrompt } from '@/lib/actions/history';
import { parseOfficeFileAction } from '@/lib/actions/parse-file';
import { useSession } from 'next-auth/react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { HumanizerEditor } from './HumanizerEditor';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'image' | 'video';
  optimizedPrompt?: string;
}

interface HomeTabProps {
  relaunchTask?: string | null;
  clearRelaunchTask?: () => void;
}

export function HomeTab({ relaunchTask, clearRelaunchTask }: HomeTabProps) {
  const { data: session } = useSession();
  const { settings, updateSetting } = useSettings();
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [task, setTask] = useState('');

  useEffect(() => {
    if (relaunchTask) {
      setTask(relaunchTask);
      if (clearRelaunchTask) {
        clearRelaunchTask();
      }
    }
  }, [relaunchTask, clearRelaunchTask]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [refining, setRefining] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [refineInput, setRefineInput] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [outputCopied, setOutputCopied] = useState(false);

  // Chat refinement states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [viewedPromptId, setViewedPromptId] = useState<string | null>(null);

  
  // Automation states
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<string | null>(null);
  
  // Multimodal states
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [fileText, setFileText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, executing]);

  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUri(reader.result as string);
        toast({ title: "Visual Intel Locked", description: file.name });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isOfficeOrPdf = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i.test(file.name);
      
      if (isOfficeOrPdf) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            toast({ title: "Syncing Data Stream", description: `Extracting text from ${file.name}...` });
            const resultString = reader.result as string;
            const base64Data = resultString.split(',')[1];
            if (!base64Data) {
              throw new Error("Could not read file data.");
            }
            const parsedText = await parseOfficeFileAction(base64Data, file.name);
            setFileText(parsedText);
            setFileName(file.name);
            toast({ title: "Data Stream Synced", description: `${file.name} loaded successfully.` });
          } catch (err: any) {
            toast({
              variant: "destructive",
              title: "Extraction Failed",
              description: err.message || "Could not parse document."
            });
          }
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFileText(reader.result as string);
          setFileName(file.name);
          toast({ title: "Data Stream Synced", description: file.name });
        };
        reader.readAsText(file);
      }
    }
  };

  const handleRoute = async () => {
    if (!task.trim()) return;
    setLoading(true);
    try {
      const output = await analyzeTaskAndGeneratePrompt({ 
        taskDescription: task,
        imageUri: imageUri || undefined,
        fileText: fileText || undefined,
        settings: {
          useOllama: settings.useOllama,
          ollamaBaseUrl: settings.ollamaBaseUrl,
          ollamaModel: settings.ollamaModel,
          localEngine: settings.localEngine,
          pythonServerUrl: settings.pythonServerUrl
        }
      });
      
      setResult({ ...output, refinements: 0 });
      setChatMessages([]);
      
      toast({
        title: "Autonomous Routing Complete",
        description: `Mission assigned to ${output.selectedAI}`
      });

      // Save mission to DB if logged in
      let savedId: string | null = null;
      const isImage = output.selectedAI ? getAIById(output.selectedAI)?.category === 'Image Generation' : false;
      const isVideo = output.selectedAI ? getAIById(output.selectedAI)?.category === 'Video Generation' : false;
      if (session) {
        savedId = await saveMissionHistory({
          taskDescription: task,
          selectedAI: output.selectedAI,
          aiUrl: output.aiUrl,
          reasoning: output.reasoning,
          optimizedPrompt: output.optimizedPrompt,
          isImageTask: isImage || isVideo
        });
        setCurrentHistoryId(savedId);
      } else {
        setCurrentHistoryId(null);
      }

      // Auto-deploy execution agent
      handleAutoExecute(output.optimizedPrompt, isImage, isVideo, savedId);
    } catch (err) {
      console.error("Routing Error:", err);
      toast({
        variant: "destructive",
        title: "Routing Error",
        description: "Orchestrator encountered a sync issue."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!feedback.trim() || !result) return;
    setLoading(true);
    try {
      const output = await refinePrompt({ 
        previousPrompt: result.optimizedPrompt,
        feedback: feedback,
        settings: {
          useOllama: settings.useOllama,
          ollamaBaseUrl: settings.ollamaBaseUrl,
          ollamaModel: settings.ollamaModel,
          localEngine: settings.localEngine,
          pythonServerUrl: settings.pythonServerUrl
        }
      });
      
      const newRefinements = (result.refinements || 0) + 1;
      setResult({ ...result, optimizedPrompt: output.refinedPrompt, refinements: newRefinements });
      
      setRefining(false);
      setFeedback('');
      toast({
        title: "Parameters Injected",
        description: "Tactical data successfully applied."
      });

      // Save refined mission to DB if logged in
      let savedId: string | null = currentHistoryId;
      const isImage = result?.selectedAI ? getAIById(result.selectedAI)?.category === 'Image Generation' : false;
      const isVideo = result?.selectedAI ? getAIById(result.selectedAI)?.category === 'Video Generation' : false;
      if (session) {
        if (savedId) {
          await updateMissionHistoryPrompt(savedId, output.refinedPrompt);
        } else {
          savedId = await saveMissionHistory({
            taskDescription: task,
            selectedAI: result.selectedAI,
            aiUrl: result.aiUrl,
            reasoning: result.reasoning,
            optimizedPrompt: output.refinedPrompt,
            isImageTask: isImage || isVideo
          });
          setCurrentHistoryId(savedId);
        }
      } else {
        setCurrentHistoryId(null);
      }

      // Auto-deploy execution agent with refined prompt
      handleAutoExecute(output.refinedPrompt, isImage, isVideo, savedId);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Refinement Error",
        description: "Failed to inject new parameters."
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      if (!result?.optimizedPrompt) return;
      await navigator.clipboard.writeText(result.optimizedPrompt);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {}
  };

  const openAI = async () => {
    if (!result?.optimizedPrompt) return;
    await openAIViaPrompt(result.optimizedPrompt);
  };

  const handleRefineWithInput = async (saveCredits: boolean = false) => {
    if (!refineInput.trim() || !result) return;
    const inputFeedback = refineInput;
    setRefineInput('');
    setLoading(true);

    try {
      const output = await analyzeTaskAndGeneratePrompt({
        taskDescription: inputFeedback,
        settings: {
          useOllama: settings.useOllama,
          ollamaBaseUrl: settings.ollamaBaseUrl,
          ollamaModel: settings.ollamaModel,
          localEngine: settings.localEngine,
          pythonServerUrl: settings.pythonServerUrl
        }
      });
      
      setResult({ ...output, refinements: 0 });
      
      let savedId: string | null = null;
      const isImage = getAIById(output.selectedAI)?.category === 'Image Generation';
      const isVideo = getAIById(output.selectedAI)?.category === 'Video Generation';
      if (session) {
        savedId = await saveMissionHistory({
          taskDescription: inputFeedback,
          selectedAI: output.selectedAI,
          aiUrl: output.aiUrl,
          reasoning: output.reasoning,
          optimizedPrompt: output.optimizedPrompt,
          isImageTask: isImage || isVideo
        });
        setCurrentHistoryId(savedId);
      } else {
        setCurrentHistoryId(null);
      }

      setLoading(false);

      if (saveCredits) {
        try {
          await navigator.clipboard.writeText(output.optimizedPrompt);
        } catch (clipErr) {
          console.warn("Clipboard copy failed:", clipErr);
        }
        toast({
          title: "Prompt Structured & Copied",
          description: "Optimized prompt updated and copied to clipboard. Credits saved!"
        });
      } else {
        await handleAutoExecute(output.optimizedPrompt, isImage, isVideo, savedId);
      }
    } catch (err: any) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Execution Error",
        description: err.message || "Failed to execute the new task."
      });
    }
  };

  const openAIViaPrompt = async (promptText: string) => {
    try {
      await navigator.clipboard.writeText(promptText);
      toast({
        title: "Prompt Copied",
        description: "Optimized prompt copied to clipboard. Ready to paste!"
      });
    } catch (err) {
      console.warn("Clipboard copy failed:", err);
    }

    let targetUrl = result?.aiUrl || 'https://gemini.google.com';
    const promptParam = encodeURIComponent(promptText);
    const lowerUrl = targetUrl.toLowerCase();
    
    if (lowerUrl.includes('gemini.google.com')) {
      targetUrl = `https://gemini.google.com/app?q=${promptParam}`;
    } else if (lowerUrl.includes('chatgpt.com')) {
      targetUrl = `https://chatgpt.com/?q=${promptParam}`;
    } else if (lowerUrl.includes('perplexity.ai')) {
      targetUrl = `https://www.perplexity.ai/?q=${promptParam}`;
    }

    window.open(targetUrl, '_blank');
  };

  const handleAutoExecute = async (overridePrompt?: string, forceIsImage?: boolean, forceIsVideo?: boolean, historyIdToUpdate?: string | null) => {
    const promptToRun = overridePrompt || result?.optimizedPrompt;
    if (!promptToRun) return;
    setExecuting(true);
    setExecutionResult(null);

    // If running a new top-level execution run, clear the chat messages history
    if (!overridePrompt) {
      setChatMessages([]);
    }

    const isImage = typeof forceIsImage === 'boolean'
      ? forceIsImage
      : (result ? getAIById(result.selectedAI)?.category === 'Image Generation' : false) || /create an image|generate an image|draw a|make an image|paint a/i.test(task);

    const isVideo = typeof forceIsVideo === 'boolean'
      ? forceIsVideo
      : (result ? getAIById(result.selectedAI)?.category === 'Video Generation' : false) || /create a video|generate a video|make a video|render a video/i.test(task);

    try {
      toast({
        title: isImage ? "Visual Synthesizer Deployed" : isVideo ? "Motion Synthesizer Deployed" : "Agent Deployed",
        description: isImage ? "Synthesizing image via secure API pipeline..." : isVideo ? "Synthesizing video via secure API pipeline..." : "Executing prompt via secure API pipeline..."
      });
      const output = await executePromptViaApi(
        promptToRun, 
        isImage, 
        isVideo,
        {
          useOllama: settings.useOllama,
          ollamaBaseUrl: settings.ollamaBaseUrl,
          ollamaModel: settings.ollamaModel,
          localEngine: settings.localEngine,
          pythonServerUrl: settings.pythonServerUrl
        }
      );
      setExecutionResult(output);

      // Append assistant message to chat
      setChatMessages(prev => {
        const messages = [...prev];
        if (messages.length === 0) {
          messages.push({
            id: `user-initial-${Date.now()}`,
            role: 'user',
            content: promptToRun
          });
        }
        messages.push({
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: output,
          type: isImage ? 'image' : isVideo ? 'video' : 'text',
          optimizedPrompt: promptToRun
        });
        return messages;
      });

      // Update DB history record if logged in and we have a valid history ID
      const activeHistoryId = historyIdToUpdate || currentHistoryId;
      if (activeHistoryId) {
        await updateMissionHistoryOutput(activeHistoryId, output);
      }

      toast({
        title: isImage ? "Synthesis Complete" : isVideo ? "Motion Synthesis Complete" : "Execution Complete",
        description: isImage ? "Image successfully generated." : isVideo ? "Video successfully generated." : "Data successfully extracted."
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setExecutionResult(errorMsg);

      // Append error message to chat
      setChatMessages(prev => {
        const messages = [...prev];
        if (messages.length === 0) {
          messages.push({
            id: `user-initial-${Date.now()}`,
            role: 'user',
            content: promptToRun
          });
        }
        messages.push({
          id: `assistant-err-${Date.now()}`,
          role: 'assistant',
          content: `Execution failed. Error: ${errorMsg}`,
          type: 'text',
          optimizedPrompt: promptToRun
        });
        return messages;
      });

      const activeHistoryId = historyIdToUpdate || currentHistoryId;
      if (activeHistoryId) {
        await updateMissionHistoryOutput(activeHistoryId, `Error: ${errorMsg}`);
      }

      toast({
        variant: "destructive",
        title: "Execution Error",
        description: "See output for details."
      });
    } finally {
      setExecuting(false);
    }
  };

  const copyOutputToClipboard = async () => {
    if (!executionResult) return;
    try {
      await navigator.clipboard.writeText(executionResult);
      setOutputCopied(true);
      setTimeout(() => setOutputCopied(false), 2000);
      toast({
        title: "Output Copied",
        description: "Execution payload transferred to clipboard."
      });
    } catch (e) {}
  };

  const downloadMessageResult = (msg: ChatMessage) => {
    const content = msg.content;
    const isImage = msg.type === 'image';
    if (isImage) {
      const a = document.createElement('a');
      a.href = content;
      a.download = `PromptPilot_Generated_Image.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast({
        title: "Image Downloaded",
        description: "Your AI-generated image was saved successfully."
      });
      return;
    }
    const isVideo = msg.type === 'video' || content.startsWith('data:video/') || content.endsWith('.mp4');
    if (isVideo) {
      const a = document.createElement('a');
      a.href = content;
      a.download = `PromptPilot_Generated_Video.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast({
        title: "Video Downloaded",
        description: "Your AI-generated video was saved successfully."
      });
      return;
    }
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PromptPilot_Execution_Output.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "File Downloaded",
      description: "Tactical data saved to local drive."
    });
  };

  const downloadResult = () => {
    if (!executionResult) return;
    const blob = new Blob([executionResult], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PromptPilot_Execution_Output.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRegenerateMessage = async (msgId: string) => {
    const index = chatMessages.findIndex(m => m.id === msgId);
    if (index === -1) return;
    const promptToRun = chatMessages[index].optimizedPrompt;
    if (!promptToRun) return;

    setExecuting(true);
    try {
      const isImage = result?.selectedAI ? getAIById(result.selectedAI)?.category === 'Image Generation' : false;
      const isVideo = result?.selectedAI ? getAIById(result.selectedAI)?.category === 'Video Generation' : false;
      const output = await executePromptViaApi(
        promptToRun, 
        isImage, 
        isVideo,
        {
          useOllama: settings.useOllama,
          ollamaBaseUrl: settings.ollamaBaseUrl,
          ollamaModel: settings.ollamaModel,
          localEngine: settings.localEngine,
          pythonServerUrl: settings.pythonServerUrl
        }
      );
      
      setChatMessages(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          content: output
        };
        return updated;
      });

      if (currentHistoryId) {
        await updateMissionHistoryOutput(currentHistoryId, output);
      }
      toast({ title: "Regenerated", description: "Response successfully updated." });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Regeneration Failed",
        description: err.message || "Could not regenerate response."
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleUpdateMessageContent = (msgId: string, newText: string) => {
    setChatMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: newText } : m));
    
    // Sync with main execution result state if it's the latest assistant message
    const assistantMessages = chatMessages.filter(m => m.role === 'assistant');
    const latestMsg = assistantMessages[assistantMessages.length - 1];
    if (latestMsg && latestMsg.id === msgId) {
      setExecutionResult(newText);
    }
    
    if (currentHistoryId) {
      updateMissionHistoryOutput(currentHistoryId, newText).catch(console.error);
    }
  };

  const togglePromptView = (msgId: string) => {
    setViewedPromptId(prev => prev === msgId ? null : msgId);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-1000 pb-20">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
          <Sparkles className="h-3 w-3 animate-pulse" />
          Neural Orchestration Engine
        </div>
        <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-white leading-[0.85] font-headline">
          Master Your <span className="text-primary text-glow italic">Missions</span>.
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-2xl mx-auto opacity-80">
          Sync visual intel and raw data. We deploy the world's most advanced AI for perfect execution.
        </p>
      </div>

      <Card className="glass-panel border-white/10 rounded-[3rem] overflow-hidden shadow-[0_32px_128px_-32px_rgba(0,0,0,0.8)] group relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] pointer-events-none animate-pulse" />
        <CardContent className="p-0">
          <div className="relative">
            <Textarea 
              id="objective-input"
              placeholder="Deploy your mission parameters here..."
              className="min-h-[280px] text-2xl md:text-3xl border-none focus-visible:ring-0 resize-none p-12 bg-transparent text-white placeholder:text-white/30 transition-all font-semibold leading-relaxed"
              style={{ color: 'white', WebkitTextFillColor: 'white' }}
              value={task}
              onChange={(e) => setTask(e.target.value)}
            />
            
            {/* Tactical Multimodal Previews */}
            <div className="flex flex-wrap gap-4 px-12 pb-8">
              {imageUri && (
                <div className="relative group/img animate-in zoom-in-95 duration-500">
                  <div className="absolute inset-0 bg-primary/40 blur-xl opacity-50 group-hover/img:opacity-100 transition-opacity" />
                  <div className="relative h-24 w-24 rounded-2xl overflow-hidden border-2 border-primary/50 shadow-2xl">
                    <Image src={imageUri} alt="Selection" fill className="object-cover" />
                    <button 
                      onClick={() => setImageUri(null)} 
                      className="absolute top-1 right-1 bg-black/80 rounded-full p-1.5 text-white hover:bg-destructive transition-colors z-10"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md whitespace-nowrap">
                    Visual Intel
                  </div>
                </div>
              )}
              {fileName && (
                <div className="relative group/doc animate-in slide-in-from-left-4 duration-500">
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-3 rounded-2xl text-xs text-white shadow-xl backdrop-blur-md group-hover:border-primary/50 transition-colors">
                    <div className="bg-primary/20 p-1.5 rounded-lg">
                      <FileTerminal className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-black uppercase tracking-tighter opacity-50 text-[8px]">Data Stream</span>
                      <span className="max-w-[140px] truncate font-bold">{fileName}</span>
                    </div>
                    <button onClick={() => {setFileText(null); setFileName(null);}} className="text-white/40 hover:text-destructive ml-2 p-1">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-8 md:p-10 bg-white/5 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-4 bg-black/40 p-2 rounded-[1.5rem] border border-white/5 shadow-inner">
              <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageUpload} className="hidden" />
              <input type="file" accept=".txt,.md,.json,.js,.ts,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-14 w-14 rounded-2xl bg-white/5 text-white hover:bg-primary hover:text-primary-foreground border border-white/10 transition-all group/btn shadow-lg"
                onClick={() => imageInputRef.current?.click()}
              >
                <ImagePlus className="h-6 w-6 group-hover/btn:scale-110 transition-transform" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-14 w-14 rounded-2xl bg-white/5 text-white hover:bg-primary hover:text-primary-foreground border border-white/10 transition-all group/btn shadow-lg"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileTerminal className="h-6 w-6 group-hover/btn:scale-110 transition-transform" />
              </Button>
              
              <div className="hidden sm:flex flex-col items-start gap-1 px-4 border-l border-white/10">
                <div className="flex items-center gap-2 text-[10px] font-black text-accent uppercase tracking-widest">
                  <Activity className="h-3 w-3 text-accent animate-pulse" />
                  Fleet Ready
                </div>
                <div className="flex items-center gap-2 text-[8px] font-bold text-white/30 uppercase tracking-[0.2em]">
                  Multimodal Active
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
              <div className="flex flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
                <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 shadow-inner w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => updateSetting('useOllama', false)}
                    className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${!settings.useOllama ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                  >
                    Cloud AI
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSetting('useOllama', true)}
                    className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${settings.useOllama ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/20' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                  >
                    Local LLM
                  </button>
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-center sm:text-right text-white/40">
                  Active: {settings.useOllama 
                    ? (settings.localEngine === 'python' ? 'Local Python Server' : `Ollama (${settings.ollamaModel})`) 
                    : 'Cloud Routing Fleet'}
                </div>
              </div>

              <Button 
                size="lg" 
                onClick={handleRoute} 
                disabled={loading || !task.trim()}
                className="w-full md:w-auto px-16 h-20 text-xl bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-2xl shadow-primary/40 transition-all hover:scale-[1.03] active:scale-95 font-black uppercase tracking-widest group"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-7 w-7 animate-spin" />
                    <span>Syncing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-7 w-7 group-hover:rotate-12 transition-transform" />
                    <span>Execute Mission</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-10 animate-in zoom-in-95 duration-700">
          <Card className="glass-panel border-primary/30 overflow-hidden relative group rounded-[3rem] shadow-[0_0_80px_rgba(59,130,246,0.15)]">
            <CardHeader className="p-12 border-b border-white/5 bg-primary/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-5">
                    <Badge className="bg-primary text-primary-foreground text-xs px-6 py-2 rounded-full font-black uppercase tracking-widest shadow-xl">
                      Fleet Core: {result.selectedAI}
                    </Badge>
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-accent/10 border border-accent/20 rounded-full">
                      <Activity className="h-3 w-3 text-accent" />
                      <span className="text-accent text-[9px] font-black uppercase tracking-widest">Target Assigned</span>
                    </div>
                    {session ? (
                      <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400 text-[9px] font-black uppercase tracking-widest">Saved to History</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
                        <Info className="h-3 w-3 text-white/40" />
                        <span className="text-white/40 text-[9px] font-black uppercase tracking-widest">Offline Mode</span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none italic opacity-90">"{result.reasoning}"</h3>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Layers className="h-10 w-10 text-primary/40" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Precision Level 9.8</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-12 space-y-12">
              <div className="relative group/prompt">
                <div className="absolute -top-6 -right-2 z-20">
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    onClick={copyToClipboard} 
                    className="h-16 w-16 rounded-[2rem] bg-white text-black hover:bg-primary hover:text-white transition-all shadow-2xl border-4 border-background"
                  >
                    {isCopied ? <Check className="h-6 w-6 text-emerald-500" /> : <Copy className="h-6 w-6" />}
                  </Button>
                </div>
                <div className="bg-black/60 text-white/95 border border-white/10 rounded-[2.5rem] p-12 font-mono text-lg md:text-xl leading-relaxed whitespace-pre-wrap shadow-2xl shadow-inner min-h-[200px] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                  {result.optimizedPrompt}
                </div>
              </div>
 
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button className="h-14 text-sm md:text-base font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl group shadow-[0_10px_20px_-5px_rgba(59,130,246,0.4)] transition-all" onClick={openAI}>
                  Manual Deploy
                  <ExternalLink className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                </Button>
                
                <Button 
                  className="h-14 text-sm md:text-base font-black uppercase tracking-widest bg-accent hover:bg-accent/90 text-accent-foreground rounded-2xl group shadow-[0_10px_20px_-5px_rgba(255,165,0,0.4)] transition-all relative overflow-hidden" 
                  onClick={() => {
                    const isImage = result?.selectedAI ? getAIById(result.selectedAI)?.category === 'Image Generation' : false;
                    const isVideo = result?.selectedAI ? getAIById(result.selectedAI)?.category === 'Video Generation' : false;
                    handleAutoExecute(undefined, isImage, isVideo, currentHistoryId);
                  }}
                  disabled={executing}
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  {executing ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Executing...</>
                  ) : (
                    <><Zap className="mr-2 h-5 w-5 group-hover:scale-125 transition-transform" /> Auto-Execute</>
                  )}
                </Button>

                <Button 
                  variant="outline" 
                  className="md:col-span-2 h-14 text-sm md:text-base font-bold border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-2xl px-6 transition-all shadow-md" 
                  onClick={() => setRefining(!refining)}
                >
                  <RefreshCw className={`mr-2 h-5 w-5 ${refining ? 'animate-spin' : ''}`} />
                  Refine Parameters
                </Button>
              </div>

              {(executing || chatMessages.some(m => m.role === 'assistant')) && (() => {
                const aiConfig = result ? getAIById(result.selectedAI) : null;
                const isImageTask = aiConfig?.category === 'Image Generation' || /create an image|generate an image|draw a|make an image|paint a/i.test(task);
                const isVideoTask = aiConfig?.category === 'Video Generation' || /create a video|generate a video|make a video|render a video/i.test(task);
                const assistantMessages = chatMessages.filter(m => m.role === 'assistant');

                return (
                  <div className="space-y-8 w-full animate-in fade-in duration-500">
                    {/* Render completed responses */}
                    {assistantMessages.map((msg, index) => {
                      const isMsgImage = msg.type === 'image';
                      const isMsgVideo = msg.type === 'video' || msg.content.startsWith('data:video/') || msg.content.endsWith('.mp4');

                      return (
                        <div 
                          key={msg.id} 
                          className="relative p-10 border border-white/10 rounded-[2.5rem] bg-white/5 space-y-6 shadow-[0_32px_64px_rgba(0,0,0,0.5)]"
                        >
                          {/* Decorative glowing gradient border top */}
                          <div className="absolute top-0 left-12 right-12 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                          
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
                            <div className="flex items-center gap-3.5">
                              <div className="bg-primary/10 p-2.5 rounded-2xl border border-primary/20 shadow-inner">
                                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-white tracking-tight">AI Assistant Response</span>
                                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/5 text-[9px] font-black uppercase px-2 py-0">
                                    Ready
                                  </Badge>
                                </div>
                                <span className="text-[10px] font-medium text-white/40 uppercase tracking-widest block mt-0.5">
                                  {isMsgImage 
                                    ? "Powered by FLUX.1 [schnell]" 
                                    : isMsgVideo
                                    ? `Powered by ${result?.selectedAI || "Stable Video Diffusion"}`
                                    : (result?.selectedAI ? `Powered by ${result.selectedAI}` : "Powered by Gemma 4-31B")}
                                  {assistantMessages.length > 1 && ` • Turn ${index + 1}`}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {!isMsgImage && !isMsgVideo && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => {
                                    navigator.clipboard.writeText(msg.content);
                                    toast({ title: "Copied", description: "Response copied to clipboard" });
                                  }}
                                  className="h-10 rounded-xl bg-white/5 text-white/80 hover:bg-white/10 hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider px-4"
                                >
                                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => downloadMessageResult(msg)}
                                className="h-10 rounded-xl bg-white/5 text-white/80 hover:bg-white/10 hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider px-4"
                              >
                                <FileText className="mr-1.5 h-3.5 w-3.5" /> {isMsgImage ? "Download Image" : isMsgVideo ? "Download Video" : "Download"}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleRegenerateMessage(msg.id)}
                                disabled={executing}
                                className="h-10 rounded-xl bg-white/5 text-white/80 hover:bg-white/10 hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider px-4"
                              >
                                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${executing ? 'animate-spin' : ''}`} /> Regenerate
                              </Button>
                            </div>
                          </div>

                          {isMsgImage ? (
                            <div className="bg-black/60 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center shadow-inner relative group/output-content min-h-[300px]">
                              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/5 pointer-events-none" />
                              <div className="relative max-w-lg w-full aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group/img-view">
                                <img 
                                  src={msg.content} 
                                  alt="AI Generated Output" 
                                  className="w-full h-full object-cover animate-in fade-in zoom-in duration-500 hover:scale-[1.02] transition-transform" 
                                />
                              </div>
                            </div>
                          ) : isMsgVideo ? (
                            <div className="bg-black/60 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center shadow-inner relative group/output-content min-h-[300px]">
                              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/5 pointer-events-none" />
                              <div className="relative max-w-lg w-full aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group/video-view">
                                <video 
                                  src={msg.content} 
                                  controls 
                                  autoPlay 
                                  loop 
                                  playsInline
                                  className="w-full h-full object-cover animate-in fade-in zoom-in duration-500" 
                                />
                              </div>
                            </div>
                          ) : (
                            <HumanizerEditor 
                              initialText={msg.content} 
                              onTextUpdate={(newText) => handleUpdateMessageContent(msg.id, newText)} 
                            />
                          )}
                        </div>
                      );
                    })}

                    {/* Render active loading state */}
                    {executing && (
                      <div className="relative p-10 border border-white/10 rounded-[2.5rem] bg-white/5 space-y-6 animate-in zoom-in-95 duration-500 shadow-[0_32px_64px_rgba(0,0,0,0.5)]">
                        <div className="absolute top-0 left-12 right-12 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                        <div className="flex items-center gap-3.5 border-b border-white/5 pb-6">
                          <div className="bg-primary/10 p-2.5 rounded-2xl border border-primary/20 shadow-inner">
                            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white tracking-tight">AI Assistant Response</span>
                              <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5 animate-pulse text-[9px] font-black uppercase px-2 py-0">
                                Thinking...
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="bg-black/40 border border-white/5 rounded-3xl p-10 flex flex-col items-center justify-center min-h-[220px] text-center space-y-4 shadow-inner">
                          <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-125 animate-pulse" />
                            <div className="relative h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin flex items-center justify-center">
                              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-white text-base font-bold tracking-tight">
                              {isImageTask ? "AI is synthesizing image..." : isVideoTask ? "AI is rendering video..." : "AI is generating response..."}
                            </div>
                            <div className="text-xs text-white/40 font-medium">
                              {isImageTask 
                                ? "Rendering high-fidelity pixels with target model configurations." 
                                : isVideoTask
                                ? "Compiling frames and motion dynamics with target model configurations."
                                : "Processing your instructions with target model configurations."}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Chat Input Console below the list of response boxes */}
                    {!executing && assistantMessages.length > 0 && (
                      <div className="relative p-10 border border-white/10 rounded-[2.5rem] bg-white/5 space-y-4 shadow-[0_32px_64px_rgba(0,0,0,0.5)]">
                        <div className="absolute top-0 left-12 right-12 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                        <Textarea
                          placeholder="Type here to ask AI for the next task or refinement..."
                          value={refineInput}
                          onChange={(e) => setRefineInput(e.target.value)}
                          className="min-h-[70px] max-h-[140px] text-base rounded-2xl bg-black/40 border-white/10 text-white p-4 focus-visible:ring-primary/40 shadow-inner resize-none leading-relaxed"
                          style={{ color: 'white', WebkitTextFillColor: 'white' }}
                        />
                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 w-full">
                          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest text-center sm:text-left">
                            Ask AI for the next task or instruction
                          </span>
                          <Button
                            onClick={() => handleRefineWithInput(false)}
                            disabled={!refineInput.trim() || loading}
                            className="h-11 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold uppercase tracking-wider transition-all shadow-md w-full sm:w-auto flex justify-center items-center"
                          >
                            <Zap className="mr-2 h-4 w-4" />
                            Execute
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {refining && (
                <div className="p-10 border border-white/10 rounded-[2.5rem] bg-white/5 space-y-8 animate-in slide-in-from-top-6 duration-700 shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
                    <label className="text-xs font-black text-white uppercase tracking-[0.4em] opacity-50">Manual Override Protocol</label>
                  </div>
                  <Textarea 
                    placeholder="Provide tactical correction data..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="min-h-[140px] text-xl rounded-3xl bg-black/60 border-white/10 text-white p-8 focus-visible:ring-primary/40 shadow-inner leading-relaxed"
                    style={{ color: 'white', WebkitTextFillColor: 'white' }}
                  />
                  <div className="flex justify-end gap-4">
                    <Button variant="ghost" onClick={() => setRefining(false)} className="rounded-2xl px-8 h-14 text-white hover:bg-white/5 font-bold uppercase tracking-widest">Abort</Button>
                    <Button onClick={handleRefine} disabled={loading} className="rounded-2xl px-12 h-14 bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest shadow-xl">
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Inject Parameters"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
