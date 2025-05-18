
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { SubmitHandler} from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as FormDescriptionComponent } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertTriangle, User, Bot, Send, Brain, StopCircle, Briefcase, Building, Mic, MicOff, Volume2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { conductMockInterviewTurn, type MockInterviewInput, type MockInterviewOutput, type MockInterviewTurn } from '@/ai/flows/mockInterviewFlow';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const userAnswerSchema = z.object({
  answer: z.string().min(1, "Please provide an answer."),
});
type UserAnswerValues = z.infer<typeof userAnswerSchema>;

interface MockInterviewSessionSetup {
  resumeDataUri?: string;
  userSkills?: string;
  targetCompanyName?: string;
  jobContext?: string;
}

// Speech Recognition API might not be available on all window objects
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition | undefined;
    webkitSpeechRecognition: typeof SpeechRecognition | undefined;
  }
}

export default function MockInterviewSessionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const [sessionSetup, setSessionSetup] = useState<MockInterviewSessionSetup | null>(null);
  const [interviewHistory, setInterviewHistory] = useState<MockInterviewTurn[]>([]);
  const [currentAiQuestion, setCurrentAiQuestion] = useState<string | null>(null);
  const [aiFullResponse, setAiFullResponse] = useState<string | null>(null);
  const [isSessionOver, setIsSessionOver] = useState(false);
  const [isInterviewInitialized, setIsInterviewInitialized] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const answerForm = useForm<UserAnswerValues>({
    resolver: zodResolver(userAnswerSchema),
    defaultValues: { answer: '' },
  });

  const speakText = useCallback((text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      // Optionally configure voice, rate, pitch here if needed
      // utterance.voice = window.speechSynthesis.getVoices()[0]; // Example
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.cancel(); // Cancel any previous speech
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  useEffect(() => {
    const setupDataString = localStorage.getItem('mockInterviewSetup');
    if (setupDataString) {
      let parsedData: MockInterviewSessionSetup | null = null;
      try {
        parsedData = JSON.parse(setupDataString);
      } catch (e) {
        console.error("Failed to parse interview setup data from localStorage:", e);
        toast({ title: "Error Starting Session", description: "Invalid setup data. Please try setting up again.", variant: "destructive" });
        router.push('/mock-interview');
        return;
      }

      if (parsedData && parsedData.resumeDataUri) {
        setSessionSetup(parsedData);
        const initialInput: MockInterviewInput = {
            resumeDataUri: parsedData.resumeDataUri,
            userSkills: parsedData.userSkills,
            targetCompanyName: parsedData.targetCompanyName,
            jobContext: parsedData.jobContext,
            interviewHistory: [],
        };
        handleInterviewTurn(initialInput, true).finally(() => {
          localStorage.removeItem('mockInterviewSetup');
        });
      } else {
        toast({ title: "No Resume Data", description: "Resume data is missing. Please set up your mock interview again.", variant: "destructive" });
        localStorage.removeItem('mockInterviewSetup');
        router.push('/mock-interview');
      }
    } else {
      toast({ title: "No Setup Data", description: "Please set up your mock interview first.", variant: "destructive" });
      router.push('/mock-interview');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [interviewHistory, aiFullResponse, currentAiQuestion, isLoading]);

  const handleInterviewTurn = async (input: MockInterviewInput, isInitialCall: boolean = false) => {
    setIsLoading(true);
    setError(null);
    if(!isInitialCall) setAiFullResponse(null);

    try {
      const result = await conductMockInterviewTurn(input);
      setAiFullResponse(result.aiResponseText);
      
      const questionToSpeak = result.currentAiQuestion || (result.isSessionOver && result.aiResponseText ? result.aiResponseText : null);
      if (questionToSpeak) {
        speakText(questionToSpeak);
      }
      setCurrentAiQuestion(result.currentAiQuestion || null);


      if (!isInitialCall && input.userAnswer && input.lastAiQuestion) {
        let feedbackText = result.aiResponseText;
        if (result.currentAiQuestion && result.aiResponseText.includes(result.currentAiQuestion)) {
           const questionStartIndex = result.aiResponseText.indexOf(result.currentAiQuestion);
           const cue = "Here's your next question:";
           const cueIndex = result.aiResponseText.lastIndexOf(cue, questionStartIndex);
           if (cueIndex !== -1) feedbackText = result.aiResponseText.substring(0, cueIndex).trim();
           else if (questionStartIndex > 0) feedbackText = result.aiResponseText.substring(0, questionStartIndex).trim();
        } else if (result.isSessionOver) {
          feedbackText = result.aiResponseText;
        }

        setInterviewHistory(prev => {
          const updatedHistory = [...prev];
          if (updatedHistory.length > 0) {
            const lastTurnIndex = updatedHistory.length - 1;
            if (updatedHistory[lastTurnIndex].question === input.lastAiQuestion && !updatedHistory[lastTurnIndex].feedback) {
              updatedHistory[lastTurnIndex] = { ...updatedHistory[lastTurnIndex], feedback: feedbackText };
            }
          }
          return updatedHistory;
        });
      }
      
      if (result.isSessionOver) {
        setIsSessionOver(true);
        toast({ title: "Mock Interview Session Ended.", description: "Hope this was helpful!" });
        if (!input.endSessionSignal) { // If AI ended it naturally, wait a bit then redirect
          setTimeout(() => router.push('/mock-interview'), 3000);
        }
      } else if (!isInitialCall){
        toast({ title: "Answer Submitted!", description: "AI is providing feedback and the next question." });
      } else {
         toast({ title: "Mock Interview Started!", description: "The AI will ask the first question." });
      }
      answerForm.reset();
      if(!isInterviewInitialized) setIsInterviewInitialized(true);

    } catch (e) {
      console.error("Mock interview API error:", e);
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
      setError(`An error occurred: ${errorMessage.substring(0, 200)}`);
      toast({ title: "Error", description: errorMessage.substring(0, 100), variant: "destructive" });
      if (!isInitialCall && input.userAnswer) {
         setInterviewHistory(prev => prev.slice(0, -1)); 
         setCurrentAiQuestion(input.lastAiQuestion || null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSubmit: SubmitHandler<UserAnswerValues> = async (data) => {
    if (!currentAiQuestion || isSessionOver || !sessionSetup) return;
    if (isRecording && speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
        setIsRecording(false);
    }
    window.speechSynthesis.cancel(); // Stop any ongoing AI speech

    const userTurnForHistory: MockInterviewTurn = {
      question: currentAiQuestion,
      answer: data.answer,
    };
    setInterviewHistory(prev => [...prev, userTurnForHistory]);
    
    const turnInput: MockInterviewInput = {
      resumeDataUri: sessionSetup.resumeDataUri,
      userSkills: sessionSetup.userSkills,
      targetCompanyName: sessionSetup.targetCompanyName,
      jobContext: sessionSetup.jobContext,
      userAnswer: data.answer,
      lastAiQuestion: currentAiQuestion,
      interviewHistory: interviewHistory, 
    };
    setCurrentAiQuestion(null); 
    await handleInterviewTurn(turnInput);
  };

  const handleEndInterview = async () => {
    if (!sessionSetup) {
      router.push('/mock-interview'); // No setup, just redirect
      return;
    }
    if (isRecording && speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
        setIsRecording(false);
    }
    window.speechSynthesis.cancel();

    setIsLoading(true);
    setError(null);
    setAiFullResponse(null);

    const endSessionInput: MockInterviewInput = {
        resumeDataUri: sessionSetup.resumeDataUri,
        userSkills: sessionSetup.userSkills,
        targetCompanyName: sessionSetup.targetCompanyName,
        jobContext: sessionSetup.jobContext,
        interviewHistory: interviewHistory,
        lastAiQuestion: currentAiQuestion || undefined,
        userAnswer: "(User clicked 'End Interview')", 
        endSessionSignal: true,
    };
    await handleInterviewTurn(endSessionInput);
    setIsLoading(false);
    router.push('/mock-interview'); // Redirect after AI confirms end
  };

  const toggleRecording = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      toast({ title: "Speech Recognition Not Supported", description: "Your browser doesn't support speech-to-text.", variant: "destructive" });
      return;
    }

    if (isRecording && speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      setIsRecording(false);
    } else {
      speechRecognitionRef.current = new SpeechRecognitionAPI();
      speechRecognitionRef.current.continuous = false;
      speechRecognitionRef.current.interimResults = true;
      speechRecognitionRef.current.lang = 'en-US';

      let finalTranscript = answerForm.getValues('answer') || '';

      speechRecognitionRef.current.onstart = () => {
        setIsRecording(true);
        toast({ title: "Listening...", description: "Start speaking your answer." });
      };

      speechRecognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + '. ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        answerForm.setValue('answer', finalTranscript + interimTranscript);
      };

      speechRecognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        toast({ title: "Speech Error", description: `Error: ${event.error}. Try again or type.`, variant: "destructive" });
        setIsRecording(false);
      };

      speechRecognitionRef.current.onend = () => {
        setIsRecording(false);
        if (finalTranscript.trim()) {
           answerForm.setValue('answer', finalTranscript.trim()); // Ensure final set
        }
        toast({ title: "Recording Ended" });
      };
      
      finalTranscript = answerForm.getValues('answer') || ''; // Capture current text before starting
      if (finalTranscript && !finalTranscript.endsWith(' ')) finalTranscript += ' ';

      speechRecognitionRef.current.start();
    }
  };

  if (!isInterviewInitialized && !error && !sessionSetup) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Initializing interview session...</p>
      </div>
    );
  }


  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      <Card className="shadow-xl flex-grow flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-7 w-7 text-primary" />
              <CardTitle className="text-2xl">AI Mock Interview Session</CardTitle>
            </div>
            <Button onClick={handleEndInterview} variant="outline" size="sm" disabled={isLoading}> {/* Allow ending even if session is over */}
              <StopCircle className="mr-2 h-4 w-4" /> End Interview
            </Button>
          </div>
          {sessionSetup?.targetCompanyName && <CardDescription>Targeting: {sessionSetup.targetCompanyName}</CardDescription>}
          {sessionSetup?.userSkills && <CardDescription className="text-xs">Skills focus: {sessionSetup.userSkills}</CardDescription>}
           {sessionSetup?.jobContext && <CardDescription className="text-xs">Context: {sessionSetup.jobContext}</CardDescription>}
        </CardHeader>

        <ScrollArea className="flex-grow p-4 space-y-4" ref={scrollAreaRef}>
          {interviewHistory.map((turn, index) => (
            <React.Fragment key={index}>
              {/* AI Question */}
              <div className="flex items-start gap-3 my-3">
                <Avatar className="h-9 w-9 border border-primary/30">
                  <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-5 w-5" /></AvatarFallback>
                </Avatar>
                <div className="bg-muted p-3 rounded-lg shadow-sm max-w-[85%]">
                  <p className="font-semibold text-sm text-primary flex items-center gap-1">
                    AI Coach:
                    <button onClick={() => speakText(turn.question)} title="Speak this question" className="text-primary/70 hover:text-primary">
                        <Volume2 className="h-4 w-4"/>
                    </button>
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{turn.question}</p>
                </div>
              </div>
            
              {/* User Answer */}
              {turn.answer && (
                <div className="flex items-start gap-3 my-3 justify-end">
                   <div className="bg-blue-500 text-white p-3 rounded-lg shadow-sm max-w-[85%]">
                     <p className="font-semibold text-sm">You:</p>
                     <p className="text-sm whitespace-pre-wrap">{turn.answer}</p>
                   </div>
                   <Avatar className="h-9 w-9 border">
                     <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                   </Avatar>
                </div>
              )}

              {/* AI Feedback */}
              {turn.feedback && (
                <div className="flex items-start gap-3 my-3">
                  <Avatar className="h-9 w-9 border border-accent/50">
                     <AvatarFallback className="bg-accent text-accent-foreground"><Bot className="h-5 w-5" /></AvatarFallback>
                  </Avatar>
                  <div className="bg-accent/10 border border-accent/30 p-3 rounded-lg shadow-sm max-w-[85%]">
                     <p className="font-semibold text-sm text-accent flex items-center gap-1">
                        AI Feedback:
                        <button onClick={() => speakText(turn.feedback!)} title="Speak this feedback" className="text-accent/70 hover:text-accent">
                            <Volume2 className="h-4 w-4"/>
                        </button>
                    </p>
                     <p className="text-sm whitespace-pre-wrap">{turn.feedback}</p>
                  </div>
                </div>
              )}
               {index < interviewHistory.length -1 && <Separator className="my-4"/>}
            </React.Fragment>
          ))}
          
          {currentAiQuestion && (
               <div className="flex items-start gap-3 my-3">
                  <Avatar className="h-9 w-9 border border-primary/30">
                     <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-5 w-5" /></AvatarFallback>
                  </Avatar>
                  <div className="bg-muted p-3 rounded-lg shadow-sm max-w-[85%]">
                     <p className="font-semibold text-sm text-primary flex items-center gap-1">
                        AI Coach Asks:
                         <button onClick={() => speakText(currentAiQuestion)} title="Speak this question" className="text-primary/70 hover:text-primary">
                            <Volume2 className="h-4 w-4"/>
                        </button>
                    </p>
                     <p className="text-sm whitespace-pre-wrap">{currentAiQuestion}</p>
                  </div>
                </div>
          )}
          
          {isLoading && (
              <div className="flex items-start gap-3 my-3">
                  <Avatar className="h-9 w-9 border border-primary/30">
                     <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-5 w-5" /></AvatarFallback>
                  </Avatar>
                  <div className="bg-muted p-3 rounded-lg shadow-sm flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> AI is thinking...
                  </div>
              </div>
          )}

          {isSessionOver && aiFullResponse && !currentAiQuestion && (
               <div className="flex items-start gap-3 my-3">
                  <Avatar className="h-9 w-9 border border-green-600/50">
                     <AvatarFallback className="bg-green-600 text-white"><Bot className="h-5 w-5" /></AvatarFallback>
                  </Avatar>
                  <div className="bg-green-100 border border-green-300 p-3 rounded-lg shadow-sm max-w-[85%]">
                     <p className="font-semibold text-sm text-green-700 flex items-center gap-1">
                        Session Ended:
                        <button onClick={() => speakText(aiFullResponse.includes("Here's your next question:") ? aiFullResponse.split("Here's your next question:")[0].trim() : aiFullResponse)} title="Speak this summary" className="text-green-700/70 hover:text-green-700">
                            <Volume2 className="h-4 w-4"/>
                        </button>
                    </p>
                     <p className="text-sm whitespace-pre-wrap">{aiFullResponse.includes("Here's your next question:") ? aiFullResponse.split("Here's your next question:")[0].trim() : aiFullResponse}</p>
                  </div>
                </div>
          )}
        </ScrollArea>
        
        {!isSessionOver && currentAiQuestion && !isLoading && (
          <CardFooter className="border-t pt-4">
            <Form {...answerForm}>
              <form onSubmit={answerForm.handleSubmit(handleAnswerSubmit)} className="w-full space-y-3">
                <FormField
                  control={answerForm.control}
                  name="answer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-md sr-only">Your Answer to: &quot;{currentAiQuestion.length > 70 ? currentAiQuestion.substring(0,70) + "..." : currentAiQuestion}&quot;</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Type or speak your answer here..."
                          className="min-h-[100px] text-base"
                          {...field}
                          disabled={isLoading || isRecording}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                    <Button 
                        type="button" 
                        onClick={toggleRecording} 
                        variant={isRecording ? "destructive" : "outline"}
                        size="icon"
                        disabled={isLoading}
                        title={isRecording ? "Stop Recording" : "Record Answer"}
                    >
                        {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>
                    <Button type="submit" disabled={isLoading || isRecording} className="flex-grow text-md py-3 px-5">
                    {isLoading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                    ) : (
                        <><Send className="mr-2 h-4 w-4" /> Submit Answer</>
                    )}
                    </Button>
                </div>
              </form>
            </Form>
          </CardFooter>
        )}
         {error && (
          <CardFooter className="border-t pt-2 pb-2 bg-destructive/10">
            <Alert variant="destructive" className="w-full text-xs">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

