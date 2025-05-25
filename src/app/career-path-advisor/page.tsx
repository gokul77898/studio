
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
import { Loader2, Wand2, AlertTriangle, UploadCloud, Goal, Map, Briefcase, TrendingUp, DollarSign, Clock, ListChecks, Sparkles, BookOpen } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { predictCareerPaths, type CareerPathInput, type CareerPathOutput, type CareerPathSuggestion } from '@/ai/flows/careerPathAdvisorFlow';
import { Badge } from '@/components/ui/badge';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for resumes
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/rtf",
  "text/markdown"
];

// Updated schema to make userGoals optional
const careerPathFormSchema = z.object({
  resumeFile: z
    .instanceof(File, { message: "Please upload your resume." })
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file.type),
      "Invalid file type. Accepted: PDF, DOC, DOCX, TXT, RTF, MD."
    ),
  userGoals: z.string().optional(), // No min length required now
});

type CareerPathFormValues = z.infer<typeof careerPathFormSchema>;

const fileToDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function CareerPathAdvisorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictionResult, setPredictionResult] = useState<CareerPathOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<CareerPathFormValues>({
    resolver: zodResolver(careerPathFormSchema),
    defaultValues: {
      resumeFile: undefined,
      userGoals: '',
    }
  });

  const handleSubmit: SubmitHandler<CareerPathFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    setPredictionResult(null);

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
      const input: CareerPathInput = {
        resumeDataUri: resumeDataUri,
        userGoals: data.userGoals || undefined, // Pass undefined if empty
      };
      const result = await predictCareerPaths(input);
      setPredictionResult(result);
      toast({
        title: "Career Path Predictions Ready!",
        description: "The AI has suggested potential career paths for you below.",
        icon: <Map className="h-5 w-5 text-primary" />,
      });
    } catch (e) {
      console.error("Career path prediction error:", e);
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
      setError(`An error occurred during career path prediction. ${errorMessage}`);
       toast({
        title: "Prediction Error",
        description: errorMessage.substring(0,200),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderPathSuggestion = (suggestion: CareerPathSuggestion, index: number) => (
    <AccordionItem value={`path-${index}`} key={`path-${index}`} className="bg-card border border-border rounded-lg shadow-sm mb-4">
      <AccordionTrigger className="p-6 text-lg font-semibold hover:no-underline">
        <div className="flex items-center gap-3">
          <Briefcase className="h-6 w-6 text-primary" />
          {suggestion.pathTitle}
        </div>
      </AccordionTrigger>
      <AccordionContent className="p-6 pt-0 space-y-4">
        <p className="text-foreground/90">{suggestion.description}</p>
        
        {suggestion.conceptualSkills && suggestion.conceptualSkills.length > 0 && (
          <div>
            <h4 className="font-semibold mb-1 flex items-center gap-1"><ListChecks className="h-4 w-4 text-accent"/>Key Skills Areas:</h4>
            <div className="flex flex-wrap gap-2">
              {suggestion.conceptualSkills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
            </div>
          </div>
        )}

        <div>
          <h4 className="font-semibold mb-1 flex items-center gap-1"><TrendingUp className="h-4 w-4 text-accent"/>High-Level Roadmap:</h4>
          <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/80">
            {suggestion.roadmap.map((step, stepIdx) => <li key={stepIdx}>{step}</li>)}
          </ul>
        </div>

        {suggestion.conceptualCertifications && suggestion.conceptualCertifications.length > 0 && (
          <div>
            <h4 className="font-semibold mb-1 flex items-center gap-1"><BookOpen className="h-4 w-4 text-accent"/>Potential Learning/Certifications:</h4>
             <div className="flex flex-wrap gap-2">
                {suggestion.conceptualCertifications.map(cert => <Badge key={cert} variant="outline">{cert}</Badge>)}
            </div>
          </div>
        )}

        {suggestion.salaryOutlookGeneral && (
            <p className="text-sm text-muted-foreground flex items-center gap-1"><DollarSign className="h-4 w-4"/><strong>Salary Outlook (General):</strong> {suggestion.salaryOutlookGeneral}</p>
        )}
        {suggestion.timeEstimateGeneral && (
            <p className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-4 w-4"/><strong>Time Estimate (General):</strong> {suggestion.timeEstimateGeneral}</p>
        )}
      </AccordionContent>
    </AccordionItem>
  );

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Map className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl">AI Career Path Advisor</CardTitle>
          </div>
          <CardDescription className="text-md">
            Upload your resume and optionally describe your career goals. The AI will analyze your profile and suggest potential future career paths, along with high-level guidance.
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
                    <FormLabel className="text-lg">Your Resume</FormLabel>
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
                              setPredictionResult(null); // Clear previous results on new file
                          }}
                          className="hidden"
                          {...restField}
                        />
                         {value && <Button variant="outline" size="sm" onClick={() => {form.setValue('resumeFile', undefined as any); form.clearErrors('resumeFile'); setPredictionResult(null);}}>Clear</Button>}
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
                name="userGoals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg flex items-center gap-1"><Goal className="h-5 w-5 text-primary" /> Your Career Goals & Aspirations (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., 'I want to transition into a leadership role in tech within 5 years,' 'I'm passionate about sustainable energy and want to apply my data skills there,' 'Looking for a more creative role that uses my design and coding abilities.'"
                        className="min-h-[150px] text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormDescriptionComponent>
                      Describe what you're looking for in your career. Providing goals helps the AI give more tailored suggestions.
                    </FormDescriptionComponent>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="text-lg py-6 px-8">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Predicting Paths...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" />
                    Predict My Career Paths
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

      {isLoading && !predictionResult && (
         <div className="flex justify-center items-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="ml-3 text-md text-muted-foreground">AI is charting your potential futures...</p>
        </div>
      )}

      {predictionResult && !isLoading && (
        <Card className="shadow-xl mt-6">
          <CardHeader>
             <div className="flex items-center gap-3 mb-2">
                <Sparkles className="h-8 w-8 text-primary" />
                <CardTitle className="text-3xl">AI-Suggested Career Paths</CardTitle>
              </div>
              <CardDescription>
                Based on your resume and stated goals (if provided), here are some potential career paths the AI suggests exploring. These are high-level ideas to inspire your research and planning.
              </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {predictionResult.suggestedPaths.map((path, index) => renderPathSuggestion(path, index))}
            </Accordion>
          </CardContent>
           <CardFooter>
            <p className="text-xs text-muted-foreground">Remember, these are AI-generated suggestions. Real career planning involves deep research, networking, and personal development. Use these insights as a starting point for your journey.</p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

