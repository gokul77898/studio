
'use client';

import type { Job } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, CalendarDays, ExternalLink, Bookmark, BookmarkCheck, DollarSign, BarChartBig, CheckCircle2, FilePenLine } from 'lucide-react'; // Added CheckCircle2, FilePenLine
import { format, parseISO, formatDistanceToNowStrict } from 'date-fns';

interface JobCardProps {
  job: Job;
  isSaved: boolean;
  onSaveToggle: (jobId: string) => void;
  isApplied: boolean;
  onToggleApplied: (jobId: string) => void;
}

export function JobCard({ job, isSaved, onSaveToggle, isApplied, onToggleApplied }: JobCardProps) {
  const postedDate = parseISO(job.postedDate);
  const timeAgo = formatDistanceToNowStrict(postedDate, { addSuffix: true });

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-semibold text-primary">{job.title}</CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => onSaveToggle(job.id)} aria-label={isSaved ? 'Unsave job' : 'Save job'}>
              {isSaved ? <BookmarkCheck className="h-5 w-5 text-accent" /> : <Bookmark className="h-5 w-5 text-muted-foreground hover:text-primary" />}
            </Button>
          </div>
        </div>
        <CardDescription className="text-sm">
          <div className="flex items-center gap-2 mt-1 text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>{job.company}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{job.location}</span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-foreground leading-relaxed line-clamp-3">{job.description}</p>
        <div className="mt-3 space-y-1">
          {job.salary && (
             <div className="flex items-center gap-2 text-sm text-muted-foreground">
               <DollarSign className="h-4 w-4 text-accent" /> 
               <span>{job.salary}</span>
            </div>
          )}
          {job.equity !== undefined && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChartBig className="h-4 w-4 text-accent" />
              <span>Equity: {job.equity ? 'Yes' : 'No'}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-4 border-t">
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            Posted: {timeAgo} ({format(postedDate, 'MMM d, yyyy')})
          </div>
          <Badge variant="secondary" className="mt-1 capitalize">{job.type}</Badge>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full sm:w-auto">
          <Button 
            variant={isApplied ? "secondary" : "outline"} 
            size="sm" 
            onClick={() => onToggleApplied(job.id)}
            className="w-full sm:w-auto"
            aria-label={isApplied ? "Mark as not applied" : "Mark as applied"}
          >
            {isApplied ? <CheckCircle2 className="text-green-500" /> : <FilePenLine />}
            {isApplied ? 'Applied' : 'Mark Applied'}
          </Button>
          <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
            <a href={job.url} target="_blank" rel="noopener noreferrer">
              Details
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
