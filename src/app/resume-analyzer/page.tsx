
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
import { Loader2, Wand2, AlertTriangle, UploadCloud, FileScan, Sparkles, CheckCircle, XCircle, ListChecks, TrendingUp, Percent, Palette, ScanSearch, SlidersHorizontal, FilePlus2, RefreshCw, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { analyzeResume, type ResumeAnalysisOutput, type ResumeAnalysisInput } from '@/ai/flows/resumeAnalyzerFlow';
import { generateResume, type GenerateResumeOutput, type GenerateResumeInput } from '@/ai/flows/generateResumeFlow';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { cn } from "@/lib/utils"; // Added import for cn


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

const stringToDataUri = (text: string, mimeType: string = "text/markdown"): string => {
  const base64Text = btoa(unescape(encodeURIComponent(text))); // Ensure proper UTF-8 handling for btoa
  return `data:${mimeType};base64,${base64Text}`;
}

export default function ResumeAnalyzerPage() {
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isLoadingGeneration, setIsLoadingGeneration] = useState(false);
  const [isLoadingGeneratedResumeAnalysis, setIsLoadingGeneratedResumeAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisOutput | null>(null);
  const [generatedResumeText, setGeneratedResumeText] = useState<string | null>(null);
  const [generatedResumeAnalysisResult, setGeneratedResumeAnalysisResult] = useState<ResumeAnalysisOutput | null>(null);
  const [originalResumeDataUri, setOriginalResumeDataUri] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<ResumeAnalyzerFormValues>({
    resolver: zodResolver(resumeAnalyzerFormSchema),
    defaultValues: {
      resumeFile: undefined,
      jobDescription: '',
    }
  });

  const handleAnalyzeSubmit: SubmitHandler<ResumeAnalyzerFormValues> = async (data) => {
    setIsLoadingAnalysis(true);
    setError(null);
    setAnalysisResult(null);
    setGeneratedResumeText(null);
    setGeneratedResumeAnalysisResult(null);
    setOriginalResumeDataUri(null);

    let resumeDataUriForAnalysis: string;
    try {
      resumeDataUriForAnalysis = await fileToDataUri(data.resumeFile);
      setOriginalResumeDataUri(resumeDataUriForAnalysis);
    } catch (fileError) {
      console.error("Error converting resume to data URI:", fileError);
      setError('Failed to process resume file. Please try a different file.');
      form.setError("resumeFile", { type: "manual", message: "Could not process file." });
      setIsLoadingAnalysis(false);
      return;
    }

    try {
      const input: ResumeAnalysisInput = {
        resumeDataUri: resumeDataUriForAnalysis,
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
      setIsLoadingAnalysis(false);
    }
  };

  const analyzeGeneratedResume = async (markdownText: string, jobDesc?: string) => {
    setIsLoadingGeneratedResumeAnalysis(true);
    try {
      const generatedResumeDataUri = stringToDataUri(markdownText, "text/markdown");
      const analysisInput: ResumeAnalysisInput = {
        resumeDataUri: generatedResumeDataUri,
        jobDescription: jobDesc,
      };
      const result = await analyzeResume(analysisInput);
      setGeneratedResumeAnalysisResult(result);
      toast({
        title: "Generated Resume Analyzed!",
        description: "Feedback for the new resume is now available.",
      });
    } catch (e) {
      console.error("Error analyzing generated resume:", e);
      setError("An error occurred while analyzing the generated resume.");
      toast({
        title: "Generated Resume Analysis Error",
        variant: "destructive",
      });
    } finally {
      setIsLoadingGeneratedResumeAnalysis(false);
    }
  };

  const handleGenerateResume = async () => {
    if (!analysisResult || !originalResumeDataUri) {
      setError("Cannot generate resume without prior analysis and original resume data.");
      return;
    }
    setIsLoadingGeneration(true);
    setError(null);
    setGeneratedResumeText(null);
    setGeneratedResumeAnalysisResult(null); // Clear previous analysis of generated resume

    try {
      const input: GenerateResumeInput = {
        originalResumeDataUri: originalResumeDataUri,
        analysisFeedback: analysisResult,
        jobDescription: form.getValues("jobDescription") || undefined,
      };
      const result = await generateResume(input);
      setGeneratedResumeText(result.generatedResumeText);
      toast({
        title: "Resume Generated!",
        description: "Your new resume is ready. Analyzing it now...",
        icon: <FilePlus2 className="h-5 w-5 text-primary" />,
      });
      // Automatically analyze the generated resume
      if (result.generatedResumeText) {
        await analyzeGeneratedResume(result.generatedResumeText, form.getValues("jobDescription") || undefined);
      }
    } catch (e) {
      console.error("Resume generation error:", e);
      setError('An error occurred during resume generation. Please try again.');
      toast({
        title: "Generation Error",
        description: "An unexpected error occurred while generating the resume.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingGeneration(false);
    }
  };

  const renderScoreWithProgress = (label: string, score: number | undefined, icon: React.ReactNode, progressClassName?: string) => {
    if (score === undefined) return null;
    const percentage = score * 10; 
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium flex items-center gap-2">{icon} {label}</span>
          <span className="text-primary font-semibold">{score}/10</span>
        </div>
        <Progress value={percentage} className={cn("h-2", progressClassName)} />
      </div>
    );
  };
  
  const renderSuitabilityScoreWithProgress = (score: number | undefined, progressClassName?: string) => {
    if (score === undefined) return null;
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium flex items-center gap-2"><Percent className="h-4 w-4 text-accent"/> Job Suitability</span>
          <span className="text-accent font-semibold">{score}/100</span>
        </div>
        <Progress value={score} className={cn("h-2 [&>div]:bg-accent", progressClassName)} />
      </div>
    );
  };

  const renderAnalysisDetails = (currentAnalysis: ResumeAnalysisOutput | null, titlePrefix: string = "") => {
    if (!currentAnalysis) return null;
    return (
      <>
        <div>
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2"><SlidersHorizontal className="h-5 w-5 text-accent" />{titlePrefix}Overall Feedback</h3>
          <p className="text-foreground/90 whitespace-pre-wrap">{currentAnalysis.overallFeedback}</p>
        </div>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" />{titlePrefix}Strengths</h3>
            <ul className="list-disc space-y-2 pl-5 text-foreground/90">
              {currentAnalysis.strengths.map((item, index) => <li key={`strength-${titlePrefix.toLowerCase()}-${index}`}>{item}</li>)}
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-blue-500" />{titlePrefix}Areas for Improvement</h3>
            <ul className="list-disc space-y-2 pl-5 text-foreground/90">
              {currentAnalysis.areasForImprovement.map((item, index) => <li key={`improvement-${titlePrefix.toLowerCase()}-${index}`}>{item}</li>)}
            </ul>
          </div>
        </div>
        {(currentAnalysis.tailoringTips && currentAnalysis.tailoringTips.length > 0) && (
          <> <Separator /> <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><ListChecks className="h-5 w-5 text-indigo-500" />{titlePrefix}Tailoring Tips</h3>
              <ul className="list-disc space-y-2 pl-5 text-foreground/90">
                {currentAnalysis.tailoringTips.map((item, index) => <li key={`tailoring-${titlePrefix.toLowerCase()}-${index}`}>{item}</li>)}
              </ul>
            </div>
          </>
        )}
        {(currentAnalysis.keywordSuggestions && currentAnalysis.keywordSuggestions.length > 0) && (
           <> <Separator /> <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><ScanSearch className="h-5 w-5 text-purple-500" />{titlePrefix}Keyword Suggestions</h3>
              <ul className="list-disc space-y-2 pl-5 text-foreground/90">
                {currentAnalysis.keywordSuggestions.map((item, index) => <li key={`keyword-${titlePrefix.toLowerCase()}-${index}`}>{item}</li>)}
              </ul>
            </div>
          </>
        )}
        <Separator />
        <div>
          <h3 className="text-xl font-semibold mb-4">{titlePrefix}Scores & Ratings</h3>
          <div className="space-y-4">
            {renderScoreWithProgress("Formatting & Clarity", currentAnalysis.formattingClarityScore, <Palette className="h-4 w-4 text-orange-500" />)}
            {renderScoreWithProgress("ATS Friendliness", currentAnalysis.atsFriendlinessScore, <FileScan className="h-4 w-4 text-teal-500" />)}
            {renderScoreWithProgress("Impact Quantification", currentAnalysis.impactQuantificationScore, <TrendingUp className="h-4 w-4 text-pink-500" />)}
            {renderSuitabilityScoreWithProgress(currentAnalysis.suitabilityScore)}
          </div>
        </div>
      </>
    );
  }


  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <FileScan className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl">AI Resume Analyzer & Generator</CardTitle>
          </div>
          <CardDescription className="text-md">
            Upload your resume and optionally a job description. Get AI-powered feedback, then generate an improved version.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAnalyzeSubmit)} className="space-y-6">
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
                          onChange={(e) => {
                            onChange(e.target.files?.[0]);
                            setAnalysisResult(null); 
                            setGeneratedResumeText(null);
                            setGeneratedResumeAnalysisResult(null);
                            setOriginalResumeDataUri(null);
                          }}
                          className="hidden"
                          {...restField}
                        />
                         {value && <Button variant="outline" size="sm" onClick={() => { form.setValue('resumeFile', undefined as any); form.clearErrors('resumeFile'); setAnalysisResult(null); setGeneratedResumeText(null); setGeneratedResumeAnalysisResult(null); setOriginalResumeDataUri(null); }}>Clear</Button>}
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
                        placeholder="Paste the job description here for tailored feedback and generation..."
                        className="min-h-[150px] text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormDescriptionComponent>
                      Providing a job description helps the AI give more specific advice and generate a more tailored resume.
                    </FormDescriptionComponent>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoadingAnalysis || isLoadingGeneration || isLoadingGeneratedResumeAnalysis} className="text-lg py-6 px-8">
                {isLoadingAnalysis ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing Original...
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
        <Alert variant="destructive" className="shadow-md mt-6">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analysisResult && !isLoadingAnalysis && (
        <Card className="shadow-xl mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="h-8 w-8 text-primary" />
                <CardTitle className="text-3xl">Original Resume Analysis</CardTitle>
              </div>
               <Button onClick={handleGenerateResume} disabled={isLoadingGeneration || isLoadingAnalysis || isLoadingGeneratedResumeAnalysis} className="text-md py-3 px-5">
                {isLoadingGeneration ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generate Improved Resume
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderAnalysisDetails(analysisResult)}
          </CardContent>
           <CardFooter>
            <p className="text-xs text-muted-foreground">This analysis is AI-generated and intended as guidance. Always use your best judgment.</p>
          </CardFooter>
        </Card>
      )}
      
      {isLoadingGeneration && (
         <div className="flex justify-center items-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="ml-3 text-md text-muted-foreground">Generating improved resume...</p>
        </div>
      )}


      {generatedResumeText && !isLoadingGeneration && (
        <Card className="shadow-xl mt-6">
          <CardHeader>
             <div className="flex items-center gap-3 mb-2">
                <FilePlus2 className="h-8 w-8 text-primary" />
                <CardTitle className="text-3xl">AI-Generated Resume</CardTitle>
              </div>
              <CardDescription className="flex items-start gap-2">
                <Info className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                <span>
                  The AI has generated the resume content below in Markdown format. Copy this text and paste it into your preferred document editor (e.g., Google Docs, Microsoft Word) to apply your desired styling, fonts, and layout.
                </span>
              </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              readOnly
              value={generatedResumeText}
              className="min-h-[400px] text-sm whitespace-pre-wrap bg-muted/30 border-dashed font-mono"
              aria-label="Generated Resume Content"
            />
          </CardContent>
        </Card>
      )}

      {isLoadingGeneratedResumeAnalysis && !generatedResumeAnalysisResult && (
         <div className="flex justify-center items-center py-10 mt-6">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="ml-3 text-md text-muted-foreground">Analyzing generated resume...</p>
        </div>
      )}

      {generatedResumeAnalysisResult && !isLoadingGeneratedResumeAnalysis && (
        <Card className="shadow-xl mt-6">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
                <Sparkles className="h-8 w-8 text-green-600" /> {/* Changed icon color for distinction */}
                <CardTitle className="text-3xl">Analysis of Generated Resume</CardTitle>
            </div>
            <CardDescription>
                Feedback on the AI-generated resume content.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderAnalysisDetails(generatedResumeAnalysisResult, "Generated ")}
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">This analysis is AI-generated. Please review and edit the generated resume carefully to ensure accuracy and fit for your applications.</p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

