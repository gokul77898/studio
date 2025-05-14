
'use client';

import type { Job, ApplicationStatus } from '@/types'; // Added ApplicationStatus
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Building2, MapPin, CalendarDays, ExternalLink, MoreVertical, XCircle } from 'lucide-react'; // Replaced Bookmark icons with MoreVertical
import { format, parseISO, formatDistanceToNowStrict } from 'date-fns';
import { cn } from '@/lib/utils'; // Added cn import

interface JobCardProps {
  job: Job;
  onStatusChange: (jobId: string, status: ApplicationStatus) => void;
}

export function JobCard({ job, onStatusChange }: JobCardProps) {
  const postedDate = parseISO(job.postedDate);
  const timeAgo = formatDistanceToNowStrict(postedDate, { addSuffix: true });

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-semibold text-primary">{job.title}</CardTitle>
          {/* Options dropdown is now in the footer */}
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
          {job.equity !== undefined && ( // Using BarChartBig as a placeholder for equity
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pie-chart h-4 w-4 text-accent"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
              <span>Equity: {job.equity ? 'Yes' : 'No'}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t">
        {/* Left Part: Date & Status/Type Badge */}
        <div className="flex flex-col items-start sm:flex-row sm:items-center gap-x-3 gap-y-1 text-xs text-muted-foreground w-full sm:w-auto">
          <div className="flex items-center gap-1 whitespace-nowrap">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Posted: {timeAgo} ({format(postedDate, 'MMM d, yyyy')})</span>
          </div>
          <Badge
            variant={
              job.status === 'Applied' ? 'default' :
              job.status === 'Rejected' ? 'destructive' :
              'secondary' // Base for Saved, None (job.type), Offer, Interviewing
            }
            className={cn("capitalize text-xs px-1.5 py-0.5 h-auto", {
              'bg-green-500 border-green-500 text-white hover:bg-green-600': job.status === 'Offer',
              'bg-yellow-500 border-yellow-500 text-black hover:bg-yellow-600': job.status === 'Interviewing', // yellow often needs black text
            })}
          >
            {job.status !== 'None' ? job.status : job.type}
          </Badge>
        </div>

        {/* Right Part: Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start mt-2 sm:mt-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Job Options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(['Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected'] as ApplicationStatus[]).map((statusOption) => (
                <DropdownMenuItem key={statusOption} onClick={() => onStatusChange(job.id, statusOption)}>
                   <span className={cn("mr-2 h-2 w-2 rounded-full", {
                    'bg-primary': statusOption === 'Applied',
                    'bg-yellow-500': statusOption === 'Interviewing',
                    'bg-green-500': statusOption === 'Offer',
                    'bg-destructive': statusOption === 'Rejected',
                    'bg-muted-foreground': statusOption === 'Saved',
                  })} />
                  {statusOption}
                </DropdownMenuItem>
              ))}
              {job.status !== 'None' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onStatusChange(job.id, 'None')} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                    <XCircle className="mr-2 h-4 w-4" /> Stop Tracking
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 px-3">
            <a href={job.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
              Details <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
// Added DollarSign and PieChart icons
const DollarSign = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
);
