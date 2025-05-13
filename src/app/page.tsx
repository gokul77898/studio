'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Job, FilterCriteria, JobType } from '@/types';
import { mockJobs } from '@/data/mockJobs';
import { JobCard } from '@/components/JobCard';
import { JobFilters } from '@/components/JobFilters';
import { SavedJobsSection } from '@/components/SavedJobsSection';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const [filters, setFilters] = useState<FilterCriteria>(initialFilters);
  const [savedJobIds, setSavedJobIds] = useLocalStorage<string[]>('savedJobIds', []);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate API call
    setAllJobs(mockJobs);
  }, []);

  const handleFilterChange = (newFilters: FilterCriteria) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
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

  const filteredJobs = useMemo(() => {
    return allJobs.filter(job => {
      const jobLocationLower = job.location.toLowerCase();

      const keywordMatch = filters.keyword.toLowerCase()
        ? job.title.toLowerCase().includes(filters.keyword.toLowerCase()) ||
          job.company.toLowerCase().includes(filters.keyword.toLowerCase()) ||
          job.description.toLowerCase().includes(filters.keyword.toLowerCase())
        : true;
      
      // General location dropdown filter
      const generalLocationMatch = filters.location && filters.location !== 'All Locations'
        ? jobLocationLower === filters.location.toLowerCase() || (filters.location.toLowerCase() === 'remote' && jobLocationLower === 'remote')
        : true;

      // Detailed location filters
      const countryMatch = filters.country
        ? jobLocationLower.includes(filters.country.toLowerCase())
        : true;
      const stateMatch = filters.state
        ? jobLocationLower.includes(filters.state.toLowerCase())
        : true;
      const cityMatch = filters.city
        ? jobLocationLower.includes(filters.city.toLowerCase())
        : true;
      // Area match might be too specific for job.location strings, but included for completeness
      const areaMatch = filters.area 
        ? jobLocationLower.includes(filters.area.toLowerCase())
        : true;
      
      const detailedLocationProvided = !!(filters.country || filters.state || filters.city || filters.area);
      
      let locationCombinedMatch = generalLocationMatch;
      if (detailedLocationProvided) {
        // If detailed fields are used, they must ALL match, AND general location (if not 'All Locations')
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
      />

      {filteredJobs.length > 0 ? (
        <div>
          <h2 className="text-2xl font-semibold mb-6">Job Listings ({filteredJobs.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isSaved={savedJobIds.includes(job.id)}
                onSaveToggle={handleSaveToggle}
              />
            ))}
          </div>
        </div>
      ) : (
        <Alert variant="default" className="shadow-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Jobs Found</AlertTitle>
          <AlertDescription>
            No jobs match your current filter criteria. Try adjusting your filters or check back later for new listings.
          </AlertDescription>
        </Alert>
      )}

      <SavedJobsSection savedJobs={savedJobs} onSaveToggle={handleSaveToggle} />
    </div>
  );
}
