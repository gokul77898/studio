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
import { Loader2, Wand2, AlertTriangle, Briefcase, UploadCloud, MapPin, BriefcaseBusiness, Github, Globe, Building, Map, Pin } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { JobCard } from '@/components/JobCard';
import type { Job, JobType } from '@/types';
import { mockJobs, jobTypes as allJobTypes, locations as allLocations } from '@/data/mockJobs';
import { aiJobSearch, type AiJobSearchOutput } from '@/ai/flows/aiJobSearchFlow';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/rtf",
  "text/markdown"
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
      "Invalid file type. Accepted: PDF, DOC, DOCX, TXT, RTF, MD."
    ),
  location: z.string().optional(), // General location from dropdown
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  jobType: z.string().optional(),
  githubUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
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
      location: '',
      country: '',
      state: '',
      city: '',
      area: '',
      jobType: '',
      githubUrl: '',
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

      const detailedLocation = {
        country: data.country || undefined,
        state: data.state || undefined,
        city: data.city || undefined,
        area: data.area || undefined,
      };
      
      const isDetailedLocationProvided = Object.values(detailedLocation).some(val => val !== undefined);

      const result: AiJobSearchOutput = await aiJobSearch({
        skills: data.skills,
        resumeDataUri: resumeDataUri,
        availableJobs: availableJobs,
        location: data.location || undefined,
        detailedLocation: isDetailedLocationProvided ? detailedLocation : undefined,
        jobType: data.jobType ? data.jobType as JobType : undefined,
        githubUrl: data.githubUrl || undefined,
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
            Tell us about your skills, preferences, and optionally upload your resume or GitHub. Our AI will help you find the most relevant jobs.
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
                    <FormDescriptionComponent>Describe your technical and soft skills. Example: React, Next.js, Tailwind CSS, Firebase, UI design</FormDescriptionComponent>
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
                          className="hidden" 
                          {...restField}
                        />
                        {value && <Button variant="outline" size="sm" onClick={() => onChange(undefined)}>Clear</Button>}
                       </div>
                    </FormControl>
                     <FormDescriptionComponent>
                      Accepted formats: PDF, DOC, DOCX, TXT, RTF, MD. Max 10MB.
                    </FormDescriptionComponent>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <p className="text-lg font-medium">Location Preferences (Optional)</p>
                <FormDescriptionComponent>
                  You can use the general location dropdown or provide more specific details below.
                </FormDescriptionComponent>
              </div>

              <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-md flex items-center gap-1"><MapPin className="h-4 w-4" />General Preferred Location</FormLabel>
                      <Select 
                        value={field.value === '' ? 'All Locations' : field.value}
                        onValueChange={(selectedValue) => field.onChange(selectedValue === 'All Locations' ? '' : selectedValue)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select general preferred location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {allLocations.map((loc) => (
                            <SelectItem key={loc} value={loc === 'All Locations' ? '__all_locations__' : loc}>
                              {loc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-md flex items-center gap-1"><Globe className="h-4 w-4" />Country</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., USA, United Kingdom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-md flex items-center gap-1"><Building className="h-4 w-4" />State/Province/Region</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., California, Ontario" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-md flex items-center gap-1"><Map className="h-4 w-4" />City/District</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., San Francisco, London" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-md flex items-center gap-1"><Pin className="h-4 w-4" />Specific Area/Neighborhood</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., SoMa, Shoreditch" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="jobType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg flex items-center gap-1"><BriefcaseBusiness className="h-4 w-4" />Preferred Job Type (Optional)</FormLabel>
                      <Select 
                        value={field.value === '' ? 'Any Type' : field.value}
                        onValueChange={(selectedValue) => field.onChange(selectedValue === 'Any Type' ? '' : selectedValue)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select preferred job type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Any Type">Any Type</SelectItem>
                          {allJobTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="githubUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg flex items-center gap-1"><Github className="h-4 w-4" />GitHub Profile URL (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="e.g., https://github.com/yourusername"
                          className="text-base"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>


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

