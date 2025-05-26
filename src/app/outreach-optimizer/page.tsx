
'use client';

import { useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription as FormDescriptionComponent,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  Wand2,
  AlertTriangle,
  Send,
  Sparkles,
  MessageCircle,
  CheckCircle,
  Lightbulb,
  Info,
  FileText,
  Briefcase,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

import {
  optimizeOutreachMessage,
  type OutreachOptimizerInput,
  type OutreachOptimizerOutput,
} from '@/ai/flows/outreachOptimizerFlow';
import { MessageTypeSchema, type MessageType } from '@/ai/schemas/outreachOptimizerSchema';

const outreachOptimizerFormSchema = z.object({
  messageText: z
    .string()
    .min(50, { message: 'Message text must be at least 50 characters.' })
    .max(5000, { message: 'Message text must be no more than 5000 characters.' }),
  subjectLine: z.string().max(200, { message: 'Subject line must be no more than 200 characters.' }).optional(),
  jobDescriptionText: z.string().max(5000, { message: 'Job description must be no more than 5000 characters.' }).optional(),
  messageType: MessageTypeSchema,
  userResumeSummary: z.string().max(1000, { message: 'Resume summary must be no more than 1000 characters.' }).optional(),
});

type OutreachOptimizerFormValues = z.infer<typeof outreachOptimizerFormSchema>;

export default function OutreachOptimizerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] =
    useState<OutreachOptimizerOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<OutreachOptimizerFormValues>({
    resolver: zodResolver(outreachOptimizerFormSchema),
    defaultValues: {
      messageText: '',
      subjectLine: '',
      jobDescriptionText: '',
      messageType: 'Cold Email to Recruiter/Hiring Manager',
      userResumeSummary: '',
    },
  });

  const handleSubmit: SubmitHandler<OutreachOptimizerFormValues> = async (
    data
  ) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const input: OutreachOptimizerInput = {
        messageText: data.messageText,
        subjectLine: data.subjectLine || undefined,
        jobDescriptionText: data.jobDescriptionText || undefined,
        messageType: data.messageType,
        userResumeSummary: data.userResumeSummary || undefined,
      };
      const result = await optimizeOutreachMessage(input);
      setAnalysisResult(result);
      toast({
        title: 'Outreach Optimized!',
        description: "The AI's suggestions for your message are ready below.",
        icon: <Sparkles className="h-5 w-5 text-primary" />,
      });
    } catch (e) {
      console.error('Outreach optimization error:', e);
      const errorMessage =
        e instanceof Error ? e.message : 'An unexpected error occurred.';
      setError(
        `An error occurred during message optimization. ${errorMessage}`
      );
      toast({
        title: 'Optimization Error',
        description: errorMessage.substring(0, 200),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl">AI Outreach Optimizer</CardTitle>
          </div>
          <CardDescription className="text-md">
            Paste your outreach message (email, LinkedIn message, etc.), provide some context, and let the AI help you refine it for better impact and response rates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="messageType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Message Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select the type of message" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MessageTypeSchema.options.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescriptionComponent>
                      Helps the AI provide more relevant advice.
                    </FormDescriptionComponent>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subjectLine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">
                      Subject Line (if applicable, e.g., for email)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Application for Software Engineer Role - John Doe"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="messageText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Message Body</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste the full content of your email or message here..."
                        className="min-h-[200px] text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormDescriptionComponent>
                      The main text of your outreach.
                    </FormDescriptionComponent>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="userResumeSummary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg flex items-center gap-1"><Briefcase className="h-4 w-4" /> Your Brief Resume Summary (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Experienced Full Stack Developer with 5 years in React and Node.js, passionate about AI applications..."
                        className="min-h-[80px] text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormDescriptionComponent>
                      A short summary of your profile helps the AI ensure the message aligns with your background.
                    </FormDescriptionComponent>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobDescriptionText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg flex items-center gap-1"><FileText className="h-4 w-4" /> Target Job Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="If this message is about a specific job, paste the job description here..."
                        className="min-h-[150px] text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormDescriptionComponent>
                      Provides context if your message is for a job application.
                    </FormDescriptionComponent>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isLoading}
                className="text-lg py-6 px-8"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Optimizing Message...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" />
                    Optimize My Message
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="shadow-md mt-6">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && !analysisResult && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="ml-3 text-md text-muted-foreground">
            AI is crafting feedback for your message...
          </p>
        </div>
      )}

      {analysisResult && !isLoading && (
        <Card className="shadow-xl mt-6">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl">
                AI Optimization Results
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <Info className="h-5 w-5 text-accent" />
                Overall Assessment
              </h3>
              <p className="text-foreground/90">
                {analysisResult.overallAssessment}
              </p>
            </div>
            <Separator />

            {analysisResult.strengths &&
              analysisResult.strengths.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Strengths
                  </h3>
                  <ul className="list-disc space-y-2 pl-5 text-foreground/90">
                    {analysisResult.strengths.map((item, index) => (
                      <li key={`strength-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            
            {analysisResult.areasForImprovement &&
              analysisResult.areasForImprovement.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    Areas for Improvement
                  </h3>
                  <ul className="list-disc space-y-2 pl-5 text-foreground/90">
                    {analysisResult.areasForImprovement.map((item, index) => (
                      <li key={`improvement-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            <Separator />

            {analysisResult.suggestedSubjectLine && (
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Suggested Subject Line
                </h3>
                <Badge variant="outline" className="text-md p-2 bg-muted/50">
                  {analysisResult.suggestedSubjectLine}
                </Badge>
              </div>
            )}

            <div>
              <h3 className="text-xl font-semibold mb-2">
                Suggested Message Body
              </h3>
              <Textarea
                readOnly
                value={analysisResult.suggestedMessageBody}
                className="min-h-[250px] text-sm whitespace-pre-wrap bg-muted/30 border-dashed font-mono"
                aria-label="Suggested Message Body"
              />
            </div>
            <Separator />

            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Key Recommendations
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-foreground/90">
                {analysisResult.keyRecommendations.map((item, index) => (
                  <li key={`recommendation-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              These suggestions are AI-generated. Always review and personalize
              your messages before sending.
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
