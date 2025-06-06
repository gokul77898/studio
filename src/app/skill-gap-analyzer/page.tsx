
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
import { Loader2, Wand2, AlertTriangle, UploadCloud, FileText, Brain, Target, CheckSquare, XSquare, Percent, BookOpen, BarChart3 } from 'lucide-react'; // Changed Brain to BarChart3 for variety
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { analyzeSkillGap, type SkillGapAnalysisInput, type SkillGapAnalysisOutput } from '@/ai/flows/skillGapAnalysisFlow';
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for resumes
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/rtf",
  "text/markdown"
];

const skillGapFormSchema = z.object({
  resumeFile: z
    .instanceof(File, { message: "Please upload your resume." })
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file.type),
      "Invalid file type. Accepted: PDF, DOC, DOCX, TXT, RTF, MD."
    ),
  jobDescription: z.string().min(50, { message: "Job description must be at least 50 characters long." }),
});

type SkillGapFormValues = z.infer<typeof skillGapFormSchema>;

const fileToDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function SkillGapAnalyzerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<SkillGapAnalysisOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<SkillGapFormValues>({
    resolver: zodResolver(skillGapFormSchema),
    defaultValues: {
      resumeFile: undefined,
      jobDescription: '',
    }
  });

  const handleSubmit: SubmitHandler<SkillGapFormValues> = async (data) => {
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
      const input: SkillGapAnalysisInput = {
        resumeDataUri: resumeDataUri,
        jobDescription: data.jobDescription,
      };
      const result = await analyzeSkillGap(input);
      setAnalysisResult(result);
      toast({
        title: "Job-Resume Match Analysis Complete!",
        description: "Your detailed analysis report is ready below.",
        icon: <BarChart3 className="h-5 w-5 text-primary" />,
      });
    } catch (e) {
      console.error("Skill gap analysis error:", e);
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
      setError(`An error occurred during the analysis. ${errorMessage}`);
       toast({
        title: "Analysis Error",
        description: errorMessage.substring(0,200),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderSkillList = (skills: string[] | undefined, title: string, icon: React.ReactNode, badgeVariant: "default" | "secondary" | "destructive" | "outline" = "secondary", titleClassName?: string) => {
    if (!skills || skills.length === 0) return <p className="text-sm text-muted-foreground">None explicitly identified by the AI.</p>;
    return (
      <div>
        <h3 className={cn("text-lg font-semibold mb-2 flex items-center gap-2", titleClassName)}>{icon} {title}</h3>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <Badge key={`${title.toLowerCase().replace(/\s+/g, '-')}-${index}`} variant={badgeVariant} className="text-sm px-3 py-1">
              {skill}
            </Badge>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl">AI Job-Resume Match Analyzer</CardTitle>
          </div>
          <CardDescription className="text-md">
            Upload your resume and paste a target job description. The AI will provide a dynamic match score and highlight key skill alignments and gaps.
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
                              setAnalysisResult(null); // Clear previous results on new file
                          }}
                          className="hidden"
                          {...restField}
                        />
                         {value && <Button variant="outline" size="sm" onClick={() => {form.setValue('resumeFile', undefined as any); form.clearErrors('resumeFile'); setAnalysisResult(null);}}>Clear</Button>}
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
                name="jobDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Target Job Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste the full job description here..."
                        className="min-h-[200px] text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormDescriptionComponent>
                      Required. The more detailed the job description, the better the analysis.
                    </FormDescriptionComponent>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="text-lg py-6 px-8">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing Match...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" />
                    Analyze Job Match
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
            <p className="ml-3 text-md text-muted-foreground">AI is analyzing your resume against the job description...</p>
        </div>
      )}

      {analysisResult && !isLoading && (
        <Card className="shadow-xl mt-6">
          <CardHeader>
             <div className="flex items-center gap-3 mb-2">
                <Target className="h-8 w-8 text-primary" />
                <CardTitle className="text-3xl">Job-Resume Match Report</CardTitle>
              </div>
              <CardDescription>
                This report details how your resume aligns with the provided job description.
                Note: Real-time analysis of *every* job on the main listings page is computationally intensive. This page provides an in-depth match score for the specific job you've selected.
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <Percent className="h-6 w-6 text-accent" /> Overall Job-Resume Match Score
              </h3>
              <div className="flex items-center gap-4">
                <Progress value={analysisResult.overallFitScore} className={cn("h-6 flex-grow rounded-full", analysisResult.overallFitScore > 75 ? "[&>div]:bg-green-500" : analysisResult.overallFitScore > 40 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-red-500" )} />
                <span className={cn("text-3xl font-bold", analysisResult.overallFitScore > 75 ? "text-green-600" : analysisResult.overallFitScore > 40 ? "text-yellow-600" : "text-red-600")}>{analysisResult.overallFitScore}%</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{analysisResult.skillGapSummary}</p>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderSkillList(analysisResult.matchingSkills, "Matching Skills & Keywords", <CheckSquare className="h-5 w-5 text-green-600" />, "default", "text-green-700")}
                {renderSkillList(analysisResult.missingSkills, "Missing Skills & Keywords (Gaps)", <XSquare className="h-5 w-5 text-destructive" />, "destructive", "text-destructive")}
            </div>
            <Separator />
             {renderSkillList(analysisResult.identifiedUserSkills, "Skills Identified from Your Resume", <FileText className="h-5 w-5 text-blue-600" />, "outline", "text-blue-700")}
            <Separator />
            {renderSkillList(analysisResult.identifiedJobRequirements, "Requirements from Job Description", <Target className="h-5 w-5 text-indigo-600" />, "outline", "text-indigo-700")}
            <Separator />
            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2 text-purple-700">
                <BookOpen className="h-5 w-5 text-purple-600" /> AI Suggestions for Improvement
              </h3>
              {analysisResult.suggestionsForImprovement && analysisResult.suggestionsForImprovement.length > 0 ? (
                <ul className="list-disc space-y-2 pl-5 text-foreground/90">
                  {analysisResult.suggestionsForImprovement.map((suggestion, index) => (
                    <li key={`suggestion-${index}`}>{suggestion}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No specific improvement suggestions provided for now. Focus on addressing the missing skills identified.</p>
              )}
            </div>
          </CardContent>
           <CardFooter>
            <p className="text-xs text-muted-foreground">This analysis is AI-generated and intended as guidance. Always use your best judgment and tailor your application materials accordingly.</p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

