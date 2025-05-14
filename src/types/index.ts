
export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  type: JobType;
  url: string;
  postedDate: string; // ISO string date
  salary?: string; // Optional
  equity?: boolean; // Optional
  // isApplied?: boolean; // Optional, managed via appliedJobIds in localStorage
}

export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship';

export interface FilterCriteria {
  keyword: string;
  location: string; // General location from dropdown
  jobTypes: JobType[];
  country?: string;
  state?: string;
  city?: string;
  area?: string;
}

// Consider adding ApplicationStatus for more detailed tracking later
// export type ApplicationStatus = 
//   | 'Not Applied' 
//   | 'Saved' 
//   | 'Applied' 
//   | 'Interviewing' 
//   | 'Offer Received' 
//   | 'Offer Accepted' 
//   | 'Offer Declined' 
//   | 'Rejected';
