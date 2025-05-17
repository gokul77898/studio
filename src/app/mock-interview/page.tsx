
'use client';

import { useState, useEffect, useRef } from 'react';
import type { SubmitHandler} from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as FormDescriptionComponent } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, Wand2, AlertTriangle, MessageSquare, User, Bot, Send, PlayCircle, Repeat, Brain } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { conductMockInterviewTurn, type MockInterviewInput, type MockInterviewOutput, type MockInterviewTurn } from '@/ai/flows/mockInterviewFlow';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';


const interviewSetupSchema = z.object({
  jobContext: z.string().optional(),
});
type InterviewSetupValues = z.infer<typeof interviewSetupSchema>;

const userAnswerSchema = z.object({
  answer: z.string().min(1, "Please provide an answer."),
});
type UserAnswerValues = z.infer<typeof userAnswerSchema>;


export default function MockInterviewPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [jobContext, setJobContext] = useState<string | undefined>(undefined);
  const [interviewHistory, setInterviewHistory] = useState<MockInterviewTurn[]>([]);
  const [currentAiQuestion, setCurrentAiQuestion] = useState<string | null>(null);
  const [aiFullResponse, setAiFullResponse] = useState<string | null>(null);
  const [isSessionOver, setIsSessionOver] = useState(false);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const setupForm = useForm<InterviewSetupValues>({
    resolver: zodResolver(interviewSetupSchema),
    defaultValues: { jobContext: '' },
  });

  const answerForm = useForm<UserAnswerValues>({
    resolver: zodResolver(userAnswerSchema),
    defaultValues: { answer: '' },
  });
  
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [interviewHistory, aiFullResponse]);


  const handleStartInterview: SubmitHandler<InterviewSetupValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    setAiFullResponse(null);
    setCurrentAiQuestion(null);
    setInterviewHistory([]);
    setIsSessionOver(false);
    setIsInterviewStarted(true);
    setJobContext(data.jobContext || undefined);

    try {
      const input: MockInterviewInput = { jobContext: data.jobContext || undefined };
      const result = await conductMockInterviewTurn(input);
      
      setAiFullResponse(result.aiResponseText);
      setCurrentAiQuestion(result.currentAiQuestion || null);
      if (result.isSessionOver) {
        setIsSessionOver(true);
      }
      toast({ title: "Mock Interview Started!", description: "The AI will ask the first question." });
    } catch (e) {
      handleApiError(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSubmit: SubmitHandler<UserAnswerValues> = async (data) => {
    if (!currentAiQuestion || isSessionOver) return;

    setIsLoading(true);
    setError(null);
    setAiFullResponse(null); // Clear previous full response

    // Optimistically add user's answer to history (feedback will be added later)
    const currentTurnForHistory: MockInterviewTurn = {
        question: currentAiQuestion,
        answer: data.answer,
        // Feedback will be populated by AI
    };
    
    try {
      const input: MockInterviewInput = {
        jobContext: jobContext,
        userAnswer: data.answer,
        lastAiQuestion: currentAiQuestion,
        interviewHistory: interviewHistory,
      };
      const result = await conductMockInterviewTurn(input);

      setAiFullResponse(result.aiResponseText);
      setCurrentAiQuestion(result.currentAiQuestion || null);
      
      // Update the last turn in history with AI feedback
      // The AI's response text should contain feedback. We assume the prompt guides AI here.
      // For simplicity, we'll store the entire aiResponseText as feedback if it contains some.
      // A more robust solution might involve the AI explicitly outputting a feedback field.
      const feedbackText = result.aiResponseText.split("Here's your next question:")[0].trim();

      setInterviewHistory(prev => [...prev, {...currentTurnForHistory, feedback: feedbackText}]);

      if (result.isSessionOver) {
        setIsSessionOver(true);
        toast({ title: "Mock Interview Session Ended.", description: "Hope this was helpful!"});
      } else {
        toast({ title: "Answer Submitted!", description: "AI is providing feedback and the next question."});
      }
      answerForm.reset(); // Clear the answer input
    } catch (e) {
      handleApiError(e);
      // If error, remove the optimistic update or mark it as failed.
      // For now, we'll just let it be, but a production app might revert.
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleApiError = (e: any) => {
    console.error("Mock interview error:", e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
    setError(`An error occurred: ${errorMessage.substring(0, 200)}`);
    toast({
      title: "Error",
      description: errorMessage.substring(0,100),
      variant: "destructive",
    });
    setIsInterviewStarted(false); // Allow user to try starting again
  }

  const handleRestartInterview = () => {
    setupForm.reset();
    answerForm.reset();
    setIsInterviewStarted(false);
    setCurrentAiQuestion(null);
    setAiFullResponse(null);
    setInterviewHistory([]);
    setIsSessionOver(false);
    setError(null);
    setJobContext(undefined);
    toast({ title: "Interview Restarted", description: "You can set a new context or start with general questions."});
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Brain className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl">AI Mock Interview Practice</CardTitle>
          </div>
          <CardDescription className="text-md">
            Practice your interview skills! Optionally provide a job context (e.g., &quot;Software Engineer behavioral interview&quot;) and the AI will ask relevant questions and provide feedback.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isInterviewStarted ? (
            <Form {...setupForm}>
              <form onSubmit={setupForm.handleSubmit(handleStartInterview)} className="space-y-6">
                <FormField
                  control={setupForm.control}
                  name="jobContext"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Job Context (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Frontend Developer, Behavioral questions for a Team Lead"
                          className="text-base"
                          {...field}
                        />
                      </FormControl>
                      <FormDescriptionComponent>
                        Providing context helps the AI ask more relevant questions. Leave blank for general interview practice.
                      </FormDescriptionComponent>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} className="text-lg py-6 px-8">
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Starting...</>
                  ) : (
                    <><PlayCircle className="mr-2 h-5 w-5" /> Start Mock Interview</>
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="space-y-6">
              {jobContext && (
                <Alert variant="default" className="border-primary/30 bg-primary/5">
                  <Brain className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-primary">Interview Context</AlertTitle>
                  <AlertDescription>{jobContext}</AlertDescription>
                </Alert>
              )}

              <ScrollArea className="h-[300px] w-full rounded-md border p-4 space-y-4" ref={scrollAreaRef}>
                {interviewHistory.map((turn, index) => (
                  <div key={index} className="space-y-2 mb-4">
                    {turn.question && (
                      <div className="flex items-start gap-2">
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-5 w-5" /></AvatarFallback>
                        </Avatar>
                        <div className="bg-muted p-3 rounded-lg shadow-sm max-w-[85%]">
                          <p className="font-semibold text-sm text-primary">AI Question:</p>
                          <p className="text-sm whitespace-pre-wrap">{turn.question}</p>
                        </div>
                      </div>
                    )}
                    {turn.answer && (
                      <div className="flex items-start gap-2 justify-end">
                         <div className="bg-blue-500 text-white p-3 rounded-lg shadow-sm max-w-[85%]">
                           <p className="font-semibold text-sm">Your Answer:</p>
                           <p className="text-sm whitespace-pre-wrap">{turn.answer}</p>
                         </div>
                         <Avatar className="h-8 w-8 mt-1">
                           <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                         </Avatar>
                      </div>
                    )}
                     {turn.feedback && (
                      <div className="flex items-start gap-2">
                        <Avatar className="h-8 w-8 mt-1">
                           <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-5 w-5" /></AvatarFallback>
                        </Avatar>
                        <div className="bg-accent/20 border border-accent/50 p-3 rounded-lg shadow-sm max-w-[85%]">
                           <p className="font-semibold text-sm text-accent">AI Feedback:</p>
                           <p className="text-sm whitespace-pre-wrap">{turn.feedback.split("Here's your next question:")[0].trim()}</p>
                        </div>
                      </div>
                    )}
                    {index < interviewHistory.length -1 && <Separator className="my-4"/>}
                  </div>
                ))}
                {/* Display current AI interaction (question or full response) */}
                {aiFullResponse && !currentAiQuestion && !isSessionOver &&  ( // Initial response before first question is isolated
                     <div className="flex items-start gap-2">
                        <Avatar className="h-8 w-8 mt-1">
                           <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-5 w-5" /></AvatarFallback>
                        </Avatar>
                        <div className="bg-muted p-3 rounded-lg shadow-sm max-w-[85%]">
                           <p className="text-sm whitespace-pre-wrap">{aiFullResponse}</p>
                        </div>
                      </div>
                )}
                 {currentAiQuestion && (
                     <div className="flex items-start gap-2">
                        <Avatar className="h-8 w-8 mt-1">
                           <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-5 w-5" /></AvatarFallback>
                        </Avatar>
                        <div className="bg-muted p-3 rounded-lg shadow-sm max-w-[85%]">
                           <p className="font-semibold text-sm text-primary">AI Asks:</p>
                           <p className="text-sm whitespace-pre-wrap">{currentAiQuestion}</p>
                        </div>
                      </div>
                )}
                 {isLoading && (
                    <div className="flex items-start gap-2">
                        <Avatar className="h-8 w-8 mt-1">
                           <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-5 w-5" /></AvatarFallback>
                        </Avatar>
                        <div className="bg-muted p-3 rounded-lg shadow-sm flex items-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> AI is thinking...
                        </div>
                    </div>
                )}
                {isSessionOver && aiFullResponse && (
                     <div className="flex items-start gap-2">
                        <Avatar className="h-8 w-8 mt-1">
                           <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-5 w-5" /></AvatarFallback>
                        </Avatar>
                        <div className="bg-green-100 border border-green-300 p-3 rounded-lg shadow-sm max-w-[85%]">
                           <p className="font-semibold text-sm text-green-700">Session Ended:</p>
                           <p className="text-sm whitespace-pre-wrap">{aiFullResponse}</p>
                        </div>
                      </div>
                )}


              </ScrollArea>
              
              {!isSessionOver && currentAiQuestion && (
                <Form {...answerForm}>
                  <form onSubmit={answerForm.handleSubmit(handleAnswerSubmit)} className="space-y-4 pt-4 border-t">
                    <FormField
                      control={answerForm.control}
                      name="answer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg">Your Answer to: &quot;{currentAiQuestion.length > 70 ? currentAiQuestion.substring(0,70) + "..." : currentAiQuestion}&quot;</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Type your answer here..."
                              className="min-h-[100px] text-base"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isLoading} className="text-md py-3 px-5">
                      {isLoading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                      ) : (
                        <><Send className="mr-2 h-4 w-4" /> Submit Answer</>
                      )}
                    </Button>
                  </form>
                </Form>
              )}

              <div className="pt-4 border-t">
                <Button onClick={handleRestartInterview} variant="outline" className="text-md py-3 px-5">
                  <Repeat className="mr-2 h-4 w-4" /> Restart Interview
                </Button>
              </div>
            </div>
          )}
        </CardContent>
         <CardFooter>
          {error && (
            <Alert variant="destructive" className="w-full">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
