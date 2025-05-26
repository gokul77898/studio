
'use client';

import { useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription as FormDescriptionComponent,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  Wand2,
  AlertTriangle,
  Sparkles,
  FileText,
  Building,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Frown,
  Users,
  TrendingUp,
  Scale, // Changed Balance to Scale
  Eye,
  MessageCircleQuestion,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


import {
  analyzeJobDescriptionText,
  type JobDescriptionAnalyzerInput,
  type JobDescriptionAnalyzerOutput,
} from '@/ai/flows/jobDescriptionAnalyzerFlow';
import { JobDescriptionAnalyzerInputSchema } from '@/ai/schemas/jobDescriptionAnalyzerSchema';

type AnalyzerFormValues = JobDescriptionAnalyzerInput;

export default function JobDescriptionAnalyzerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] =
    useState<JobDescriptionAnalyzerOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<AnalyzerFormValues>({
    resolver: zodResolver(JobDescriptionAnalyzerInputSchema),
    defaultValues: {
      jobDescriptionText: '',
      companyName: '',
    },
  });

  const handleSubmit: SubmitHandler<AnalyzerFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeJobDescriptionText(data);
      setAnalysisResult(result);
      toast({
        title: 'Analysis Complete!',
        description: "The AI's insights on the job description are ready.",
        icon: <Sparkles className="h-5 w-5 text-primary" />,
      });
    } catch (e) {
      console.error('Job description analysis error:', e);
      const errorMessage =
        e instanceof Error ? e.message : 'An unexpected error occurred.';
      setError(
        `An error occurred during analysis. ${errorMessage}`
      );
      toast({
        title: 'Analysis Error',
        description: errorMessage.substring(0, 200),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderCues = (cues: {cue: string, explanation: string}[], type: 'positive' | 'concern' | 'management') => {
    if (!cues || cues.length === 0) {
      return <p className="text-sm text-muted-foreground">No specific cues identified by AI for this category.</p>;
    }
    return (
      <ul className="space-y-2">
        {cues.map((item, index) => (
          <li key={`${type}-${index}`} className="p-3 border rounded-md bg-muted/30">
            <p className="font-semibold text-sm">"{item.cue}"</p>
            <p className="text-xs text-foreground/80 mt-1">{item.explanation}</p>
          </li>
        ))}
      </ul>
    );
  };


  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Eye className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl">AI Job Description Analyzer</CardTitle>
          </div>
          <CardDescription className="text-md">
            Paste a job description below. The AI will analyze its language for tone, culture cues, potential red flags, and aspects that might influence job satisfaction.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="jobDescriptionText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg flex items-center gap-1"><FileText className="h-5 w-5"/> Job Description Text</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste the full job description here..."
                        className="min-h-[250px] text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormDescriptionComponent>
                      The more detailed the job description, the better the analysis.
                    </FormDescriptionComponent>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg flex items-center gap-1"><Building className="h-5 w-5"/> Company Name (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Acme Innovations Ltd."
                        {...field}
                      />
                    </FormControl>
                    <FormDescriptionComponent>
                      Helps the AI with general context if the company is well-known.
                    </FormDescriptionComponent>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="text-lg py-6 px-8"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing Description...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" />
                    Analyze Job Description
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="shadow-md mt-6">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && !analysisResult && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="ml-3 text-md text-muted-foreground">
            AI is carefully reading and analyzing the job description...
          </p>
        </div>
      )}

      {analysisResult && !isLoading && (
        <Card className="shadow-xl mt-6">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl">
                Job Description Analysis Report
              </CardTitle>
            </div>
             <CardDescription>
                Below is the AI's interpretation of the provided job description. This is based on textual cues and general understanding.
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Accordion type="multiple" defaultValue={['item-tone', 'item-positive', 'item-concerns', 'item-summary']} className="w-full">
                <AccordionItem value="item-tone">
                    <AccordionTrigger className="text-xl font-semibold hover:no-underline">
                        <div className="flex items-center gap-2">
                            <Smile className="h-5 w-5 text-accent" /> Overall Tone
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                        <p className="text-md text-foreground/90 p-3 bg-muted/20 rounded-md">{analysisResult.overallTone}</p>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-indicators">
                    <AccordionTrigger className="text-xl font-semibold hover:no-underline">
                         <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-accent" /> Key Environment Indicators
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 space-y-3">
                        <div className="p-3 border rounded-md">
                            <h4 className="font-medium mb-1 flex items-center gap-1 text-md"><Scale className="h-4 w-4 text-primary"/> Work-Life Balance:</h4>
                            <p className="text-sm text-foreground/80">{analysisResult.workLifeBalanceIndicator}</p>
                        </div>
                         <div className="p-3 border rounded-md">
                            <h4 className="font-medium mb-1 flex items-center gap-1 text-md"><Users className="h-4 w-4 text-primary"/> Autonomy vs. Collaboration:</h4>
                            <p className="text-sm text-foreground/80">{analysisResult.autonomyCollaborationIndicator}</p>
                        </div>
                         <div className="p-3 border rounded-md">
                            <h4 className="font-medium mb-1 flex items-center gap-1 text-md"><TrendingUp className="h-4 w-4 text-primary"/> Growth Opportunities:</h4>
                            <p className="text-sm text-foreground/80">{analysisResult.growthOpportunityIndicator}</p>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-positive">
                    <AccordionTrigger className="text-xl font-semibold hover:no-underline">
                         <div className="flex items-center gap-2">
                            <ThumbsUp className="h-5 w-5 text-green-600" /> Positive Cues from Text
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                        {renderCues(analysisResult.positiveCues, 'positive')}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-concerns">
                    <AccordionTrigger className="text-xl font-semibold hover:no-underline">
                         <div className="flex items-center gap-2">
                            <ThumbsDown className="h-5 w-5 text-destructive" /> Potential Concern Cues from Text
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                        {renderCues(analysisResult.potentialConcerns, 'concern')}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-management">
                    <AccordionTrigger className="text-xl font-semibold hover:no-underline">
                         <div className="flex items-center gap-2">
                            <Eye className="h-5 w-5 text-blue-600" /> Implied Management Style Cues
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                        {renderCues(analysisResult.managementStyleCues, 'management')}
                    </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-summary">
                    <AccordionTrigger className="text-xl font-semibold hover:no-underline">
                         <div className="flex items-center gap-2">
                            <MessageCircleQuestion className="h-5 w-5 text-purple-600" /> Summary & Advice
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                        <p className="text-md text-foreground/90 p-3 bg-purple-500/10 rounded-md border border-purple-500/30 whitespace-pre-wrap">{analysisResult.summaryAndAdvice}</p>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              This analysis is AI-generated based on the text provided. It's a tool for initial assessment. Always do further research and ask questions during the interview process to get a complete picture of the role and company culture.
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
