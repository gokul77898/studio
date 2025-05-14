
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Job, FilterCriteria } from '@/types';
import { fetchRealTimeJobs } from '@/services/jobSearchService';
import { JobCard } from '@/components/JobCard';
import { JobFilters } from '@/components/JobFilters';
import { SavedJobsSection } from '@/components/SavedJobsSection';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';

const initialFilters: FilterCriteria = {
  keyword: '',
  location: '',
  jobTypes: [],
  country: '',
  state: '',
  city: '',
  area: '',
};

const JOBS_PER_PAGE = 21; // Fetch more jobs for better client-side filtering experience initially

export default function HomePage() {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterCriteria>(initialFilters);
  const [savedJobIds, setSavedJobIds] = useLocalStorage<string[]>('savedJobIds', []);
  const [appliedJobIds, setAppliedJobIds] = useLocalStorage<string[]>('appliedJobIds', []);
  const { toast } = useToast();

  const loadJobs = useCallback(async (currentFilters: FilterCriteria, showLoadingIndicator: boolean = true) => {
    if (showLoadingIndicator) setIsLoading(true);
    setError(null);
    try {
      // Pass currentFilters to fetchRealTimeJobs.
      // The service will construct the appropriate query for the API.
      const jobs = await fetchRealTimeJobs(currentFilters, JOBS_PER_PAGE);
      setAllJobs(jobs);
      if (jobs.length === 0 && (currentFilters.keyword || currentFilters.location || currentFilters.country || currentFilters.city || currentFilters.state || currentFilters.area || currentFilters.jobTypes.length > 0)) {
        toast({
          title: "No Jobs Found",
          description: "Your search/filter criteria did not match any live job listings. Try broadening your search.",
          variant: "default",
        });
      }
    } catch (e) {
      console.error("Failed to fetch jobs:", e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to load jobs.';
      setError(errorMessage + " Please ensure your JOB_SEARCH_API_KEY is correctly set in the .env file and the API service is reachable. Refer to `src/services/jobSearchService.ts` for setup instructions.");
      toast({
        title: "Error Loading Jobs",
        description: errorMessage,
        variant: "destructive",
      });
      setAllJobs([]); // Clear jobs on error
    } finally {
      if (showLoadingIndicator) setIsLoading(false);
    }
  }, [toast]);


  useEffect(() => {
    // Load initial set of jobs (e.g., generic software developer jobs worldwide)
    loadJobs({keyword: 'Software Developer', location: 'Worldwide', jobTypes: []});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (newFilters: FilterCriteria) => {
    setFilters(newFilters);
    // Filters are applied by the "Apply Filters & Search" button
  };

  const handleApplyFilters = () => {
    loadJobs(filters); 
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    // Optionally, reload with default filters or clear jobs list
    // loadJobs({keyword: 'Software Developer', location: 'Worldwide', jobTypes: []}); 
    setAllJobs([]); // Clear current jobs to reflect filter reset
    toast({
        title: "Filters Cleared",
        description: "Search filters have been reset. Click 'Apply Filters & Search' for new results.",
    });
  };

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
        variant: "default",
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

  // Client-side filtering is still useful for refining results from the API if the API's filtering is not exhaustive
  // or if you want to offer instant filtering on the currently loaded set of jobs.
  // However, the primary filtering should ideally happen server-side via the API call in `loadJobs`.
  const displayedJobs = useMemo(() => {
    // If your API handles all filtering perfectly, you might just return allJobs here.
    // This client-side filter is a fallback or for UX refinement.
    return allJobs.filter(job => {
      const jobLocationLower = job.location?.toLowerCase() || '';
      const jobTitleLower = job.title?.toLowerCase() || '';
      const jobCompanyLower = job.company?.toLowerCase() || '';
      const jobDescLower = job.description?.toLowerCase() || '';
      const filterKeywordLower = filters.keyword.toLowerCase();

      const keywordMatch = filterKeywordLower
        ? jobTitleLower.includes(filterKeywordLower) ||
          jobCompanyLower.includes(filterKeywordLower) ||
          jobDescLower.includes(filterKeywordLower)
        : true;
      
      const generalLocationFilter = filters.location?.toLowerCase();
      const generalLocationMatch = generalLocationFilter && generalLocationFilter !== 'all locations' && generalLocationFilter !== 'worldwide' && generalLocationFilter !== ''
        ? jobLocationLower.includes(generalLocationFilter) || (generalLocationFilter === 'remote' && jobLocationLower.includes('remote'))
        : true;

      const countryMatch = filters.country
        ? jobLocationLower.includes(filters.country.toLowerCase())
        : true;
      const stateMatch = filters.state
        ? jobLocationLower.includes(filters.state.toLowerCase())
        : true;
      const cityMatch = filters.city
        ? jobLocationLower.includes(filters.city.toLowerCase())
        : true;
      const areaMatch = filters.area 
        ? jobLocationLower.includes(filters.area.toLowerCase())
        : true;
      
      const detailedLocationProvided = !!(filters.country || filters.state || filters.city || filters.area);
      
      let locationCombinedMatch = generalLocationMatch;
      if (detailedLocationProvided) {
         // If detailed location is provided, it's the primary location filter
        locationCombinedMatch = countryMatch && stateMatch && cityMatch && areaMatch;
         // And if general location is also set (not 'All' or 'Worldwide'), it must also match
        if (generalLocationFilter && generalLocationFilter !== 'all locations' && generalLocationFilter !== 'worldwide' && generalLocationFilter !== '') {
            locationCombinedMatch = locationCombinedMatch && generalLocationMatch;
        }
      }


      const jobTypeMatch = filters.jobTypes.length > 0
        ? filters.jobTypes.includes(job.type)
        : true;
        
      return keywordMatch && locationCombinedMatch && jobTypeMatch;
    });
  }, [allJobs, filters]);

  const savedJobs = useMemo(() => {
    // Find saved jobs from the currently *fetched* allJobs list
    return allJobs.filter(job => savedJobIds.includes(job.id));
  }, [allJobs, savedJobIds]);

  return (
    <div className="space-y-8">
      <JobFilters 
        filters={filters} 
        onFilterChange={handleFilterChange} 
        onClearFilters={handleClearFilters}
        onApplyFilters={handleApplyFilters}
        isApplying={isLoading}
      />

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Loading real-time job listings...</p>
        </div>
      )}

      {error && !isLoading && (
         <Alert variant="destructive" className="shadow-md">
           <AlertCircle className="h-4 w-4" />
           <AlertTitle>Error Loading Jobs</AlertTitle>
           <AlertDescription>
             {error}
             <Button onClick={() => loadJobs(filters)} variant="link" className="p-0 h-auto mt-2 text-destructive-foreground">Try reloading</Button>
           </AlertDescription>
         </Alert>
      )}

      {!isLoading && !error && displayedJobs.length === 0 && allJobs.length > 0 && (
        <Alert variant="default" className="shadow-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Jobs Match Filters</AlertTitle>
          <AlertDescription>
            No jobs match your current client-side filter criteria from the loaded set. Try adjusting your filters or applying new search criteria above.
          </AlertDescription>
        </Alert>
      )}
      
      {!isLoading && !error && displayedJobs.length === 0 && allJobs.length === 0 && filters.keyword && (
         <Alert variant="default" className="shadow-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Jobs Found by API</AlertTitle>
          <AlertDescription>
            The job search API returned no results for your criteria. Try different keywords or broader location settings.
          </AlertDescription>
        </Alert>
      )}


      {!isLoading && !error && displayedJobs.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-6">Job Listings ({displayedJobs.length} of {allJobs.length} fetched)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isSaved={savedJobIds.includes(job.id)}
                onSaveToggle={handleSaveToggle}
                isApplied={appliedJobIds.includes(job.id)}
                onToggleApplied={handleToggleAppliedStatus}
              />
            ))}
          </div>
        </div>
      )}

      <SavedJobsSection 
        savedJobs={savedJobs} // Pass only the saved subset of allJobs
        onSaveToggle={handleSaveToggle} 
        appliedJobIds={appliedJobIds} 
        onToggleApplied={handleToggleAppliedStatus} 
      />
    </div>
  );
}

    