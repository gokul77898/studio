
'use client';

import type { FilterCriteria, JobType } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, ListFilter, XCircle, MapPin, Globe, Building, Map as MapIcon, Pin, Send } from 'lucide-react';
import { jobTypes as allJobTypes, locations as allLocations } from '@/data/mockJobs';


interface JobFiltersProps {
  filters: FilterCriteria;
  onFilterChange: (filters: FilterCriteria) => void;
  onClearFilters: () => void;
  onApplyFilters: () => void; // New prop for applying filters (triggering API call)
  isApplying?: boolean; // Optional prop to disable button while applying
}

export function JobFilters({ filters, onFilterChange, onClearFilters, onApplyFilters, isApplying }: JobFiltersProps) {
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    onFilterChange({ ...filters, [name]: value });
  };

  const handleLocationChange = (value: string) => {
    onFilterChange({ ...filters, location: value === '__all_locations__' ? '' : value });
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
         <CardDescription className="text-xs">
            Modify filters and click &quot;Apply Filters&quot; to search live job listings.
         </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <Label htmlFor="keyword">Keyword</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="keyword"
                name="keyword"
                type="text"
                placeholder="Job title, company, skills..."
                value={filters.keyword}
                onChange={handleInputChange}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-1"><MapPin className="h-4 w-4" />General Location</Label>
            <Select value={filters.location || '__all_locations__'} onValueChange={handleLocationChange}>
              <SelectTrigger id="location" className="w-full">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {allLocations.map((loc) => (
                  <SelectItem key={loc} value={loc === 'All Locations' ? '__all_locations__' : loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2 lg:col-span-1">
            <Label>Job Type</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 pt-2">
              {allJobTypes.map((jobType) => (
                <div key={jobType} className="flex items-center space-x-2">
                  <Checkbox
                    id={`jobFilterType-${jobType}`}
                    checked={filters.jobTypes.includes(jobType)}
                    onCheckedChange={() => handleJobTypeChange(jobType)}
                  />
                  <Label htmlFor={`jobFilterType-${jobType}`} className="font-normal whitespace-nowrap">
                    {jobType}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div>
          <p className="text-md font-medium mb-2">Detailed Location (Optional)</p>
           <CardDescription className="mb-4 text-xs">
             Specify country, state, city, or area to narrow down results. These fields will be combined with the general location filter.
           </CardDescription>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <Label htmlFor="country" className="flex items-center gap-1"><Globe className="h-4 w-4" />Country</Label>
              <Input
                id="country"
                name="country"
                type="text"
                placeholder="e.g., USA"
                value={filters.country || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state" className="flex items-center gap-1"><Building className="h-4 w-4" />State/Province</Label>
              <Input
                id="state"
                name="state"
                type="text"
                placeholder="e.g., California"
                value={filters.state || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city" className="flex items-center gap-1"><MapIcon className="h-4 w-4" />City/District</Label>
              <Input
                id="city"
                name="city"
                type="text"
                placeholder="e.g., San Francisco"
                value={filters.city || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area" className="flex items-center gap-1"><Pin className="h-4 w-4" />Area/Neighborhood</Label>
              <Input
                id="area"
                name="area"
                type="text"
                placeholder="e.g., SoMa"
                value={filters.area || ''}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <Button onClick={onClearFilters} variant="outline" className="w-full sm:w-auto" disabled={isApplying}>
            <XCircle className="mr-2 h-4 w-4" />
            Clear All Filters
          </Button>
          <Button onClick={onApplyFilters} className="w-full sm:w-auto" disabled={isApplying}>
            {isApplying ? <Search className="mr-2 h-4 w-4 animate-ping" /> : <Send className="mr-2 h-4 w-4" /> }
            {isApplying ? 'Searching...' : 'Apply Filters & Search'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
