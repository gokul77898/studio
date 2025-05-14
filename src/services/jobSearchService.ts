
'use server';
import type { Job, FilterCriteria, JobType } from '@/types';

// --- IMPORTANT SETUP ---
// 1. CHOOSE A JOB AGGREGATOR API:
//    To get jobs from multiple platforms (Indeed, LinkedIn, etc.), use a job aggregator API.
//    JSearch API (available on RapidAPI: https://rapidapi.com/letscrape-6BYzPq3KBO2/api/jsearch) is a good option.
//    It aggregates listings from many sources. Sign up on RapidAPI, subscribe to JSearch (often has a free tier),
//    and get your API Key.
//
// 2. SET API KEY IN .env:
//    Create or open your .env file in the project root and add your API key:
//    JOB_SEARCH_API_KEY=your_actual_api_key_here
//
// 3. CONFIGURE API_BASE_URL AND HOST:
//    Update API_BASE_URL and API_HOST below with the correct values for JSearch or your chosen API.
//    For JSearch on RapidAPI, these are typically:
//    API_BASE_URL = 'https://jsearch.p.rapidapi.com';
//    API_HOST = 'jsearch.p.rapidapi.com';

const API_BASE_URL = process.env.JOB_API_BASE_URL || 'https://jsearch.p.rapidapi.com'; // Example for JSearch
const API_HOST = process.env.JOB_API_HOST || 'jsearch.p.rapidapi.com'; // Example for JSearch
const API_KEY = process.env.JOB_SEARCH_API_KEY;

// This is an EXAMPLE structure for JSearch API. Adjust to match your chosen API's response.
interface ApiJobResponseItem {
  job_id: string;
  job_title: string;
  employer_name?: string;
  employer_logo?: string;
  job_description: string;
  job_country?: string;
  job_city?: string;
  job_state?: string;
  job_employment_type?: string; // e.g., FULLTIME, CONTRACTOR, PARTTIME, INTERN
  job_apply_link?: string;
  job_posted_at_timestamp?: number;
  job_posted_at_datetime_utc?: string;
  job_min_salary?: number;
  job_max_salary?: number;
  job_salary_currency?: string;
  job_salary_period?: string; // e.g., HOURLY, MONTHLY, YEARLY
  job_highlights?: {
    Qualifications?: string[];
    Responsibilities?: string[];
    Benefits?: string[];
  };
  job_is_remote?: boolean;
  // Add other fields as provided by your API
}

function mapApiJobType(apiJobType?: string): Job['type'] {
  const type = apiJobType?.toUpperCase();
  if (type === 'FULLTIME') return 'Full-time';
  if (type === 'PARTTIME') return 'Part-time';
  if (type === 'CONTRACTOR' || type === 'CONTRACT') return 'Contract';
  if (type === 'INTERN' || type === 'INTERNSHIP') return 'Internship';
  return 'Full-time'; // Default
}

function formatSalary(apiJob: ApiJobResponseItem): string | undefined {
  if (!apiJob.job_min_salary && !apiJob.job_max_salary) return undefined;
  const currency = apiJob.job_salary_currency || '';
  const period = apiJob.job_salary_period ? `/${apiJob.job_salary_period.toLowerCase()}` : '';
  
  if (apiJob.job_min_salary && apiJob.job_max_salary) {
    return `${apiJob.job_min_salary.toLocaleString()} - ${apiJob.job_max_salary.toLocaleString()} ${currency}${period}`;
  }
  if (apiJob.job_min_salary) return `${apiJob.job_min_salary.toLocaleString()} ${currency}${period}`;
  if (apiJob.job_max_salary) return `${apiJob.job_max_salary.toLocaleString()} ${currency}${period}`;
  return undefined;
}

function getPostedDate(apiJob: ApiJobResponseItem): string {
  if (apiJob.job_posted_at_datetime_utc) {
    return new Date(apiJob.job_posted_at_datetime_utc).toISOString();
  }
  if (apiJob.job_posted_at_timestamp) {
    return new Date(apiJob.job_posted_at_timestamp * 1000).toISOString();
  }
  return new Date().toISOString(); // Fallback
}

