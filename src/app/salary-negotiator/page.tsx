
'use client';

import { useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as FormDescriptionComponent } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, Wand2, AlertTriangle, Sparkles, Briefcase, Building, MapPin, CalendarCheck, FileSignature, DollarSign, MessageSquare, ListChecks, Info, Globe } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { coachSalaryNegotiation, type SalaryNegotiationInput, type SalaryNegotiationOutput } from '@/ai/flows/salaryNegotiationCoachFlow';
import { SalaryNegotiationInputSchema } from '@/ai/schemas/salaryNegotiationCoachSchema';
import { Checkbox } from '@/components/ui/checkbox'; // Added Checkbox import
import { Label } from '@/components/ui/label'; // Added Label import

type SalaryNegotiationFormValues = SalaryNegotiationInput;

export default function SalaryNegotiatorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adviceResult, setAdviceResult] = useState<SalaryNegotiationOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<SalaryNegotiationFormValues>({
    resolver: zodResolver(SalaryNegotiationInputSchema),
    defaultValues: {
      jobTitle: '',
      companyName: '',
      locationCity: '',
      locationCountry: '',
      yearsOfExperience: 0,
      offeredSalaryAmount: undefined, 
      offeredSalaryCurrency: 'USD',
      otherOfferComponents: '',
      userMarketResearch: '',
      performSalaryWebSearch: false, // Default to false
    }
  });

  const handleSubmit: SubmitHandler<SalaryNegotiationFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    setAdviceResult(null);

    try {
      const result = await coachSalaryNegotiation(data);
      setAdviceResult(result);
      toast({
        title: "Negotiation Strategy Ready!",
        description: "The AI has generated advice for your salary negotiation.",
        icon: <Sparkles className="h-5 w-5 text-primary" />,
      });
    } catch (e) {
      console.error("Salary negotiation error:", e);
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
      setError(`An error occurred during strategy generation. ${errorMessage}`);
       toast({
        title: "Strategy Error",
        description: errorMessage.substring(0,200),
        variant: "destructive",
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
            <DollarSign className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl">AI Salary Negotiation Coach</CardTitle>
          </div>
          <CardDescription className="text-md">
            Enter your job offer details. The AI will provide an assessment, suggest counter-offer points, and help craft negotiation scripts. Optionally, allow AI to search the web for salary context.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg flex items-center gap-1"><Briefcase className="h-4 w-4"/> Job Title</FormLabel>
                      <FormControl><Input placeholder="e.g., Senior Software Engineer" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg flex items-center gap-1"><Building className="h-4 w-4"/> Company Name</FormLabel>
                      <FormControl><Input placeholder="e.g., Tech Solutions Inc." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="locationCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg flex items-center gap-1"><MapPin className="h-4 w-4"/> Location (City)</FormLabel>
                      <FormControl><Input placeholder="e.g., San Francisco" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="locationCountry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Location (Country)</FormLabel>
                      <FormControl><Input placeholder="e.g., USA" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <FormField
                  control={form.control}
                  name="yearsOfExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg flex items-center gap-1"><CalendarCheck className="h-4 w-4"/> Years of Relevant Experience</FormLabel>
                      <FormControl>
                        <Input 
                            type="number" 
                            placeholder="e.g., 5" 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value,10) || 0)}
                            value={field.value ?? ''}
                        />
                        </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="offeredSalaryAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg flex items-center gap-1"><DollarSign className="h-4 w-4"/> Offered Base Salary Amount</FormLabel>
                      <FormControl>
                        <Input 
                            type="number" 
                            placeholder="e.g., 100000" 
                            {...field} 
                            onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                            value={field.value ?? ''}
                        />
                        </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="offeredSalaryCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Currency</FormLabel>
                      <FormControl><Input placeholder="e.g., USD, EUR, CAD" {...field} maxLength={3} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                  control={form.control}
                  name="otherOfferComponents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg flex items-center gap-1"><FileSignature className="h-4 w-4"/> Other Offer Components (Bonus, Stock, Benefits)</FormLabel>
                      <FormControl>
                        <Textarea
                            placeholder="e.g., 15% annual bonus, $50k RSU vested over 4 years, comprehensive health insurance, 4 weeks PTO..."
                            className="min-h-[100px]"
                            {...field}
                        />
                        </FormControl>
                        <FormDescriptionComponent>Provide as much detail as possible.</FormDescriptionComponent>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="userMarketResearch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg flex items-center gap-1"><Info className="h-4 w-4"/> Your Market Research Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                            placeholder="e.g., Levels.fyi shows average for this role/level in this city is $X-$Y. Similar roles at competitor Z offer ABC..."
                            className="min-h-[80px]"
                            {...field}
                        />
                        </FormControl>
                        <FormDescriptionComponent>If you've done research, share it to help the AI give better context.</FormDescriptionComponent>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="performSalaryWebSearch"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-muted/30">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="performSalaryWebSearch" className="flex items-center gap-1 cursor-pointer">
                          <Globe className="h-4 w-4 text-primary"/>
                           Attempt Web Search for Salary Data (Experimental)
                        </Label>
                        <FormDescriptionComponent>
                          If checked, the AI will try to search online for publicly available salary data (e.g., from Levels.fyi, Glassdoor via a general search) to provide additional context. This uses a simulated search tool.
                        </FormDescriptionComponent>
                      </div>
                    </FormItem>
                  )}
                />
              <Button type="submit" disabled={isLoading} className="text-lg py-6 px-8">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Strategy...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" />
                    Get Negotiation Advice
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

      {isLoading && !adviceResult && (
         <div className="flex justify-center items-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="ml-3 text-md text-muted-foreground">AI is preparing your negotiation strategy...</p>
        </div>
      )}

      {adviceResult && !isLoading && (
        <Card className="shadow-xl mt-6">
          <CardHeader>
             <div className="flex items-center gap-3 mb-2">
                <Sparkles className="h-8 w-8 text-primary" />
                <CardTitle className="text-3xl">Your Negotiation Strategy</CardTitle>
              </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {adviceResult.webSearchSummary && (
                <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700">
                    <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <AlertTitle className="text-blue-700 dark:text-blue-300">Web Search Salary Context</AlertTitle>
                    <AlertDescription className="text-blue-700/90 dark:text-blue-300/90">
                        {adviceResult.webSearchSummary}
                    </AlertDescription>
                </Alert>
            )}
            <Accordion type="multiple" defaultValue={['item-0', 'item-1', 'item-2', 'item-3']} className="w-full">
              
              <AccordionItem value="item-0">
                <AccordionTrigger className="text-xl font-semibold"><Briefcase className="mr-2 h-5 w-5 text-accent" />Overall Assessment</AccordionTrigger>
                <AccordionContent className="pt-2">
                  <p className="text-foreground/90 whitespace-pre-wrap">{adviceResult.overallAssessment}</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-1">
                <AccordionTrigger className="text-xl font-semibold"><DollarSign className="mr-2 h-5 w-5 text-accent" />Suggested Counter-Offer</AccordionTrigger>
                <AccordionContent className="pt-2 space-y-2">
                  {adviceResult.suggestedCounterOffer.idealRange && (
                    <p><strong>Ideal Range:</strong> {adviceResult.suggestedCounterOffer.idealRange}</p>
                  )}
                  {adviceResult.suggestedCounterOffer.specificPoints && adviceResult.suggestedCounterOffer.specificPoints.length > 0 && (
                    <div>
                        <strong>Focus Points:</strong>
                        <ul className="list-disc pl-5">
                            {adviceResult.suggestedCounterOffer.specificPoints.map((point, idx) => <li key={`counterpoint-${idx}`}>{point}</li>)}
                        </ul>
                    </div>
                  )}
                  {adviceResult.suggestedCounterOffer.reasoning && (
                    <p className="text-sm text-muted-foreground mt-1"><em>Reasoning: {adviceResult.suggestedCounterOffer.reasoning}</em></p>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="text-xl font-semibold"><MessageSquare className="mr-2 h-5 w-5 text-accent" />Negotiation Script Points</AccordionTrigger>
                <AccordionContent className="pt-2 space-y-3">
                  {adviceResult.negotiationScriptPoints.map((scriptPoint, index) => (
                    <div key={`script-${index}`} className="p-3 border rounded-md bg-muted/30">
                      <p className="font-semibold text-sm">{scriptPoint.point}</p>
                      {scriptPoint.explanation && <p className="text-xs text-foreground/70 mt-1"><em>{scriptPoint.explanation}</em></p>}
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>

              {adviceResult.additionalConsiderations && adviceResult.additionalConsiderations.length > 0 && (
                <AccordionItem value="item-3">
                    <AccordionTrigger className="text-xl font-semibold"><ListChecks className="mr-2 h-5 w-5 text-accent" />Additional Considerations</AccordionTrigger>
                    <AccordionContent className="pt-2">
                    <ul className="list-disc space-y-1 pl-5 text-foreground/90">
                        {adviceResult.additionalConsiderations.map((item, idx) => <li key={`addcons-${idx}`}>{item}</li>)}
                    </ul>
                    </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </CardContent>
           <CardFooter>
            <p className="text-xs text-muted-foreground">This advice is AI-generated. Always use your best judgment and adapt it to your specific situation and comfort level. Negotiation is a personal process.</p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
