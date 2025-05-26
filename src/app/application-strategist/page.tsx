
'use client';

import { useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as FormDescriptionComponent } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, Wand2, AlertTriangle, UploadCloud, FileText, Briefcase, CheckSquare, XSquare, MessageSquare, AlignLeft, UserCheck, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { strategizeApplication, type ApplicationStrategistInput, type ApplicationStrategistOutput } from '@/ai/flows/applicationStrategistFlow';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for resumes
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/rtf",
  "text/markdown"
];

const strategistFormSchema = z.object({
  resumeFile: z
    .instanceof(File, { message: "Please upload your resume." })
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file.type),
      "Invalid file type. Accepted: PDF, DOC, DOCX, TXT, RTF, MD."
    ),
  jobDescriptionText: z.string().min(50, { message: "Job description must be at least 50 characters long." }),
});

type StrategistFormValues = z.infer<typeof strategistFormSchema>;

const fileToDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function ApplicationStrategistPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strategyResult, setStrategyResult] = useState<ApplicationStrategistOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<StrategistFormValues>({
    resolver: zodResolver(strategistFormSchema),
    defaultValues: {
      resumeFile: undefined,
      jobDescriptionText: '',
    }
  });

  const handleSubmit: SubmitHandler<StrategistFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    setStrategyResult(null);

    let resumeDataUri: string;
    try {
      resumeDataUri = await fileToDataUri(data.resumeFile);
    } catch (fileError) {
      console.error("Error converting resume to data URI:", fileError);
      setError('Failed to process resume file. Please try a different file.');
      form.setError("resumeFile", { type: "manual", message: "Could not process file." });
      setIsLoading(false);
      return;
    }

    try {
      const input: ApplicationStrategistInput = {
        resumeDataUri: resumeDataUri,
        jobDescriptionText: data.jobDescriptionText,
      };
      const result = await strategizeApplication(input);
      setStrategyResult(result);
      toast({
        title: "Application Strategy Ready!",
        description: "The AI has generated a tailored strategy for this job application.",
        icon: <Sparkles className="h-5 w-5 text-primary" />,
      });
    } catch (e) {
      console.error("Application strategy error:", e);
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
      setError(`An error occurred during strategy generation. ${errorMessage}`);
       toast({
        title: "Strategy Error",
        description: errorMessage.substring(0,200),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <UserCheck className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl">AI Application Strategist</CardTitle>
          </div>
          <CardDescription className="text-md">
            Upload your resume and paste a specific job description. The AI will provide a tailored strategy to help you apply effectively.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="resumeFile"
                render={({ field: { onChange, value, ...restField } }) => (
                  <FormItem>
                    <FormLabel className="text-lg flex items-center gap-1"><UploadCloud className="h-5 w-5" /> Your Resume</FormLabel>
                    <FormControl>
                       <div className="flex items-center gap-2">
                        <label htmlFor="resumeFile-input" className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-input rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                          <UploadCloud className="h-4 w-4" />
                          {value?.name ? `Selected: ${value.name.substring(0,30)}${value.name.length > 30 ? '...' : ''}` : 'Choose Resume File'}
                        </label>
                        <Input
                          id="resumeFile-input"
                          type="file"
                          accept={ACCEPTED_FILE_TYPES.join(",")}
                          onChange={(e) => {
                              const file = e.target.files?.[0];
                              onChange(file);
                              setStrategyResult(null); 
                          }}
                          className="hidden"
                          {...restField}
                        />
                         {value && <Button variant="outline" size="sm" onClick={() => {form.setValue('resumeFile', undefined as any); form.clearErrors('resumeFile'); setStrategyResult(null);}}>Clear</Button>}
                       </div>
                    </FormControl>
                    <FormDescriptionComponent>
                      Required. PDF, DOC, DOCX, TXT, RTF, MD. Max 5MB.
                    </FormDescriptionComponent>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jobDescriptionText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg flex items-center gap-1"><FileText className="h-5 w-5" /> Target Job Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste the full job description here..."
                        className="min-h-[200px] text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormDescriptionComponent>
                      Required. The more detailed the job description, the better the strategy.
                    </FormDescriptionComponent>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="text-lg py-6 px-8">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Developing Strategy...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" />
                    Get My Application Strategy
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

      {isLoading && !strategyResult && (
         <div className="flex justify-center items-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="ml-3 text-md text-muted-foreground">AI is analyzing your profile and the job to craft a strategy...</p>
        </div>
      )}

      {strategyResult && !isLoading && (
        <Card className="shadow-xl mt-6">
          <CardHeader>
             <div className="flex items-center gap-3 mb-2">
                <Sparkles className="h-8 w-8 text-primary" />
                <CardTitle className="text-3xl">Your AI Application Strategy</CardTitle>
              </div>
              <CardDescription>
                Below is the AI-generated strategy for applying to this specific job.
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Accordion type="multiple" defaultValue={['item-0', 'item-1', 'item-2', 'item-3', 'item-4']} className="w-full">
              
              <AccordionItem value="item-0">
                <AccordionTrigger className="text-xl font-semibold"><Briefcase className="mr-2 h-5 w-5 text-accent" />Resume-to-Job Description Match Analysis</AccordionTrigger>
                <AccordionContent className="pt-2 space-y-3">
                  <p className="text-sm text-foreground/90">{strategyResult.resumeJdMatchAnalysis.matchSummary}</p>
                  <div>
                    <h4 className="font-medium mb-1 flex items-center gap-1 text-md"><CheckSquare className="h-4 w-4 text-green-600"/>Strong Matches:</h4>
                    {strategyResult.resumeJdMatchAnalysis.strongMatches.length > 0 ? (
                      <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/80">
                        {strategyResult.resumeJdMatchAnalysis.strongMatches.map((item, idx) => <li key={`strong-${idx}`}>{item}</li>)}
                      </ul>
                    ) : <p className="text-sm text-muted-foreground pl-5">No specific strong matches highlighted by AI.</p>}
                  </div>
                  <div>
                    <h4 className="font-medium mb-1 flex items-center gap-1 text-md"><XSquare className="h-4 w-4 text-destructive"/>Potential Gaps:</h4>
                     {strategyResult.resumeJdMatchAnalysis.potentialGaps.length > 0 ? (
                        <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/80">
                            {strategyResult.resumeJdMatchAnalysis.potentialGaps.map((item, idx) => <li key={`gap-${idx}`}>{item}</li>)}
                        </ul>
                     ) : <p className="text-sm text-muted-foreground pl-5">No specific gaps highlighted by AI.</p>}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-1">
                <AccordionTrigger className="text-xl font-semibold"><AlignLeft className="mr-2 h-5 w-5 text-accent" />Targeted Resume Enhancements</AccordionTrigger>
                <AccordionContent className="pt-2 space-y-3">
                  {strategyResult.targetedResumeEnhancements.length > 0 ? (
                    strategyResult.targetedResumeEnhancements.map((enhancement, index) => (
                      <div key={`enhancement-${index}`} className="p-3 border rounded-md bg-muted/30">
                        <p className="font-semibold text-sm">{enhancement.areaToImprove}:</p>
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap">{enhancement.suggestion}</p>
                      </div>
                    ))
                  ) : <p className="text-sm text-muted-foreground">No specific resume enhancement suggestions provided by AI.</p>}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="text-xl font-semibold"><MessageSquare className="mr-2 h-5 w-5 text-accent" />Cover Letter Talking Points</AccordionTrigger>
                <AccordionContent className="pt-2">
                  <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/80">
                    {strategyResult.coverLetterTalkingPoints.map((point, index) => (
                      <li key={`cl-point-${index}`}>{point}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger className="text-xl font-semibold"><UserCheck className="mr-2 h-5 w-5 text-accent" />Potential Interview Questions</AccordionTrigger>
                <AccordionContent className="pt-2 space-y-3">
                  {strategyResult.potentialInterviewQuestions.map((item, index) => (
                    <div key={`interview-q-${index}`} className="p-3 border rounded-md bg-muted/30">
                      <p className="font-semibold text-sm">{item.question}</p>
                      <p className="text-xs text-foreground/70 mt-1"><em>Reasoning: {item.reasoning}</em></p>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-xl font-semibold"><Wand2 className="mr-2 h-5 w-5 text-accent" />Overall Application Strategy Snippet</AccordionTrigger>
                <AccordionContent className="pt-2">
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">{strategyResult.overallStrategySnippet}</p>
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          </CardContent>
           <CardFooter>
            <p className="text-xs text-muted-foreground">This strategy is AI-generated. Always review and adapt it based on your unique experience and the specific application context.</p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
