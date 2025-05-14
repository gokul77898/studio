
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
import { isTechJob } from '@/lib/utils'; // Import the tech job filter

const initialFilters: FilterCriteria = {
  keyword: '',
  location: '',
  jobTypes: [],
  country: '',
  state: '',
  city: '',
  area: '',
};

const JOBS_PER_PAGE = 21; 

export default function HomePage() {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterCriteria>(initialFilters);
  const [savedJobIds, setSavedJobIds] = useLocalStorage<string[]>('savedJobIds', []);
  const [appliedJobIds, setAppliedJobIds] = useLocalStorage<string[]>('appliedJobIds', []);
  const { toast } = useToast();
  const [isInitialLoad, setIsInitialLoad] = useState(true);


  const loadJobs = useCallback(async (currentFilters: FilterCriteria, showLoadingIndicator: boolean = true) => {
    if (showLoadingIndicator) setIsLoading(true);
    setError(null);
    try {
      // Use a more generic keyword for initial load if user hasn't specified one
      const fetchKeyword = isInitialLoad && !currentFilters.keyword 
        ? 'latest tech jobs worldwide' 
        : currentFilters.keyword || 'latest tech jobs worldwide';
      
      const jobs = await fetchRealTimeJobs({...currentFilters, keyword: fetchKeyword }, JOBS_PER_PAGE * 2); // Fetch more to allow for client-side tech filtering
      setAllJobs(jobs);
      setIsInitialLoad(false); // Mark initial load as complete

      const techJobsFound = jobs.filter(isTechJob).length > 0;

      if (jobs.length === 0 && (currentFilters.keyword || currentFilters.location || currentFilters.country || currentFilters.city || currentFilters.state || currentFilters.area || currentFilters.jobTypes.length > 0)) {
        toast({
          title: "No Jobs Found by API",
          description: "The API did not return any jobs for your criteria. Try broadening your search or check API key.",
          variant: "default",
        });
      } else if (jobs.length > 0 && !techJobsFound) {
         toast({
          title: "No Tech Jobs Found",
          description: "The API returned jobs, but none matched our tech domain criteria. Try different keywords or broader filters.",
          variant: "default",
        });
      }
    } catch (e) {
      console.error("Failed to fetch jobs:", e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to load jobs.';
      setError(errorMessage + " Please ensure your JOB_SEARCH_API_KEY is correctly set in the .env file and the API service is reachable. Refer to `src/services/jobSearchService.ts` for setup instructions.");
      toast({
        title: "Error Loading Jobs",
        description: errorMessage.substring(0, 200),
        variant: "destructive",
      });
      setAllJobs([]); 
    } finally {
      if (showLoadingIndicator) setIsLoading(false);
    }
  }, [toast, isInitialLoad]);


  useEffect(() => {
    loadJobs({keyword: 'latest tech jobs worldwide', location: 'Worldwide', jobTypes: []});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (newFilters: FilterCriteria) => {
    setFilters(newFilters);
     setIsInitialLoad(false); // User interaction means it's no longer initial load
  };

  const handleApplyFilters = () => {
    setIsInitialLoad(false); // User interaction
    loadJobs(filters); 
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    setAllJobs([]); 
    setIsInitialLoad(true); // Reset to initial load state
    toast({
        title: "Filters Cleared",
        description: "Search filters have been reset. Click 'Apply Filters & Search' for new results or a default tech job search will run.",
    });
    loadJobs({keyword: 'latest tech jobs worldwide', location: 'Worldwide', jobTypes: []});
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
  
  const techFilteredJobs = useMemo(() => {
    return allJobs.filter(isTechJob);
  }, [allJobs]);

  // Client-side filtering for refinement on the currently loaded set.
  // Primary filtering is done by the API via `loadJobs`.
  const displayedJobs = useMemo(() => {
    return techFilteredJobs.filter(job => {
      const jobLocationLower = job.location?.toLowerCase() || '';
      const jobTitleLower = job.title?.toLowerCase() || '';
      const jobCompanyLower = job.company?.toLowerCase() || '';
      const jobDescLower = job.description?.toLowerCase() || '';
      
      const filterKeywordLower = filters.keyword?.toLowerCase();
      const keywordMatch = filterKeywordLower && filterKeywordLower !== 'latest tech jobs worldwide'
        ? jobTitleLower.includes(filterKeywordLower) ||
          jobCompanyLower.includes(filterKeywordLower) ||
          jobDescLower.includes(filterKeywordLower)
        : true;
      
      const generalLocationFilter = filters.location?.toLowerCase();
      let locationCombinedMatch = true;
      
      const detailedLocationProvided = !!(filters.country || filters.state || filters.city || filters.area);

      if (detailedLocationProvided) {
        const countryMatch = filters.country ? jobLocationLower.includes(filters.country.toLowerCase()) : true;
        const stateMatch = filters.state ? jobLocationLower.includes(filters.state.toLowerCase()) : true;
        const cityMatch = filters.city ? jobLocationLower.includes(filters.city.toLowerCase()) : true;
        const areaMatch = filters.area ? jobLocationLower.includes(filters.area.toLowerCase()) : true;
        locationCombinedMatch = countryMatch && stateMatch && cityMatch && areaMatch;
      } else if (generalLocationFilter && generalLocationFilter !== 'all locations' && generalLocationFilter !== 'worldwide' && generalLocationFilter !== '') {
        locationCombinedMatch = jobLocationLower.includes(generalLocationFilter) || 
                               (generalLocationFilter === 'remote' && jobLocationLower.includes('remote'));
      }

      const jobTypeMatch = filters.jobTypes.length > 0
        ? filters.jobTypes.includes(job.type)
        : true;
        
      return keywordMatch && locationCombinedMatch && jobTypeMatch;
    }).slice(0, JOBS_PER_PAGE);
  }, [techFilteredJobs, filters]);

  const savedJobs = useMemo(() => {
    // Filter all fetched jobs (before tech filter) for saved ones, then ensure they are tech jobs
    return allJobs.filter(job => savedJobIds.includes(job.id) && isTechJob(job));
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
          <p className="ml-4 text-lg text-muted-foreground">Loading real-time tech job listings...</p>
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

      {!isLoading && !error && displayedJobs.length === 0 && !isInitialLoad && (
        <Alert variant="default" className="shadow-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Tech Jobs Found</AlertTitle>
          <AlertDescription>
            No tech jobs match your current search/filter criteria from the API results. Try adjusting your filters or broadening your search.
          </AlertDescription>
        </Alert>
      )}
      
      {!isLoading && !error && displayedJobs.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-6">Tech Job Listings ({displayedJobs.length})</h2>
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
        savedJobs={savedJobs} 
        onSaveToggle={handleSaveToggle} 
        appliedJobIds={appliedJobIds} 
        onToggleApplied={handleToggleAppliedStatus} 
      />
    </div>
  );
}
