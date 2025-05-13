
'use client';

import type { FormEvent } from 'react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Bot, MessageSquarePlus, User, Loader2, AlertTriangle, Send, Globe } from 'lucide-react'; // Added Globe
import { careerAdvice, type CareerAdvisorInput, type CareerAdvisorOutput } from '@/ai/flows/careerAdvisorFlow';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';


interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: crypto.randomUUID(),
          sender: 'bot',
          text: "Hello! I'm Career Compass AI. How can I help you with your job search or career questions today?",
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, messages.length]);

 useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);


  const handleSubmit = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: inputValue,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const chatHistoryForAI = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{text: msg.text}]
      }));

      const inputForAI: CareerAdvisorInput = {
        question: userMessage.text,
        chatHistory: chatHistoryForAI.slice(-10), 
        useWebSearch: useWebSearch,
      };
      
      const result: CareerAdvisorOutput = await careerAdvice(inputForAI);
      
      const botMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'bot',
        text: result.answer,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Chatbot error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(`Sorry, I couldn't get a response. ${errorMessage}`);
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        sender: 'bot',
        text: `Sorry, I encountered an issue. Please try again. (${errorMessage.substring(0,100)})`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-xl z-50 bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={() => setIsOpen(true)}
        aria-label="Open Career Advisor Chat"
      >
        <MessageSquarePlus className="h-7 w-7" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[450px] md:max-w-[550px] lg:max-w-[600px] p-0 flex flex-col h-[80vh] max-h-[700px]">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Bot className="h-6 w-6 text-primary" /> Career Compass AI
            </DialogTitle>
            <DialogDescription>
              Ask me anything about job searching, skills, or career advice!
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <ScrollArea className="flex-grow p-4 overflow-y-auto" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.sender === 'bot' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 text-sm shadow ${
                      msg.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-card-foreground border'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground/70'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {msg.sender === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                 <div className="flex items-end gap-2 justify-start">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                           <Bot className="h-5 w-5" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="max-w-[70%] rounded-lg px-3 py-2 text-sm shadow bg-card text-card-foreground border flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        {useWebSearch ? (
                          <>
                            <Globe className="h-4 w-4 text-primary animate-pulse" />
                            <span className="text-xs text-muted-foreground">Searching the web...</span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">Thinking...</span>
                        )}
                    </div>
                 </div>
              )}
            </div>
          </ScrollArea>
          <Separator />
          <DialogFooter className="p-4 pt-2 border-t flex-col space-y-2">
            <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
              <Input
                type="text"
                placeholder="Type your question..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-grow text-sm"
                disabled={isLoading}
                aria-label="Chat input"
              />
              <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()} aria-label="Send message">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
            <div className="flex items-center space-x-2 self-start pl-1">
              <Checkbox 
                id="useWebSearch" 
                checked={useWebSearch} 
                onCheckedChange={(checked) => setUseWebSearch(Boolean(checked))}
                disabled={isLoading}
              />
              <Label htmlFor="useWebSearch" className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {/* Changed icon to Globe for better representation of web search */}
                      <Globe className="h-4 w-4 text-primary" /> 
                    </TooltipTrigger>
                    <TooltipContent side="top" align="start">
                      <p className="text-xs max-w-[200px]">
                        Enable to allow AI to search the web for real-time information for your query.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                 Use Web Search
              </Label>
            </div>
          </DialogFooter>
           {error && (
            <div className="p-4 border-t bg-destructive/10 text-destructive text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> {error}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
