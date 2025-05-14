
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Job, FilterCriteria, ApplicationStatus, TrackedApplication } from '@/types';
import { fetchRealTimeJobs } from '@/services/jobSearchService';
import { JobCard } from '@/components/JobCard';
import { JobFilters } from '@/components/JobFilters';
import { SavedJobsSection as TrackedJobsSection } from '@/components/SavedJobsSection'; // Renamed for clarity
import useLocalStorage from '@/hooks/useLocalStorage';
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle2, Loader2, Search } from 'lucide-react'; // Added Search icon
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { isTechJob } from '@/lib/utils';

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
  const [trackedApplications, setTrackedApplications] = useLocalStorage<Record<string, TrackedApplication>>('trackedApplications', {});
  const { toast } = useToast();
  const [isInitialLoad, setIsInitialLoad] = useState(true);


  const loadJobs = useCallback(async (currentFilters: FilterCriteria, showLoadingIndicator: boolean = true) => {
    if (showLoadingIndicator) setIsLoading(true);
    setError(null);
    try {
      const fetchKeyword = isInitialLoad && !currentFilters.keyword 
        ? 'latest tech jobs worldwide' 
        : currentFilters.keyword || 'latest tech jobs worldwide'; // Ensure tech focus unless user specifies
      
      const jobsFromApi = await fetchRealTimeJobs({...currentFilters, keyword: fetchKeyword }, JOBS_PER_PAGE * 2); // Fetch more for filtering
      
      // Add status to jobs from API based on trackedApplications
      const jobsWithStatus = jobsFromApi.map(job => ({
        ...job,
        status: trackedApplications[job.id]?.status || 'None',
      }));
      setAllJobs(jobsWithStatus);

      setIsInitialLoad(false); 

      const techJobsFound = jobsWithStatus.filter(isTechJob).length > 0;

      if (jobsFromApi.length === 0 && (currentFilters.keyword || currentFilters.location || currentFilters.country || currentFilters.city || currentFilters.state || currentFilters.area || currentFilters.jobTypes.length > 0)) {
        toast({
          title: "No Jobs Found by API",
          description: "The API did not return any jobs for your criteria. Try broadening your search or check API key.",
          variant: "default",
        });
      } else if (jobsFromApi.length > 0 && !techJobsFound) {
         toast({
          title: "No Focused Tech Jobs Found",
          description: "The API returned jobs, but none matched focused tech criteria (Software/FS/AI/ML). Try different keywords or broader filters.",
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast, isInitialLoad, trackedApplications]); // Added trackedApplications dependency


  useEffect(() => {
    loadJobs({keyword: 'latest tech jobs worldwide', location: 'Worldwide', jobTypes: []});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initial load only

  const handleFilterChange = (newFilters: FilterCriteria) => {
    setFilters(newFilters);
    setIsInitialLoad(false); 
  };

  const handleApplyFilters = () => {
    setIsInitialLoad(false); 
    loadJobs(filters); 
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    setAllJobs([]); 
    setIsInitialLoad(true); 
    toast({
        title: "Filters Cleared",
        description: "Search filters have been reset. Click 'Apply Filters & Search' for new results or a default tech job search will run.",
    });
    loadJobs({keyword: 'latest tech jobs worldwide', location: 'Worldwide', jobTypes: []});
  };

 const handleStatusChange = (jobId: string, status: ApplicationStatus) => {
    setTrackedApplications(prev => {
      const newTracked = { ...prev };
      if (status === 'None') {
        delete newTracked[jobId];
        toast({ title: "Job Untracked", description: "This job is no longer tracked." });
      } else {
        newTracked[jobId] = { status, dateTracked: new Date().toISOString() };
        toast({
          title: `Job status updated to: ${status}`,
          variant: "default",
          icon: status === 'Applied' ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : undefined,
        });
      }
      return newTracked;
    });
     // Update the status on the job in the allJobs array immediately for UI responsiveness
    setAllJobs(prevJobs => prevJobs.map(j => j.id === jobId ? { ...j, status } : j));
  };
  
  const techFilteredJobs = useMemo(() => {
    return allJobs.filter(isTechJob);
  }, [allJobs]);

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

  const trackedJobsToDisplay = useMemo(() => {
    return Object.entries(trackedApplications)
      .map(([jobId, trackedApp]) => {
        const jobDetail = allJobs.find(j => j.id === jobId);
        return jobDetail ? { ...jobDetail, status: trackedApp.status, dateTracked: trackedApp.dateTracked } : null;
      })
      .filter((job): job is Job & { dateTracked: string } => job !== null && isTechJob(job))
      .sort((a, b) => new Date(b.dateTracked).getTime() - new Date(a.dateTracked).getTime());
  }, [allJobs, trackedApplications]);


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
          <AlertTitle>No Focused Tech Jobs Found</AlertTitle>
          <AlertDescription>
            No tech jobs (Software/FS/AI/ML) match your current search/filter criteria from the API results. Try adjusting your filters or broadening your search.
          </AlertDescription>
        </Alert>
      )}
      
      {!isLoading && !error && displayedJobs.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2"><Search className="h-6 w-6 text-primary" /> Tech Job Listings ({displayedJobs.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </div>
      )}

      <TrackedJobsSection 
        trackedJobs={trackedJobsToDisplay}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
