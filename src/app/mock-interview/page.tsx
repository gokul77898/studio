
'use client';

import { useState } from 'react';
import type { SubmitHandler} from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation'; // Changed from next/navigation

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as FormDescriptionComponent } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlayCircle, UploadCloud, Brain, Briefcase, Building } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Added Alert imports

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for resumes
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/rtf",
  "text/markdown"
];

const interviewSetupSchema = z.object({
  resumeFile: z
    .instanceof(File, { message: "Please upload your resume." })
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file.type),
      "Invalid file type. Accepted: PDF, DOC, DOCX, TXT, RTF, MD."
    ),
  userSkills: z.string().optional(),
  targetCompanyName: z.string().optional(),
  jobContext: z.string().optional(),
});
type InterviewSetupValues = z.infer<typeof interviewSetupSchema>;

const fileToDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function MockInterviewSetupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // Added error state
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<InterviewSetupValues>({
    resolver: zodResolver(interviewSetupSchema),
    defaultValues: {
      resumeFile: undefined,
      userSkills: '',
      targetCompanyName: '',
      jobContext: '',
    },
  });

  const handleStartInterview: SubmitHandler<InterviewSetupValues> = async (data) => {
    setIsLoading(true);
    setError(null);

    let resumeDataUri: string;
    if (data.resumeFile) {
      try {
        resumeDataUri = await fileToDataUri(data.resumeFile);
      } catch (fileError) {
        console.error("Error converting resume to data URI:", fileError);
        toast({
          title: "File Processing Error",
          description: 'Failed to process resume file. Please try a different file.',
          variant: "destructive",
        });
        form.setError("resumeFile", { type: "manual", message: "Could not process file." });
        setIsLoading(false);
        return;
      }
    } else {
      // This case should ideally not be reached due to zod validation making resumeFile required
      toast({
        title: "Resume Required",
        description: 'Please upload your resume to start the mock interview.',
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    try {
      // Store data in localStorage for the session page
      localStorage.setItem('mockInterviewSetup', JSON.stringify({
        resumeDataUri,
        userSkills: data.userSkills || undefined,
        targetCompanyName: data.targetCompanyName || undefined,
        jobContext: data.jobContext || undefined,
      }));

      toast({
        title: "Starting Mock Interview...",
        description: "You will be redirected to the interview session.",
      });
      router.push('/mock-interview/session');
    } catch (e) {
      console.error("Error starting interview:", e);
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
      setError(`Failed to start interview session: ${errorMessage}`);
      toast({
        title: "Setup Error",
        description: `Could not start session: ${errorMessage.substring(0,100)}`,
        variant: "destructive",
      });
      setIsLoading(false);
    }
    // setIsLoading(false); // isLoading should be reset by the new page or if navigation fails
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-xl max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Brain className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl">AI Mock Interview Setup</CardTitle>
          </div>
          <CardDescription className="text-md">
            Prepare for your interview. Upload your resume (required), and optionally add skills, target company, and job context to tailor the session.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleStartInterview)} className="space-y-6">
              <FormField
                control={form.control}
                name="resumeFile"
                render={({ field: { onChange, value, ...restField } }) => (
                  <FormItem>
                    <FormLabel className="text-lg flex items-center gap-1"><UploadCloud className="h-5 w-5 text-primary" /> Your Resume (Required)</FormLabel>
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
                          onChange={(e) => onChange(e.target.files?.[0])}
                          className="hidden"
                          {...restField}
                        />
                         {value && <Button variant="outline" size="sm" onClick={() => {form.setValue('resumeFile', undefined as any); form.clearErrors('resumeFile');}}>Clear</Button>}
                       </div>
                    </FormControl>
                    <FormDescriptionComponent>
                      PDF, DOC, DOCX, TXT, RTF, MD. Max 5MB.
                    </FormDescriptionComponent>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="userSkills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg flex items-center gap-1"><Briefcase className="h-5 w-5 text-primary" /> Key Skills (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., JavaScript, React, Project Management, Python, Data Analysis..."
                        className="text-base min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescriptionComponent>
                      List some of your key skills to help tailor questions.
                    </FormDescriptionComponent>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetCompanyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg flex items-center gap-1"><Building className="h-5 w-5 text-primary" /> Target Company (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Google, Acme Corp, Local Startup"
                        className="text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormDescriptionComponent>
                      Mentioning a company can help the AI adjust question style or difficulty.
                    </FormDescriptionComponent>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jobContext"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">General Job Context (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Software Engineer behavioral, Product Manager, Team Lead"
                        className="text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormDescriptionComponent>
                      Provide a general role or interview type.
                    </FormDescriptionComponent>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button type="submit" disabled={isLoading} className="w-full text-lg py-6 px-8">
                {isLoading ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Setting up Session...</>
                ) : (
                  <><PlayCircle className="mr-2 h-5 w-5" /> Start Mock Interview Session</>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
