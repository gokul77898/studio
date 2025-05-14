
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
import { Loader2, Wand2, AlertTriangle, UploadCloud, FileScan, Sparkles, CheckCircle, XCircle, ListChecks, TrendingUp, Percent, Palette, ScanSearch, SlidersHorizontal } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { analyzeResume, type ResumeAnalysisOutput, type ResumeAnalysisInput } from '@/ai/flows/resumeAnalyzerFlow';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';


const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for resumes
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/rtf",
  "text/markdown"
];

const resumeAnalyzerFormSchema = z.object({
  resumeFile: z
    .instanceof(File, { message: "Please upload your resume." })
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      `Max file size is 5MB.`
    )
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file.type),
      "Invalid file type. Accepted: PDF, DOC, DOCX, TXT, RTF, MD."
    ),
  jobDescription: z.string().optional(),
});

type ResumeAnalyzerFormValues = z.infer<typeof resumeAnalyzerFormSchema>;

const fileToDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function ResumeAnalyzerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<ResumeAnalyzerFormValues>({
    resolver: zodResolver(resumeAnalyzerFormSchema),
    defaultValues: {
      resumeFile: undefined,
      jobDescription: '',
    }
  });

  const onSubmit: SubmitHandler<ResumeAnalyzerFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

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
      const input: ResumeAnalysisInput = {
        resumeDataUri: resumeDataUri,
        jobDescription: data.jobDescription || undefined,
      };
      const result = await analyzeResume(input);
      setAnalysisResult(result);
      toast({
        title: "Analysis Complete!",
        description: "Your resume feedback is ready below.",
        icon: <Sparkles className="h-5 w-5 text-primary" />,
      });
    } catch (e) {
      console.error("Resume analysis error:", e);
      setError('An error occurred during resume analysis. Please try again.');
       toast({
        title: "Analysis Error",
        description: "An unexpected error occurred. Please check your connection or try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderScore = (label: string, score: number | undefined, icon: React.ReactNode) => {
    if (score === undefined) return null;
    const percentage = score * 10; // Assuming score is 1-10
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium flex items-center gap-2">{icon} {label}</span>
          <span className="text-primary font-semibold">{score}/10</span>
        </div>
        <Progress value={percentage} className="h-2" />
      </div>
    );
  };
  
  const renderSuitabilityScore = (score: number | undefined) => {
    if (score === undefined) return null;
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium flex items-center gap-2"><Percent className="h-4 w-4 text-accent"/> Job Suitability</span>
          <span className="text-accent font-semibold">{score}/100</span>
        </div>
        <Progress value={score} className="h-2 [&>div]:bg-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <FileScan className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl">AI Resume Analyzer</CardTitle>
          </div>
          <CardDescription className="text-md">
            Upload your resume and optionally a job description to get AI-powered feedback and suggestions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="resumeFile"
                render={({ field: { onChange, value, ...restField } }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Upload Your Resume</FormLabel>
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
                          onChange={(e) => onChange(e.target.files?.[0])} // Do not add undefined here
                          className="hidden"
                          {...restField}
                        />
                         {value && <Button variant="outline" size="sm" onClick={() => { form.setValue('resumeFile', undefined as any); form.clearErrors('resumeFile'); }}>Clear</Button>}
                       </div>
                    </FormControl>
                    <FormDescriptionComponent>
                      Required. Accepted: PDF, DOC, DOCX, TXT, RTF, MD. Max 5MB.
                    </FormDescriptionComponent>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jobDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Job Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste the job description here for tailored feedback..."
                        className="min-h-[150px] text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormDescriptionComponent>
                      Providing a job description helps the AI give more specific advice on tailoring your resume.
                    </FormDescriptionComponent>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="text-lg py-6 px-8">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" />
                    Analyze My Resume
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="shadow-md">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Analysis Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analysisResult && !isLoading && (
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl">Resume Analysis Results</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2"><SlidersHorizontal className="h-5 w-5 text-accent" />Overall Feedback</h3>
              <p className="text-foreground/90 whitespace-pre-wrap">{analysisResult.overallFeedback}</p>
            </div>
            
            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" />Strengths</h3>
                <ul className="list-disc space-y-2 pl-5 text-foreground/90">
                  {analysisResult.strengths.map((item, index) => <li key={`strength-${index}`}>{item}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-blue-500" />Areas for Improvement</h3>
                <ul className="list-disc space-y-2 pl-5 text-foreground/90">
                  {analysisResult.areasForImprovement.map((item, index) => <li key={`improvement-${index}`}>{item}</li>)}
                </ul>
              </div>
            </div>

            {(analysisResult.tailoringTips && analysisResult.tailoringTips.length > 0) && (
              <>
                <Separator />
                <div>
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><ListChecks className="h-5 w-5 text-indigo-500" />Tailoring Tips (for provided Job Description)</h3>
                  <ul className="list-disc space-y-2 pl-5 text-foreground/90">
                    {analysisResult.tailoringTips.map((item, index) => <li key={`tailoring-${index}`}>{item}</li>)}
                  </ul>
                </div>
              </>
            )}
            
            {(analysisResult.keywordSuggestions && analysisResult.keywordSuggestions.length > 0) && (
               <>
                <Separator />
                <div>
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><ScanSearch className="h-5 w-5 text-purple-500" />Keyword Suggestions</h3>
                  <ul className="list-disc space-y-2 pl-5 text-foreground/90">
                    {analysisResult.keywordSuggestions.map((item, index) => <li key={`keyword-${index}`}>{item}</li>)}
                  </ul>
                </div>
              </>
            )}
            
            <Separator />

            <div>
              <h3 className="text-xl font-semibold mb-4">Scores & Ratings</h3>
              <div className="space-y-4">
                {renderScore("Formatting & Clarity", analysisResult.formattingClarityScore, <Palette className="h-4 w-4 text-orange-500" />)}
                {renderScore("ATS Friendliness", analysisResult.atsFriendlinessScore, <FileScan className="h-4 w-4 text-teal-500" />)}
                {renderScore("Impact Quantification", analysisResult.impactQuantificationScore, <TrendingUp className="h-4 w-4 text-pink-500" />)}
                {renderSuitabilityScore(analysisResult.suitabilityScore)}
              </div>
            </div>

          </CardContent>
           <CardFooter>
            <p className="text-xs text-muted-foreground">This analysis is AI-generated and intended as guidance. Always use your best judgment.</p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
