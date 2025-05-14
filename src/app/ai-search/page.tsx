
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
import { Loader2, Wand2, AlertTriangle, Briefcase, UploadCloud, MapPin, BriefcaseBusiness, Github, Globe, Building, Map, Pin, XCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { JobCard } from '@/components/JobCard';
import type { Job, JobType } from '@/types';
// import { mockJobs } from '@/data/mockJobs'; // Replaced with real-time fetching
import { jobTypes as allJobTypes, locations as allLocations } from '@/data/mockJobs'; // Keep these for filter options
import { fetchRealTimeJobs } from '@/services/jobSearchService';
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

const defaultFormValues: AiSearchFormValues = {
  skills: '',
  resumeFile: undefined,
  location: '',
  country: '',
  state: '',
  city: '',
  area: '',
  jobType: '',
  githubUrl: '',
};

export default function AiSearchPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingJobs, setIsFetchingJobs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendedJobsDisplay, setRecommendedJobsDisplay] = useState<RecommendedJobDisplay[]>([]);
  const [fetchedJobsForAI, setFetchedJobsForAI] = useState<Job[]>([]); // Store jobs fetched for AI
  const [savedJobIds, setSavedJobIds] = useLocalStorage<string[]>('savedJobIds', []);
  const [appliedJobIds, setAppliedJobIds] = useLocalStorage<string[]>('appliedJobIds', []);
  const { toast } = useToast();

  const form = useForm<AiSearchFormValues>({
    resolver: zodResolver(aiSearchFormSchema),
    defaultValues: defaultFormValues,
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

  const handleToggleAppliedStatus = (jobId: string) => {
    const isCurrentlyApplied = appliedJobIds.includes(jobId);
    if (isCurrentlyApplied) {
      setAppliedJobIds(appliedJobIds.filter(id => id !== jobId));
      toast({
        title: "Marked as Not Applied",
        description: "The job's application status has been updated.",
      });
    } else {
      setAppliedJobIds([...appliedJobIds, jobId]);
      toast({
        title: "Marked as Applied!",
        description: "Great job! This job is now marked as applied.",
        variant: "default",
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      });
    }
  };

  const handleClearFilters = () => {
    form.reset(defaultFormValues);
    setRecommendedJobsDisplay([]);
    setFetchedJobsForAI([]);
    setError(null);
    toast({
      title: "Filters Cleared",
      description: "All search criteria have been reset.",
    });
  };


  const onSubmit: SubmitHandler<AiSearchFormValues> = async (data) => {
    setIsLoading(true);
    setIsFetchingJobs(true);
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
        setIsFetchingJobs(false);
        return;
      }
    }

    try {
      // Fetch jobs from the real-time service based on form inputs
      // This example fetches a broad set of jobs; you might refine this
      // to pass more specific filters if your API and AI flow are designed for it.
      const filterCriteriaForFetch: Pick<AiSearchFormValues, "keyword" | "location" | "country" | "state" | "city" | "area" | "jobType"> & { jobTypes?: JobType[] } = {
        keyword: data.skills, // Use skills as keyword for initial fetch
        location: data.location,
        country: data.country,
        state: data.state,
        city: data.city,
        area: data.area,
        jobType: data.jobType,
        jobTypes: data.jobType ? [data.jobType as JobType] : []
      };
      
      const fetchedJobs = await fetchRealTimeJobs(filterCriteriaForFetch, 100); // Fetch up to 100 jobs for AI to parse
      setFetchedJobsForAI(fetchedJobs); // Store them for display or re-use
      setIsFetchingJobs(false);


      if (fetchedJobs.length === 0) {
        toast({
            title: "No Jobs Found by API",
            description: "The initial job fetch returned no results. AI search cannot proceed. Try broader criteria for fetching jobs.",
            variant: "default",
        });
        setIsLoading(false);
        return;
      }


      const detailedLocation = {
        country: data.country || undefined,
        state: data.state || undefined,
        city: data.city || undefined,
        area: data.area || undefined,
      };
      
      const isDetailedLocationProvided = Object.values(detailedLocation).some(val => val !== undefined && val !== '');

      const result: AiJobSearchOutput = await aiJobSearch({
        skills: data.skills,
        resumeDataUri: resumeDataUri,
        availableJobs: fetchedJobs.map(job => ({ // Ensure equity is boolean or undefined
            ...job,
            equity: job.equity === undefined ? undefined : Boolean(job.equity),
        })),
        location: data.location || undefined,
        detailedLocation: isDetailedLocationProvided ? detailedLocation : undefined,
        jobType: data.jobType ? data.jobType as JobType : undefined,
        githubUrl: data.githubUrl || undefined,
      });

      if (result.recommendations && result.recommendations.length > 0) {
        const detailedRecommendations: RecommendedJobDisplay[] = result.recommendations
          .map(rec => {
            // Find job from the list we provided to the AI
            const jobDetails = fetchedJobs.find(job => job.id === rec.jobId);
            return jobDetails ? { ...jobDetails, reason: rec.reason } : null;
          })
          .filter((job): job is RecommendedJobDisplay => job !== null);
        setRecommendedJobsDisplay(detailedRecommendations);
      } else {
        setRecommendedJobsDisplay([]);
        toast({
            title: "No specific matches found by AI",
            description: "The AI couldn't find specific job matches from the fetched jobs. Try broadening your search criteria.",
            variant: "default",
        });
      }
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An error occurred while searching for jobs.';
      setError(errorMessage + " You might need to configure the job search API in `src/services/jobSearchService.ts` and set the API key in your `.env` file.");
      toast({
        title: "Search Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsFetchingJobs(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Wand2 className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl">AI Powered Global Job Search</CardTitle>
          </div>
          <CardDescription className="text-md">
            Describe your skills, preferences, and optionally upload your resume or GitHub. Our AI will search live job listings to find relevant jobs from around the world.
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
                    <FormLabel className="text-lg">Your Skills & Keywords</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., JavaScript, React, Node.js, Project Management, Agile, UI/UX Design, Python, Machine Learning..."
                        className="min-h-[100px] text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormDescriptionComponent>This will also be used as keywords for the initial job fetch. Example: React, Next.js, Tailwind CSS, Firebase, UI design</FormDescriptionComponent>
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
                  Use the general location dropdown for broad areas (including global/remote) or provide specific details below for a more targeted search.
                </FormDescriptionComponent>
              </div>

              <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-md flex items-center gap-1"><MapPin className="h-4 w-4" />General Preferred Location</FormLabel>
                      <Select 
                        value={field.value || '__all_locations__'}
                        onValueChange={(selectedValue) => field.onChange(selectedValue === '__all_locations__' ? '' : selectedValue)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select general preferred location (e.g., Remote, Country, City)" />
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
                        <Input placeholder="e.g., USA, United Kingdom, India" {...field} value={field.value || ''} />
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
                        <Input placeholder="e.g., California, Ontario, Bavaria" {...field} value={field.value || ''} />
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
                        <Input placeholder="e.g., San Francisco, London, Bangalore" {...field} value={field.value || ''} />
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
                        <Input placeholder="e.g., SoMa, Shoreditch, Koramangala" {...field} value={field.value || ''} />
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
                        value={field.value || '__any_type__'}
                        onValueChange={(selectedValue) => field.onChange(selectedValue === '__any_type__' ? '' : selectedValue)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select preferred job type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__any_type__">Any Type</SelectItem>
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
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button type="submit" disabled={isLoading || isFetchingJobs} className="w-full sm:w-auto text-lg py-6 px-8">
                  {isFetchingJobs ? (
                     <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Fetching Live Jobs...
                    </>
                  ) : isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      AI Analyzing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-5 w-5" />
                      Find My Jobs
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClearFilters} 
                  className="w-full sm:w-auto text-lg py-6 px-8"
                  disabled={isLoading || isFetchingJobs}
                >
                  <XCircle className="mr-2 h-5 w-5" />
                  Clear All Filters
                </Button>
              </div>
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
      
      {isFetchingJobs && !error && (
         <div className="flex justify-center items-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="ml-3 text-md text-muted-foreground">Fetching live job listings for AI analysis...</p>
        </div>
      )}


      {!isLoading && !isFetchingJobs && recommendedJobsDisplay.length > 0 && (
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
                  isApplied={appliedJobIds.includes(item.id)}
                  onToggleApplied={handleToggleAppliedStatus}
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
       {!isLoading && !isFetchingJobs && !error && form.formState.isSubmitted && recommendedJobsDisplay.length === 0 && (
         <Alert variant="default" className="shadow-md">
           <AlertTriangle className="h-4 w-4" />
           <AlertTitle>No Specific AI Matches Found</AlertTitle>
           <AlertDescription>
             Our AI couldn&apos;t find specific job matches from the fetched live listings based on your input. You might want to try refining your skills, adjusting location filters, or browse all jobs on the main page.
           </AlertDescription>
         </Alert>
       )}
    </div>
  );
}

