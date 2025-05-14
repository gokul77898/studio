
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
import { Loader2, Wand2, AlertTriangle, UploadCloud, FileText, Sparkles, Mail, User, Building } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { generateCoverLetter, type GenerateCoverLetterInput, type GenerateCoverLetterOutput } from '@/ai/flows/generateCoverLetterFlow';
import { Separator } from '@/components/ui/separator';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for resumes
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/rtf",
  "text/markdown"
];

const coverLetterFormSchema = z.object({
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
  jobDescription: z.string().min(50, { message: "Job description must be at least 50 characters long." }),
  userName: z.string().optional(),
  companyName: z.string().optional(), // Optional, AI will try to infer if empty
  jobTitle: z.string().optional(), // Optional, AI will try to infer if empty
});

type CoverLetterFormValues = z.infer<typeof coverLetterFormSchema>;

const fileToDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function CoverLetterGeneratorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<CoverLetterFormValues>({
    resolver: zodResolver(coverLetterFormSchema),
    defaultValues: {
      resumeFile: undefined,
      jobDescription: '',
      userName: '',
      companyName: '',
      jobTitle: '',
    }
  });

  const handleSubmit: SubmitHandler<CoverLetterFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    setGeneratedCoverLetter(null);

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
      const input: GenerateCoverLetterInput = {
        resumeDataUri: resumeDataUri,
        jobDescription: data.jobDescription,
        userName: data.userName || undefined,
        companyName: data.companyName || undefined,
        jobTitle: data.jobTitle || undefined,
      };
      const result = await generateCoverLetter(input);
      setGeneratedCoverLetter(result.generatedCoverLetterText);
      toast({
        title: "Cover Letter Generated!",
        description: "Your AI-powered cover letter is ready below.",
        icon: <Sparkles className="h-5 w-5 text-primary" />,
      });
    } catch (e) {
      console.error("Cover letter generation error:", e);
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
      setError(`An error occurred during cover letter generation. ${errorMessage}`);
       toast({
        title: "Generation Error",
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
            <Mail className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl">AI Cover Letter Generator</CardTitle>
          </div>
          <CardDescription className="text-md">
            Upload your resume, paste the job description, and provide your name. The AI will help craft a compelling first draft of your cover letter.
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
                          onChange={(e) => onChange(e.target.files?.[0])}
                          className="hidden"
                          {...restField}
                        />
                         {value && <Button variant="outline" size="sm" onClick={() => {form.setValue('resumeFile', undefined as any); form.clearErrors('resumeFile');}}>Clear</Button>}
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
                    <FormLabel className="text-lg">Job Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste the full job description here..."
                        className="min-h-[200px] text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormDescriptionComponent>
                      Required. The more detailed the job description, the better the AI can tailor the cover letter.
                    </FormDescriptionComponent>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                    control={form.control}
                    name="userName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-lg flex items-center gap-1"><User className="h-4 w-4" />Your Full Name (Optional)</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Jane Doe" {...field} />
                        </FormControl>
                        <FormDescriptionComponent>Used for the letter's sign-off.</FormDescriptionComponent>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-lg flex items-center gap-1"><Building className="h-4 w-4" />Company Name (Optional)</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Acme Corp" {...field} />
                        </FormControl>
                        <FormDescriptionComponent>AI will try to find it in the job description if left blank.</FormDescriptionComponent>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="jobTitle"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-lg flex items-center gap-1"><FileText className="h-4 w-4" />Job Title (Optional)</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Software Engineer" {...field} />
                        </FormControl>
                        <FormDescriptionComponent>AI will try to find it in the job description if left blank.</FormDescriptionComponent>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>


              <Button type="submit" disabled={isLoading} className="text-lg py-6 px-8">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Cover Letter...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" />
                    Generate Cover Letter
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

      {isLoading && !generatedCoverLetter && (
         <div className="flex justify-center items-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="ml-3 text-md text-muted-foreground">AI is drafting your cover letter...</p>
        </div>
      )}

      {generatedCoverLetter && !isLoading && (
        <Card className="shadow-xl mt-6">
          <CardHeader>
             <div className="flex items-center gap-3 mb-2">
                <FileText className="h-8 w-8 text-primary" />
                <CardTitle className="text-3xl">Generated Cover Letter</CardTitle>
              </div>
              <CardDescription>
                Below is the AI-generated draft of your cover letter in Markdown format. Please review it carefully, edit as needed, and then copy the text into your preferred document editor for final formatting and sending.
              </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              readOnly
              value={generatedCoverLetter}
              className="min-h-[500px] text-sm whitespace-pre-wrap bg-muted/30 border-dashed font-mono"
              aria-label="Generated Cover Letter Content"
            />
          </CardContent>
           <CardFooter>
            <p className="text-xs text-muted-foreground">This cover letter is AI-generated and intended as a starting point. Always review and personalize it before submitting.</p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
