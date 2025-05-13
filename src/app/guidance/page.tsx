import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Lightbulb, FileText, Users, Briefcase, Search } from "lucide-react";

export default function GuidancePage() {
  const guidanceTopics = [
    {
      icon: FileText,
      title: "Crafting a Compelling Resume",
      content: [
        "Tailor your resume for each job application, highlighting relevant skills and experiences.",
        "Use action verbs to describe your accomplishments (e.g., 'Managed', 'Developed', 'Led').",
        "Quantify your achievements whenever possible (e.g., 'Increased sales by 15%').",
        "Keep it concise, ideally one page for less experienced candidates, two for more.",
        "Proofread meticulously for any typos or grammatical errors. Ask someone else to review it too."
      ]
    },
    {
      icon: Users,
      title: "Nailing the Interview",
      content: [
        "Research the company and the role thoroughly. Understand their mission, values, products, and recent news.",
        "Prepare for common interview questions (e.g., 'Tell me about yourself', 'Why are you interested in this role?', 'What are your strengths/weaknesses?').",
        "Practice the STAR method (Situation, Task, Action, Result) for behavioral questions.",
        "Prepare thoughtful questions to ask the interviewer. This shows your engagement and interest.",
        "Dress professionally, even for virtual interviews. Test your technology beforehand for online interviews."
      ]
    },
    {
      icon: Briefcase,
      title: "Effective Job Searching Strategies",
      content: [
        "Utilize multiple job boards and company career pages.",
        "Network actively. Attend industry events (online or in-person), connect on LinkedIn, and conduct informational interviews.",
        "Customize your cover letter for each application, explaining why you're a good fit for the specific role and company.",
        "Keep track of your applications, interviews, and follow-ups in an organized manner.",
        "Don't get discouraged by rejections. Use them as learning opportunities."
      ]
    },
    {
      icon: Search,
      title: "Understanding Job Descriptions",
      content: [
        "Carefully read the entire job description, paying close attention to required and preferred qualifications.",
        "Identify keywords related to skills, experience, and responsibilities. Incorporate these into your resume and cover letter.",
        "Understand the company culture if possible from the tone and language used.",
        "Note the 'day-to-day' responsibilities to see if they align with your interests and career goals.",
        "If some 'preferred' qualifications are missing, don't be deterred from applying if you meet most core requirements."
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <Lightbulb className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-bold tracking-tight">Application & Interview Guidance</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Tips and best practices to help you succeed in your job search.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4">
        {guidanceTopics.map((topic, index) => (
          <AccordionItem value={`item-${index}`} key={index} className="bg-card border border-border rounded-lg shadow-sm">
            <AccordionTrigger className="p-6 text-lg font-semibold hover:no-underline">
              <div className="flex items-center gap-3">
                <topic.icon className="h-6 w-6 text-primary" />
                {topic.title}
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-6 pt-0">
              <ul className="list-disc space-y-2 pl-5 text-foreground/90">
                {topic.content.map((point, pointIndex) => (
                  <li key={pointIndex}>{point}</li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Card className="mt-12 bg-primary/5 border-primary/20 shadow-sm">
        <CardHeader>
          <CardTitle className="text-primary">General Advice</CardTitle>
          <CardDescription>Stay positive, be persistent, and continuously learn and adapt throughout your job search journey. Good luck!</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Remember to always be professional in your communications, follow up appropriately after interviews, and continuously seek feedback to improve your approach. Your career journey is a marathon, not a sprint.</p>
        </CardContent>
      </Card>
    </div>
  );
}
