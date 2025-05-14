
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Job, FilterCriteria } from '@/types';
// import { mockJobs } from '@/data/mockJobs'; // Replaced with real-time fetching
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

export default function HomePage() {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterCriteria>(initialFilters);
  const [savedJobIds, setSavedJobIds] = useLocalStorage<string[]>('savedJobIds', []);
  const [appliedJobIds, setAppliedJobIds] = useLocalStorage<string[]>('appliedJobIds', []);
  const { toast } = useToast();

  const loadJobs = useCallback(async (currentFilters: FilterCriteria) => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Pass currentFilters to fetchRealTimeJobs if your API supports server-side filtering
      // For now, fetching a general list and filtering client-side as an example.
      // const jobs = await fetchRealTimeJobs(currentFilters); 
      const jobs = await fetchRealTimeJobs(currentFilters, 50); // Fetch 50 jobs initially
      setAllJobs(jobs);
    } catch (e) {
      console.error("Failed to fetch jobs:", e);
      setError(e instanceof Error ? e.message : 'Failed to load jobs. Please try again.');
      toast({
        title: "Error Loading Jobs",
        description: e instanceof Error ? e.message : "Could not fetch job listings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);


  useEffect(() => {
    loadJobs(filters);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Load jobs on initial mount, using default filters

  const handleFilterChange = (newFilters: FilterCriteria) => {
    setFilters(newFilters);
    // Optionally, you could debounce this or add a "Search" button
    // to avoid too many API calls if API supports server-side filtering.
    // For client-side filtering (as primarily implemented now), this is fine.
    // If API is called on every filter change: loadJobs(newFilters);
  };

  const handleApplyFilters = () => {
    loadJobs(filters); // Re-fetch jobs with current filters
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    // loadJobs(initialFilters); // Optionally reload with default filters
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

  const filteredJobs = useMemo(() => {
    // Client-side filtering. If API supports server-side filtering,
    // this logic might be simpler or removed.
    return allJobs.filter(job => {
      const jobLocationLower = job.location?.toLowerCase() || '';

      const keywordMatch = filters.keyword.toLowerCase()
        ? (job.title?.toLowerCase() || '').includes(filters.keyword.toLowerCase()) ||
          (job.company?.toLowerCase() || '').includes(filters.keyword.toLowerCase()) ||
          (job.description?.toLowerCase() || '').includes(filters.keyword.toLowerCase())
        : true;
      
      const generalLocationMatch = filters.location && filters.location !== 'All Locations'
        ? jobLocationLower === filters.location.toLowerCase() || (filters.location.toLowerCase() === 'remote' && jobLocationLower.includes('remote'))
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
        // If detailed location is provided, it should match AND (general location is 'All' or general location also matches)
        locationCombinedMatch = countryMatch && stateMatch && cityMatch && areaMatch && (filters.location === 'All Locations' || filters.location === '' || generalLocationMatch);
      }


      const jobTypeMatch = filters.jobTypes.length > 0
        ? filters.jobTypes.includes(job.type)
        : true;
        
      return keywordMatch && locationCombinedMatch && jobTypeMatch;
    });
  }, [allJobs, filters]);

  const savedJobs = useMemo(() => {
    return allJobs.filter(job => savedJobIds.includes(job.id));
  }, [allJobs, savedJobIds]);

  return (
    <div className="space-y-8">
      <JobFilters 
        filters={filters} 
        onFilterChange={handleFilterChange} 
        onClearFilters={handleClearFilters}
        onApplyFilters={handleApplyFilters} // Pass the new handler
        isApplying={isLoading} // Pass loading state to disable button
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
             {error} Please check your connection or try again. You might also need to configure the job search API in `src/services/jobSearchService.ts` and set the API key in your `.env` file.
             <Button onClick={() => loadJobs(filters)} variant="link" className="p-0 h-auto mt-2 text-destructive-foreground">Try reloading</Button>
           </AlertDescription>
         </Alert>
      )}

      {!isLoading && !error && filteredJobs.length === 0 && (
        <Alert variant="default" className="shadow-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Jobs Found</AlertTitle>
          <AlertDescription>
            No jobs match your current filter criteria from the live feed. Try adjusting your filters or check back later for new listings.
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && filteredJobs.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-6">Job Listings ({filteredJobs.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
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
