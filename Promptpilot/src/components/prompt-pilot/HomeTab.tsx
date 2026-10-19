
"use client"

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
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
import { CoFounderTab } from './CoFounderTab';
import { Rocket } from 'lucide-react';
import dynamic from 'next/dynamic';
import { CardContainer, CardBody, CardItem } from '@/components/aceternity/ThreeDCard';
import { SparklesCore } from '@/components/aceternity/SparklesCore';
import { Meteors } from '@/components/aceternity/Meteors';
import { ShimmerButton } from '@/components/magic-ui/ShimmerButton';
import { AiRouterBeams } from '@/components/magic-ui/AiRouterBeams';
import { DecryptedText } from '@/components/react-bits/DecryptedText';
import { Magnet } from '@/components/react-bits/Magnet';
import { GradientText } from '@/components/react-bits/GradientText';
import { SpotlightCard } from '@/components/react-bits/SpotlightCard';

import { PromptQuickChips } from '@/components/kokonut-ui/PromptQuickChips';
import { KokonutAnimatedTabs } from '@/components/kokonut-ui/KokonutAnimatedTabs';
import { KokonutCard } from '@/components/kokonut-ui/KokonutCard';
import { KokonutButton } from '@/components/kokonut-ui/KokonutButton';
import { BentoFleetGrid } from '@/components/watermelon-ui/BentoFleetGrid';


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

  // Segmented view mode selection
  const [mode, setMode] = useState<'rd' | 'startup'>('rd');

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
    const originalTask = task;
    setLoading(true);
    try {
      const output = await analyzeTaskAndGeneratePrompt({ 
        taskDescription: originalTask,
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
      
      if (output.error) {
        throw new Error(output.error);
      }
      
      setResult({ ...output, refinements: 0 });
      
      // Store original user prompt query into chat messages timeline
      const initialUserMsg: ChatMessage = {
        id: `user-0-${Date.now()}`,
        role: 'user',
        content: originalTask
      };
      setChatMessages([initialUserMsg]);
      
      toast({
        title: "Autonomous Routing Complete",
        description: `Mission assigned to ${settings.useOllama ? (settings.localEngine === 'python' ? 'Local Python Server' : `Ollama (${settings.ollamaModel})`) : output.selectedAI}`
      });

      // Save mission to DB & localStorage
      let savedId: string | null = null;
      const isImage = output.selectedAI ? getAIById(output.selectedAI)?.category === 'Image Generation' : false;
      const isVideo = output.selectedAI ? getAIById(output.selectedAI)?.category === 'Video Generation' : false;
      const missionPayload = {
        taskDescription: originalTask,
        selectedAI: settings.useOllama && !isImage && !isVideo
          ? (settings.localEngine === 'python' ? 'Local Python Server' : `Ollama (${settings.ollamaModel})`)
          : output.selectedAI,
        aiUrl: settings.useOllama && !isImage && !isVideo
          ? (settings.localEngine === 'python' ? (settings.pythonServerUrl || 'http://127.0.0.1:8000') : (settings.ollamaBaseUrl || 'http://127.0.0.1:11434'))
          : output.aiUrl,
        reasoning: output.reasoning,
        optimizedPrompt: output.optimizedPrompt,
        isImageTask: isImage || isVideo
      };
      savedId = await saveMissionHistory(missionPayload);
      setCurrentHistoryId(savedId);

      try {
        const localRecord = {
          id: savedId || `local-${Date.now()}`,
          ...missionPayload,
          executionOutput: null,
          createdAt: new Date()
        };
        const existing = JSON.parse(localStorage.getItem('SPARK_local_history') || '[]');
        localStorage.setItem('SPARK_local_history', JSON.stringify([localRecord, ...existing.filter((item: any) => item.id !== localRecord.id)]));
      } catch (e) {}

      // Auto-deploy execution agent
      handleAutoExecute(output.optimizedPrompt, isImage, isVideo, savedId);
    } catch (err: any) {
      console.error("Routing Error:", err);
      toast({
        variant: "destructive",
        title: "Routing Error",
        description: err.message || "Orchestrator encountered a sync issue."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!feedback.trim() || !result) return;
    const correctionFeedback = feedback.trim();
    setLoading(true);
    try {
      const output = await refinePrompt({ 
        previousPrompt: result.optimizedPrompt,
        feedback: correctionFeedback,
        settings: {
          useOllama: settings.useOllama,
          ollamaBaseUrl: settings.ollamaBaseUrl,
          ollamaModel: settings.ollamaModel,
          localEngine: settings.localEngine,
          pythonServerUrl: settings.pythonServerUrl
        }
      });
      
      if (output.error) {
        throw new Error(output.error);
      }
      
      const newRefinements = (result.refinements || 0) + 1;
      setResult({ ...result, optimizedPrompt: output.refinedPrompt, refinements: newRefinements });
      
      // Push user's parameter adjustment to conversation timeline
      setChatMessages(prev => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: 'user',
          content: correctionFeedback
        }
      ]);

      setRefining(false);
      setFeedback('');
      toast({
        title: "Parameters Injected",
        description: "Tactical data successfully applied."
      });

      // Save refined mission to DB
      let savedId: string | null = currentHistoryId;
      const isImage = result?.selectedAI ? getAIById(result.selectedAI)?.category === 'Image Generation' : false;
      const isVideo = result?.selectedAI ? getAIById(result.selectedAI)?.category === 'Video Generation' : false;
      if (savedId) {
        await updateMissionHistoryPrompt(savedId, output.refinedPrompt);
      } else {
        savedId = await saveMissionHistory({
          taskDescription: task,
          selectedAI: settings.useOllama && !isImage && !isVideo
            ? (settings.localEngine === 'python' ? 'Local Python Server' : `Ollama (${settings.ollamaModel})`)
            : result.selectedAI,
          aiUrl: settings.useOllama && !isImage && !isVideo
            ? (settings.localEngine === 'python' ? (settings.pythonServerUrl || 'http://127.0.0.1:8000') : (settings.ollamaBaseUrl || 'http://127.0.0.1:11434'))
            : result.aiUrl,
          reasoning: result.reasoning,
          optimizedPrompt: output.refinedPrompt,
          isImageTask: isImage || isVideo
        });
        setCurrentHistoryId(savedId);
      }

      // Auto-deploy execution agent with refined prompt
      handleAutoExecute(output.refinedPrompt, isImage, isVideo, savedId);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Refinement Error",
        description: err.message || "Failed to inject new parameters."
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
    const inputFeedback = refineInput.trim();
    setRefineInput('');

    // 1. Immediately append the user's follow-up prompt query to chatMessages so it is visibly displayed!
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputFeedback
    };

    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);

    setExecuting(true);
    setLoading(true);

    try {
      const isImage = result?.selectedAI ? getAIById(result.selectedAI)?.category === 'Image Generation' : false;
      const isVideo = result?.selectedAI ? getAIById(result.selectedAI)?.category === 'Video Generation' : false;

      // Maintain conversation thread history (excluding the current user query which is passed as prompt)
      const conversationHistory = updatedMessages.slice(0, -1).map(m => ({
        role: m.role,
        content: m.content
      }));

      const output = await executePromptViaApi(
        inputFeedback,
        isImage,
        isVideo,
        {
          useOllama: settings.useOllama,
          ollamaBaseUrl: settings.ollamaBaseUrl,
          ollamaModel: settings.ollamaModel,
          localEngine: settings.localEngine,
          pythonServerUrl: settings.pythonServerUrl
        },
        conversationHistory
      );

      setExecutionResult(output);

      // 2. Append assistant response to chat
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: output,
        type: isImage ? 'image' : isVideo ? 'video' : 'text',
        optimizedPrompt: inputFeedback
      };

      setChatMessages(prev => [...prev, assistantMsg]);

      if (currentHistoryId) {
        await updateMissionHistoryOutput(currentHistoryId, output);
      }
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setExecutionResult(errorMsg);
      setChatMessages(prev => [
        ...prev,
        {
          id: `assistant-err-${Date.now()}`,
          role: 'assistant',
          content: `Execution failed. Error: ${errorMsg}`,
          type: 'text'
        }
      ]);
      toast({
        variant: "destructive",
        title: "Execution Error",
        description: err.message || "Failed to execute follow-up query."
      });
    } finally {
      setExecuting(false);
      setLoading(false);
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
            content: task || promptToRun
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

      // Update DB history record and localStorage record
      const activeHistoryId = historyIdToUpdate || currentHistoryId;
      if (activeHistoryId) {
        await updateMissionHistoryOutput(activeHistoryId, output);
      }
      try {
        const existing = JSON.parse(localStorage.getItem('SPARK_local_history') || '[]');
        if (existing.length > 0) {
          existing[0].executionOutput = output;
          localStorage.setItem('SPARK_local_history', JSON.stringify(existing));
        }
      } catch (e) {}

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
            content: task || promptToRun
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
      a.download = `SPARK_Generated_Image.png`;
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
      a.download = `SPARK_Generated_Video.mp4`;
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
    a.download = `SPARK_Execution_Output.txt`;
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
    a.download = `SPARK_Execution_Output.txt`;
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
      {/* Modern Kokonut UI Animated Segmented Mode Dock */}
      <div className="flex justify-center mt-2">
        <KokonutAnimatedTabs
          tabs={[
            {
              id: 'rd',
              label: 'Prompt Orchestrator',
              icon: <Cpu className="h-4 w-4 text-cyan-300" />,
            },
            {
              id: 'startup',
              label: 'Startup Co-Founder',
              icon: <Rocket className="h-4 w-4 text-pink-300" />,
              badge: '2026 LIVE',
              badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
            },
          ]}
          activeTab={mode}
          onChange={(id) => setMode(id as 'rd' | 'startup')}
        />
      </div>

      {mode === 'rd' ? (
        <>
          <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/25 text-primary text-[10px] font-black uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(59,130,246,0.2)] backdrop-blur-md">
          <Sparkles className="h-3 w-3 text-cyan-400 animate-pulse" />
          <span>Neural Orchestration Engine</span>
        </div>
        <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-white leading-[0.85] font-headline">
          Master Your <br className="hidden sm:inline" />
          <GradientText colors={["#00f2ff", "#38bdf8", "#818cf8", "#c084fc", "#00f2ff"]}>
            Missions
          </GradientText>.
        </h1>
        <p className="text-white/60 text-lg md:text-xl font-medium max-w-2xl mx-auto">
          Sync visual intel and raw data. We deploy the world's most advanced AI for perfect execution.
        </p>
      </div>

      <KokonutCard glowColor="cyan" className="w-full">
      <div className="glass-panel border-0 rounded-[2.5rem] overflow-hidden shadow-[0_32px_128px_-32px_rgba(0,0,0,0.8)] group relative">
        <SparklesCore className="opacity-30" particleDensity={30} minSize={0.4} maxSize={1.8} particleColor="#00f2ff" />
        <Meteors number={10} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] pointer-events-none animate-pulse" />
        <CardContent className="p-0 relative z-10">
          <div className="relative">
            <Textarea 
              id="objective-input"
              placeholder="Deploy your mission parameters here..."
              className="min-h-[240px] text-2xl md:text-3xl border-none focus-visible:ring-0 resize-none p-12 pb-6 bg-transparent text-white placeholder:text-white/30 transition-all font-semibold leading-relaxed"
              style={{ color: 'white', WebkitTextFillColor: 'white' }}
              value={task}
              onChange={(e) => setTask(e.target.value)}
            />

            {/* KokonutUI Quick Intelligence Vectors */}
            <div className="px-12 pb-4">
              <PromptQuickChips onSelectPrompt={(p) => setTask(p)} />
            </div>
            
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
              
              <Magnet padding={40} magnetStrength={2.5}>
                <Button 
                  id="image-upload-btn"
                  variant="ghost" 
                  size="icon" 
                  className="h-14 w-14 rounded-2xl bg-white/5 text-white hover:bg-primary hover:text-primary-foreground border border-white/10 transition-all group/btn shadow-lg"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <ImagePlus className="h-6 w-6 group-hover/btn:scale-110 transition-transform" />
                </Button>
              </Magnet>
              
              <Magnet padding={40} magnetStrength={2.5}>
                <Button 
                  id="doc-upload-btn"
                  variant="ghost" 
                  size="icon" 
                  className="h-14 w-14 rounded-2xl bg-white/5 text-white hover:bg-primary hover:text-primary-foreground border border-white/10 transition-all group/btn shadow-lg"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileTerminal className="h-6 w-6 group-hover/btn:scale-110 transition-transform" />
                </Button>
              </Magnet>
              
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

            <div className="relative flex bg-black/40 p-1.5 rounded-2xl border border-white/5 shadow-inner w-full sm:w-auto h-14 items-center">
              <button
                id="cloud-ai-btn"
                type="button"
                onClick={() => updateSetting('useOllama', false)}
                className={`flex-1 sm:flex-none px-6 h-11 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${!settings.useOllama ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              >
                Cloud AI
              </button>
              <button
                id="local-llm-btn"
                type="button"
                onClick={() => updateSetting('useOllama', true)}
                className={`flex-1 sm:flex-none px-6 h-11 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${settings.useOllama ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/20' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              >
                Local LLM
              </button>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest text-white/40 whitespace-nowrap">
                Active: {settings.useOllama 
                  ? (settings.localEngine === 'python' ? 'Local Python Server' : `Ollama (${settings.ollamaModel})`) 
                  : 'Cloud Routing Fleet'}
              </div>
            </div>

            {/* Ultra-Attractive Animated Execute Mission Button */}
            <motion.button 
              id="execute-mission-btn"
              type="button"
              onClick={() => {
                if (!task.trim()) {
                  document.getElementById("objective-input")?.focus();
                  toast({
                    title: "Mission Parameter Required",
                    description: "Please enter your mission parameters or select a vector above to deploy.",
                  });
                  return;
                }
                handleRoute();
              }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className={`relative group/exec overflow-hidden rounded-2xl px-9 h-14 flex items-center justify-center transition-all duration-300 cursor-pointer select-none border bg-gradient-to-r from-[#0e1628]/95 via-[#131f38]/95 to-[#0e1628]/95 ${
                loading
                  ? "border-cyan-500/60 text-cyan-300 shadow-[0_0_30px_rgba(0,242,255,0.3)]"
                  : task.trim()
                  ? "border-cyan-400 text-cyan-200 shadow-[0_0_32px_rgba(0,242,255,0.35)] hover:border-cyan-300 hover:text-white hover:shadow-[0_0_40px_rgba(0,242,255,0.5)]"
                  : "border-cyan-500/50 text-cyan-300 hover:border-cyan-400 hover:text-white hover:shadow-[0_0_35px_rgba(0,242,255,0.4)] shadow-[0_0_20px_rgba(0,242,255,0.2)]"
              }`}
            >
              {/* Continuous Light Sweep Beam */}
              <motion.div
                className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
                animate={{
                  x: ["-150%", "250%"],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.2,
                  ease: "easeInOut",
                  repeatDelay: 0.6,
                }}
              />

              {/* Specular Lip Highlight */}
              <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent pointer-events-none" />

              {loading ? (
                <div className="flex items-center gap-3 relative z-10 font-black text-xs uppercase tracking-widest text-cyan-300">
                  <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
                  <span>Syncing Autonomous Mesh...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 relative z-10">
                  <div className="relative flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-cyan-300 transition-transform duration-300 group-hover/exec:rotate-45 group-hover/exec:scale-125" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping pointer-events-none" />
                  </div>
                  <span className="font-black text-sm uppercase tracking-widest text-cyan-200 group-hover/exec:text-white transition-colors">
                    Execute Mission
                  </span>
                  <ArrowRight className="h-4 w-4 text-cyan-300 transition-transform duration-300 group-hover/exec:translate-x-1.5 group-hover/exec:text-white" />
                </div>
              )}
            </motion.button>
          </div>
        </CardContent>
      </div>
      </KokonutCard>

      {/* SPARK AI Dispatch Routing Fabric - displayed after query is provided or during dispatch */}
      {!result && (task.trim().length > 0 || loading) && (
        <div className="w-full animate-in fade-in zoom-in-95 duration-500">
          <AiRouterBeams 
            isLoading={loading}
            isExecuting={executing}
            selectedAI={result?.selectedAI}
            activeModel={settings.useOllama ? (settings.ollamaModel || 'qwen3.5:2b') : result?.selectedAI || 'Cloud AI'}
            taskDescription={task}
            useOllama={settings.useOllama}
          />
        </div>
      )}

      {result && (
        <div className="space-y-10 animate-in zoom-in-95 duration-700">
          <Card className="glass-panel border-primary/30 overflow-hidden relative group rounded-[3rem] shadow-[0_0_80px_rgba(59,130,246,0.15)]">
            <CardHeader className="p-12 border-b border-white/5 bg-primary/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-5">
                    <Badge className="bg-primary text-primary-foreground text-xs px-6 py-2 rounded-full font-black uppercase tracking-widest shadow-xl">
                      Fleet Core: {settings.useOllama 
                        ? (settings.localEngine === 'python' ? 'Local Python Server' : `Ollama (${settings.ollamaModel})`)
                        : result.selectedAI}
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
                    id="copy-prompt-btn"
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
                <Button id="manual-deploy-btn" className="h-14 text-sm md:text-base font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl group shadow-[0_10px_20px_-5px_rgba(59,130,246,0.4)] transition-all" onClick={openAI}>
                  Manual Deploy
                  <ExternalLink className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                </Button>
                
                <Button 
                  id="auto-execute-btn"
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
                  id="refine-parameters-btn"
                  variant="outline" 
                  className="md:col-span-2 h-14 text-sm md:text-base font-bold border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-2xl px-6 transition-all shadow-md" 
                  onClick={() => setRefining(!refining)}
                >
                  <RefreshCw className={`mr-2 h-5 w-5 ${refining ? 'animate-spin' : ''}`} />
                  Refine Parameters
                </Button>
              </div>

              {(executing || chatMessages.length > 0) && (() => {
                const aiConfig = result ? getAIById(result.selectedAI) : null;
                const isImageTask = aiConfig?.category === 'Image Generation' || /create an image|generate an image|draw a|make an image|paint a/i.test(task);
                const isVideoTask = aiConfig?.category === 'Video Generation' || /create a video|generate a video|make a video|render a video/i.test(task);

                return (
                  <div className="space-y-6 w-full animate-in fade-in duration-500">
                    {/* Conversational Stream: renders user prompt queries, dispatch execution fabric, and AI responses */}
                    {chatMessages.map((msg, index) => {
                      if (msg.role === 'user') {
                        const isLatestUserMsg = index === chatMessages.map(m => m.role).lastIndexOf('user');
                        return (
                          <div key={msg.id} className="space-y-6 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* User Query Block */}
                            <div className="flex justify-end w-full">
                              <div className="max-w-[90%] md:max-w-[80%] rounded-2xl md:rounded-3xl p-5 md:p-6 bg-gradient-to-br from-cyan-950/70 via-[#0d1f33]/80 to-black/70 border border-cyan-500/35 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,242,255,0.08)] space-y-2.5">
                                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2.5">
                                  <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-sm">
                                      <User className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-wider text-cyan-200">
                                      Your Prompt Query
                                    </span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      navigator.clipboard.writeText(msg.content);
                                      toast({ title: "Copied", description: "Prompt query copied to clipboard." });
                                    }}
                                    className="h-6 px-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 text-[10px] font-bold uppercase tracking-wider"
                                  >
                                    <Copy className="h-3 w-3 mr-1" /> Copy
                                  </Button>
                                </div>
                                <p className="text-sm md:text-base font-medium text-white leading-relaxed whitespace-pre-wrap select-text">
                                  {msg.content}
                                </p>
                              </div>
                            </div>

                            {/* SPARK Neural Execution Fabric directly after the user's query */}
                            <div className="w-full my-4 animate-in zoom-in-95 duration-500">
                              <AiRouterBeams 
                                isLoading={loading && isLatestUserMsg}
                                isExecuting={executing && isLatestUserMsg}
                                selectedAI={result?.selectedAI}
                                activeModel={settings.useOllama ? (settings.ollamaModel || 'qwen3.5:2b') : result?.selectedAI || 'Cloud AI'}
                                taskDescription={msg.content}
                                useOllama={settings.useOllama}
                              />
                            </div>
                          </div>
                        );
                      }

                      // Assistant message rendering
                      const isMsgImage = msg.type === 'image';
                      const isMsgVideo = msg.type === 'video' || msg.content.startsWith('data:video/') || msg.content.endsWith('.mp4');

                      return (
                        <div 
                          key={msg.id} 
                          className="relative p-6 md:p-8 border border-white/10 rounded-2xl md:rounded-3xl bg-[#0c1222]/95 backdrop-blur-2xl space-y-6 shadow-[0_24px_64px_rgba(0,0,0,0.6)] animate-in fade-in slide-in-from-bottom-3 duration-500"
                        >
                          {/* Decorative glowing gradient border top */}
                          <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
                          
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-primary/15 p-2 rounded-xl border border-primary/25 shadow-inner">
                                <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-black text-white tracking-tight">SPARK AI Response</span>
                                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[9px] font-black uppercase px-2 py-0.5">
                                    Ready
                                  </Badge>
                                </div>
                                <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest block mt-0.5">
                                  {isMsgImage 
                                    ? "Powered by FLUX.1 [schnell]" 
                                    : isMsgVideo
                                    ? `Powered by ${result?.selectedAI || "Stable Video Diffusion"}`
                                    : settings.useOllama
                                    ? (settings.localEngine === 'python' ? 'Powered by Local Python Server' : `Powered by Ollama (${settings.ollamaModel})`)
                                    : (result?.selectedAI ? `Powered by ${result.selectedAI}` : "Powered by Gemma 4-31B")}
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
                                  className="h-8 rounded-xl bg-white/5 text-white/80 hover:bg-white/10 hover:text-white border border-white/10 text-[11px] font-bold uppercase tracking-wider px-3"
                                >
                                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => downloadMessageResult(msg)}
                                className="h-8 rounded-xl bg-white/5 text-white/80 hover:bg-white/10 hover:text-white border border-white/10 text-[11px] font-bold uppercase tracking-wider px-3"
                              >
                                <FileText className="mr-1.5 h-3.5 w-3.5" /> {isMsgImage ? "Download Image" : isMsgVideo ? "Download Video" : "Download"}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleRegenerateMessage(msg.id)}
                                disabled={executing}
                                className="h-8 rounded-xl bg-white/5 text-white/80 hover:bg-white/10 hover:text-white border border-white/10 text-[11px] font-bold uppercase tracking-wider px-3"
                              >
                                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${executing ? 'animate-spin' : ''}`} /> Regenerate
                              </Button>
                            </div>
                          </div>

                          {isMsgImage ? (
                            <div className="bg-black/60 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center shadow-inner relative group/output-content min-h-[300px]">
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
                            <div className="bg-black/60 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center shadow-inner relative group/output-content min-h-[300px]">
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
                            <div className="text-white/95 leading-relaxed select-text">
                              <MarkdownRenderer content={msg.content} />
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Active loading state */}
                    {executing && (
                      <div className="relative p-6 md:p-8 border border-cyan-500/30 rounded-2xl md:rounded-3xl bg-[#0c1222]/90 backdrop-blur-2xl space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-4">
                          <div className="relative h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin flex items-center justify-center shrink-0">
                            <Sparkles className="h-5 w-5 text-cyan-400 animate-pulse" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">
                                {isImageTask ? "SPARK is synthesizing image..." : isVideoTask ? "SPARK is rendering video..." : "SPARK Neural Engine is synthesizing response..."}
                              </span>
                              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                            </div>
                            <p className="text-xs text-white/50 mt-0.5">
                              {settings.useOllama ? `Executing locally via Ollama (${settings.ollamaModel})` : "Processing via Neural AI Fleet"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Chat Input Console below conversation */}
                    {!executing && chatMessages.length > 0 && (
                      <div className="relative p-6 md:p-7 border border-white/15 rounded-2xl md:rounded-3xl bg-[#0a0f1d]/90 backdrop-blur-2xl space-y-4 shadow-[0_24px_64px_rgba(0,0,0,0.6)] focus-within:border-cyan-500/50 transition-all">
                        <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
                        
                        {/* Quick follow-up prompt chips */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                          <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400/70 shrink-0 flex items-center gap-1">
                            <Zap className="h-3 w-3" /> Quick Prompts:
                          </span>
                          {[
                            "Make it more concise",
                            "Explain step by step with code",
                            "Summarize into key bullet points",
                            "Provide practical implementation details",
                          ].map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => {
                                setRefineInput(chip);
                              }}
                              className="text-[11px] font-semibold px-3 py-1 rounded-xl bg-white/5 hover:bg-cyan-500/15 hover:text-cyan-300 text-white/70 border border-white/10 hover:border-cyan-500/30 transition-all shrink-0"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>

                        <div className="relative">
                          <Textarea
                            id="chat-refine-input"
                            placeholder="Type your follow-up prompt, question, or correction here (Press Enter to send, Shift+Enter for newline)..."
                            value={refineInput}
                            onChange={(e) => setRefineInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (refineInput.trim() && !loading && !executing) {
                                  handleRefineWithInput(false);
                                }
                              }
                            }}
                            className="min-h-[85px] max-h-[160px] text-sm md:text-base rounded-2xl bg-black/50 border-white/10 text-white p-4 pr-28 focus-visible:ring-1 focus-visible:ring-cyan-400/50 shadow-inner resize-none leading-relaxed"
                            style={{ color: 'white', WebkitTextFillColor: 'white' }}
                          />
                          <div className="absolute right-3 bottom-3 flex items-center gap-2">
                            <Button
                              id="chat-refine-execute-btn"
                              type="button"
                              onClick={() => handleRefineWithInput(false)}
                              disabled={!refineInput.trim() || loading || executing}
                              className="h-10 px-5 rounded-xl bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-40"
                            >
                              {executing || loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Zap className="mr-1.5 h-3.5 w-3.5" />
                                  <span>Send</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-[10px] text-white/40 font-medium tracking-wider">
                          <span>Press Enter to send • Shift + Enter for new line</span>
                          <span>
                            {typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')
                              ? 'AI Engine: Cloud Neural Fleet'
                              : (settings.useOllama ? `Ollama Engine: ${settings.ollamaModel}` : 'AI Engine: Cloud Fleet')}
                          </span>
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
        </>
      ) : (
        <CoFounderTab />
      )}
    </div>
  );
}
