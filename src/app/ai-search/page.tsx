
'use client';

import type { ChangeEvent} from 'react';
import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription as FormDescriptionComponent, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, Wand2, AlertTriangle, Briefcase, UploadCloud } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { JobCard } from '@/components/JobCard';
import type { Job } from '@/types';
import { mockJobs } from '@/data/mockJobs';
import { aiJobSearch, type AiJobSearchOutput } from '@/ai/flows/aiJobSearchFlow';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useToast } from "@/hooks/use-toast";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];


const aiSearchFormSchema = z.object({
  skills: z.string().min(10, { message: "Please describe your skills (min 10 characters)." }),
  resumeFile: z
    .instanceof(File)
    .optional()
    .refine(
      (file) => !file || file.size <= MAX_FILE_SIZE,
      `Max file size is 10MB.`
    )
    .refine(
      (file) => !file || ACCEPTED_FILE_TYPES.includes(file.type),
      "Invalid file type. Accepted: PDF, DOC, DOCX, TXT."
    ),
});
type AiSearchFormValues = z.infer<typeof aiSearchFormSchema>;

interface RecommendedJobDisplay extends Job {
  reason: string;
}

const fileToDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function AiSearchPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendedJobsDisplay, setRecommendedJobsDisplay] = useState<RecommendedJobDisplay[]>([]);
  const [savedJobIds, setSavedJobIds] = useLocalStorage<string[]>('savedJobIds', []);
  const { toast } = useToast();

  const form = useForm<AiSearchFormValues>({
    resolver: zodResolver(aiSearchFormSchema),
    defaultValues: {
      skills: '',
      resumeFile: undefined,
    },
  });

  const handleSaveToggle = (jobId: string) => {
    const isCurrentlySaved = savedJobIds.includes(jobId);
    if (isCurrentlySaved) {
      setSavedJobIds(savedJobIds.filter(id => id !== jobId));
      toast({
        title: "Job Unsaved",
        description: "The job has been removed from your saved list.",
      });
    } else {
      setSavedJobIds([...savedJobIds, jobId]);
      toast({
        title: "Job Saved!",
        description: "The job has been added to your saved list.",
      });
    }
  };

  const onSubmit: SubmitHandler<AiSearchFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    setRecommendedJobsDisplay([]);

    let resumeDataUri: string | undefined = undefined;
    if (data.resumeFile) {
      try {
        resumeDataUri = await fileToDataUri(data.resumeFile);
      } catch (fileError) {
        console.error("Error converting resume to data URI:", fileError);
        setError('Failed to process resume file. Please try a different file or skip.');
        form.setError("resumeFile", { type: "manual", message: "Could not process file." });
        setIsLoading(false);
        return;
      }
    }

    try {
      const availableJobs = mockJobs.map(job => ({
        ...job,
        equity: job.equity === undefined ? undefined : Boolean(job.equity), 
      }));

      const result: AiJobSearchOutput = await aiJobSearch({
        skills: data.skills,
        resumeDataUri: resumeDataUri,
        availableJobs: availableJobs,
      });

      if (result.recommendations && result.recommendations.length > 0) {
        const detailedRecommendations: RecommendedJobDisplay[] = result.recommendations
          .map(rec => {
            const jobDetails = mockJobs.find(job => job.id === rec.jobId);
            return jobDetails ? { ...jobDetails, reason: rec.reason } : null;
          })
          .filter((job): job is RecommendedJobDisplay => job !== null);
        setRecommendedJobsDisplay(detailedRecommendations);
      } else {
        setRecommendedJobsDisplay([]);
        toast({
            title: "No specific matches found",
            description: "The AI couldn't find specific job matches based on your input. Try refining your skills or browse all jobs.",
            variant: "default",
        });
      }
    } catch (e) {
      console.error(e);
      setError('An error occurred while searching for jobs. Please try again.');
      toast({
        title: "Search Error",
        description: "An unexpected error occurred. Please check your connection or try again later.",
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
            <Wand2 className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl">AI Powered Job Search</CardTitle>
          </div>
          <CardDescription className="text-md">
            Tell us about your skills and optionally upload your resume. Our AI will help you find the most relevant jobs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Your Skills</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., JavaScript, React, Node.js, Project Management, Agile, UI/UX Design..."
                        className="min-h-[100px] text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="resumeFile"
                render={({ field: { onChange, value, ...restField } }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Upload Your Resume (Optional)</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <label htmlFor="resumeFile-input" className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-input rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                          <UploadCloud className="h-4 w-4" />
                          {value?.name ? `Selected: ${value.name.substring(0,30)}${value.name.length > 30 ? '...' : ''}` : 'Choose File'}
                        </label>
                        <Input
                          id="resumeFile-input"
                          type="file"
                          accept={ACCEPTED_FILE_TYPES.join(",")}
                          onChange={(e) => onChange(e.target.files?.[0] || undefined)}
                          className="hidden" // Hidden as we use a custom styled label
                          {...restField}
                        />
                        {value && <Button variant="outline" size="sm" onClick={() => onChange(undefined)}>Clear</Button>}
                       </div>
                    </FormControl>
                     <FormDescriptionComponent>
                      Accepted formats: PDF, DOC, DOCX, TXT. Max 10MB.
                    </FormDescriptionComponent>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto text-lg py-6 px-8">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" />
                    Find My Jobs
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
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && recommendedJobsDisplay.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-primary" />
            AI Recommended Jobs ({recommendedJobsDisplay.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedJobsDisplay.map((item) => (
              <div key={item.id} className="flex flex-col gap-2">
                <JobCard
                  job={item}
                  isSaved={savedJobIds.includes(item.id)}
                  onSaveToggle={handleSaveToggle}
                />
                <Card className="bg-accent/10 border-accent/30 shadow">
                  <CardHeader className='pb-2 pt-4'>
                    <CardTitle className="text-sm font-semibold text-accent flex items-center gap-2">
                      <Wand2 className="h-4 w-4" />
                      AI Recommendation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='pb-4'>
                    <p className="text-xs text-accent-foreground/90">{item.reason}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
       {!isLoading && !error && form.formState.isSubmitted && recommendedJobsDisplay.length === 0 && (
         <Alert variant="default" className="shadow-md">
           <AlertTriangle className="h-4 w-4" />
           <AlertTitle>No Specific Matches Found</AlertTitle>
           <AlertDescription>
             Our AI couldn&apos;t find specific job matches based on your input. You might want to try refining your skills or browse all jobs.
           </AlertDescription>
         </Alert>
       )}
    </div>
  );
}
