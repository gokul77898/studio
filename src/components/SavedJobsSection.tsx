
'use client';

import type { Job } from '@/types';
import { JobCard } from './JobCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookMarked, Info } from 'lucide-react';

interface SavedJobsSectionProps {
  savedJobs: Job[];
  onSaveToggle: (jobId: string) => void;
  appliedJobIds: string[]; // Added appliedJobIds
  onToggleApplied: (jobId: string) => void; // Added onToggleApplied
}

export function SavedJobsSection({ savedJobs, onSaveToggle, appliedJobIds, onToggleApplied }: SavedJobsSectionProps) {
  if (savedJobs.length === 0) {
    return (
      <Card className="mt-10 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <BookMarked className="h-6 w-6 text-primary" />
            Saved Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Info className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">No saved jobs yet.</p>
            <p className="text-sm">Use the bookmark icon on a job listing to save it for later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <BookMarked className="h-7 w-7 text-primary" />
        Saved Jobs
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedJobs.map((job) => (
          <JobCard 
            key={job.id} 
            job={job} 
            isSaved={true} 
            onSaveToggle={onSaveToggle}
            isApplied={appliedJobIds.includes(job.id)} // Pass isApplied
            onToggleApplied={onToggleApplied} // Pass onToggleApplied
          />
        ))}
      </div>
    </section>
  );
}
