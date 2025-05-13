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
}

export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship';

export interface FilterCriteria {
  keyword: string;
  location: string;
  jobTypes: JobType[];
}
