import type { Job, JobType } from '@/types';

const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const fifteenDaysAgo = new Date();
fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

const twoDaysAgo = new Date();
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

export const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Frontend Engineer',
    company: 'Innovatech Solutions',
    description: 'Join our dynamic team to build next-generation web applications using React, Next.js, and TypeScript. Strong focus on UI/UX and performance.',
    location: 'New York, NY',
    type: 'Full-time',
    url: 'https://example.com/job/1',
    postedDate: twoDaysAgo.toISOString(),
    salary: '$120,000 - $150,000',
    equity: true,
  },
  {
    id: '2',
    title: 'Product Manager',
    company: 'FutureTech Corp',
    description: 'Lead the product vision, strategy, and execution for our AI-powered platform. Work closely with engineering, design, and marketing teams.',
    location: 'San Francisco, CA',
    type: 'Full-time',
    url: 'https://example.com/job/2',
    postedDate: sevenDaysAgo.toISOString(),
    salary: '$130,000 - $160,000',
  },
  {
    id: '3',
    title: 'UX/UI Designer',
    company: 'Creative Minds Inc.',
    description: 'Design intuitive and engaging user experiences for mobile and web applications. Proficiency in Figma, Sketch, and Adobe Creative Suite.',
    location: 'Remote',
    type: 'Contract',
    url: 'https://example.com/job/3',
    postedDate: fifteenDaysAgo.toISOString(),
  },
  {
    id: '4',
    title: 'Software Engineering Intern',
    company: 'Innovatech Solutions',
    description: 'Exciting internship opportunity for aspiring software engineers. Gain hands-on experience with modern web technologies.',
    location: 'New York, NY',
    type: 'Internship',
    url: 'https://example.com/job/4',
    postedDate: thirtyDaysAgo.toISOString(),
  },
  {
    id: '5',
    title: 'Backend Developer (Node.js)',
    company: 'ServerSystems Ltd.',
    description: 'Develop and maintain scalable backend services using Node.js, Express, and PostgreSQL. Experience with microservices and AWS is a plus.',
    location: 'London, UK',
    type: 'Full-time',
    url: 'https://example.com/job/5',
    postedDate: twoDaysAgo.toISOString(),
    equity: false,
  },
  {
    id: '6',
    title: 'Marketing Specialist',
    company: 'Growth Hackers Co.',
    description: 'Plan and execute digital marketing campaigns across various channels. SEO, SEM, and content marketing skills required.',
    location: 'Remote',
    type: 'Part-time',
    url: 'https://example.com/job/6',
    postedDate: sevenDaysAgo.toISOString(),
    salary: '$30 - $40 / hour',
  },
   {
    id: '7',
    title: 'Data Scientist',
    company: 'Alpha Analytics',
    description: 'Analyze large datasets to extract meaningful insights and build predictive models. Strong Python, R, and SQL skills needed.',
    location: 'San Francisco, CA',
    type: 'Full-time',
    url: 'https://example.com/job/7',
    postedDate: fifteenDaysAgo.toISOString(),
    salary: '$140,000 - $170,000',
    equity: true,
  },
  {
    id: '8',
    title: 'Customer Support Representative',
    company: 'HelpNow Services',
    description: 'Provide excellent customer support via email, chat, and phone. Patience and problem-solving skills are key.',
    location: 'Austin, TX',
    type: 'Full-time',
    url: 'https://example.com/job/8',
    postedDate: twoDaysAgo.toISOString(),
  },
];

export const jobTypes: JobType[] = ['Full-time', 'Part-time', 'Contract', 'Internship'];
// Ensure "All Locations" has a unique, non-empty value if it's to be used as a SelectItem value.
// For filtering logic, this special value ("__all_locations__") will be treated as "no location filter".
export const locations: string[] = ['All Locations', 'New York, NY', 'San Francisco, CA', 'London, UK', 'Austin, TX', 'Remote'];