export async function fetchRealTimeJobs(filters: FilterCriteria, limit: number = 20): Promise<Job[]> {
  if (!API_KEY) {
    console.error('JOB_SEARCH_API_KEY is not set in .env file.');
    // You might want to throw an error or return mock data for local development without an API key
    // throw new Error('API Key is missing. Please set JOB_SEARCH_API_KEY in your .env file.');
    console.warn("JOB_SEARCH_API_KEY missing. Returning empty job list.");
    return [];
  }
  if (API_BASE_URL === 'https://jsearch.p.rapidapi.com' && API_HOST === 'jsearch.p.rapidapi.com' && (API_KEY === 'your_actual_api_key_here' || !API_KEY)) {
     console.warn('Using placeholder API URL/Host or missing API Key for JSearch. Please configure `JOB_SEARCH_API_KEY`, `JOB_API_BASE_URL` (optional), and `JOB_API_HOST` (optional) in .env for real job data. Service will return empty array.');
     return [];
  }


  // Construct query for the API. This is an example for JSearch.
  // Refer to your chosen API's documentation for correct parameters.
  let queryParts = [];
  if (filters.keyword) queryParts.push(filters.keyword);
  
  let locationQuery = "";
  if(filters.area) locationQuery = filters.area;
  else if(filters.city) locationQuery = filters.city;
  else if(filters.state) locationQuery = filters.state;
  else if(filters.country) locationQuery = filters.country;
  else if(filters.location && filters.location !== 'All Locations') locationQuery = filters.location;
  else locationQuery = "Worldwide"; // Default if no specific location

  if(locationQuery) queryParts.push(`in ${locationQuery}`);
  
  const query = queryParts.join(' ') || 'Software Developer'; // Default query if empty


  const queryParams = new URLSearchParams({
    query: query,
    page: '1',
    num_pages: '1', // For JSearch, num_pages means "how many pages of results to fetch". Limit is often per page.
                     // JSearch's `limit` parameter seems to be deprecated or not standard.
                     // You might fetch 1 page and then take `limit` items from it.
                     // For more than ~20-40 results, you might need multiple page fetches if API has per-page limits.
    // JSearch specific examples - adapt or remove based on your API:
    // date_posted: 'all',
    // employment_types: filters.jobTypes?.map(jt => jt.toUpperCase().replace('-', '_')).join(','), // e.g. FULL_TIME,PART_TIME
    // job_requirements: 'no_experience_required,under_3_years_experience', // example
  });

  // If your API supports a direct limit parameter, use it:
  // queryParams.append('limit', limit.toString());
  // JSearch seems to return 40 results per page by default. So we'll fetch one page and slice.
  // For more results, pagination logic would be needed.

  const endpoint = `${API_BASE_URL}/search`;

  try {
    console.log(`Fetching jobs from: ${endpoint} with query: ${queryParams.toString()}`);
    const response = await fetch(`${endpoint}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': API_HOST, // e.g., 'jsearch.p.rapidapi.com'
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`API Error ${response.status}: ${response.statusText}`, errorBody);
      throw new Error(`Failed to fetch jobs (${response.status}): ${errorBody || response.statusText}`);
    }

    const result = await response.json();
    const apiJobs: ApiJobResponseItem[] = result.data || [];

    if (!apiJobs || apiJobs.length === 0) {
      console.log("No jobs found from API for the given query.");
      return [];
    }

    // Map the API response to your Job[] type
    return apiJobs.slice(0, limit).map((apiJob): Job => ({
      id: apiJob.job_id || crypto.randomUUID(),
      title: apiJob.job_title || 'N/A',
      company: apiJob.employer_name || 'N/A',
      description: apiJob.job_description || 'No description available.',
      location: `${apiJob.job_city ? apiJob.job_city + ', ' : ''}${apiJob.job_state ? apiJob.job_state + ', ' : ''}${apiJob.job_country || (apiJob.job_is_remote ? 'Remote' : 'Unknown Location')}`,
      type: mapApiJobType(apiJob.job_employment_type),
      url: apiJob.job_apply_link || '#',
      postedDate: getPostedDate(apiJob),
      salary: formatSalary(apiJob),
      equity: apiJob.job_highlights?.Benefits?.some(b => b.toLowerCase().includes('equity')), // Example, highly API dependent
    }));

  } catch (error) {
    console.error('Error in fetchRealTimeJobs:', error);
    if (error instanceof Error && error.message.includes('API Key is missing')) {
      // Already handled, or handle more gracefully
    } else {
      // Potentially re-throw or return empty to not break UI
      // For now, re-throwing to make it visible
       throw error;
    }
    return []; // Fallback to empty array on error
  }
}

    