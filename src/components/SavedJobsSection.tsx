
'use client';

import type { Job, ApplicationStatus } from '@/types';
import { JobCard } from './JobCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookMarked, Info, Search } from 'lucide-react'; // Added Search icon

interface TrackedJobsSectionProps {
  trackedJobs: Job[]; // Jobs already include their status
  onStatusChange: (jobId: string, status: ApplicationStatus) => void;
}

export function SavedJobsSection({ trackedJobs, onStatusChange }: TrackedJobsSectionProps) {
  if (trackedJobs.length === 0) {
    return (
      <Card className="mt-10 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <BookMarked className="h-6 w-6 text-primary" />
            Tracked Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Info className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">No tracked applications yet.</p>
            <p className="text-sm">Use the options menu on a job listing to track its status.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <BookMarked className="h-7 w-7 text-primary" />
        Tracked Applications ({trackedJobs.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trackedJobs.map((job) => (
          <JobCard 
            key={job.id} 
            job={job} 
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </section>
  );
}
