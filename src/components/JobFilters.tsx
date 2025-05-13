'use client';

import type { FilterCriteria, JobType } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, ListFilter, XCircle } from 'lucide-react';
import { jobTypes as allJobTypes, locations as allLocations } from '@/data/mockJobs';


interface JobFiltersProps {
  filters: FilterCriteria;
  onFilterChange: (filters: FilterCriteria) => void;
  onClearFilters: () => void;
}

export function JobFilters({ filters, onFilterChange, onClearFilters }: JobFiltersProps) {
  const handleKeywordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, keyword: event.target.value });
  };

  const handleLocationChange = (value: string) => {
    onFilterChange({ ...filters, location: value === 'All Locations' ? '' : value });
  };

  const handleJobTypeChange = (jobType: JobType) => {
    const newJobTypes = filters.jobTypes.includes(jobType)
      ? filters.jobTypes.filter((jt) => jt !== jobType)
      : [...filters.jobTypes, jobType];
    onFilterChange({ ...filters, jobTypes: newJobTypes });
  };

  return (
    <Card className="mb-8 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ListFilter className="h-5 w-5 text-primary" />
          Filter Jobs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <div className="space-y-2">
            <Label htmlFor="keyword">Keyword</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="keyword"
                type="text"
                placeholder="Job title, company, skills..."
                value={filters.keyword}
                onChange={handleKeywordChange}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Select value={filters.location || 'All Locations'} onValueChange={handleLocationChange}>
              <SelectTrigger id="location" className="w-full">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {allLocations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2 lg:col-span-1">
            <Label>Job Type</Label>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-x-4 gap-y-2 pt-2">
              {allJobTypes.map((jobType) => (
                <div key={jobType} className="flex items-center space-x-2">
                  <Checkbox
                    id={`jobType-${jobType}`}
                    checked={filters.jobTypes.includes(jobType)}
                    onCheckedChange={() => handleJobTypeChange(jobType)}
                  />
                  <Label htmlFor={`jobType-${jobType}`} className="font-normal whitespace-nowrap">
                    {jobType}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="md:col-span-2 lg:col-span-1 flex justify-end">
            <Button onClick={onClearFilters} variant="outline" className="w-full lg:w-auto">
              <XCircle className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
