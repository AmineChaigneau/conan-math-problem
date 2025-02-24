"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Fira_Code } from "next/font/google";
import { useForm } from "react-hook-form";

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
});

const gritQuestions = [
  "I have overcome setbacks to conquer an important challenge.",
  "New ideas and projects sometimes distract me from previous ones.",
  "My interests change from year to year.",
  "Setbacks don't discourage me.",
  "I have been obsessed with a certain idea or project for a short time but later lost interest.",
  "I am a hard worker.",
  "I often set a goal but later choose to pursue a different one.",
  "I have difficulty maintaining my focus on projects that take more than a few months to complete.",
  "I finish whatever I begin.",
  "I have achieved a goal that took years of work.",
  "I become interested in new pursuits every few months.",
  "I am diligent.",
];

const scaleOptions = [
  { value: "5", label: "Very much like me" },
  { value: "4", label: "Mostly like me" },
  { value: "3", label: "Somewhat like me" },
  { value: "2", label: "Not much like me" },
  { value: "1", label: "Not like me at all" },
];

interface GritScaleProps {
  onComplete: (score: number, responses: string[]) => void;
}

export const GritScale = ({ onComplete }: GritScaleProps) => {
  const form = useForm({
    defaultValues: {
      responses: new Array(12).fill(""),
    },
  });

  // Check if all responses are filled
  const isFormComplete = form
    .watch("responses")
    .every((response) => response !== "");

  const calculateGritScore = (responses: string[]) => {
    if (!responses.every((response) => response !== "")) {
      return 0;
    }

    const reversedQuestions = [1, 2, 4, 6, 7, 10];
    const score =
      responses.reduce((sum, value, index) => {
        const scoreValue = reversedQuestions.includes(index)
          ? 6 - Number(value)
          : Number(value);
        return sum + scoreValue;
      }, 0) / 12;

    return score;
  };

  const handleSubmit = (data: { responses: string[] }) => {
    const score = calculateGritScore(data.responses);
    onComplete(score, data.responses);
  };

  return (
    <div className="p-6">
      <h2
        className={`${firaCode.className} text-xl font-bold text-center mb-6`}
      >
        Please respond to the following 12 items. Be honest – there are no right
        or wrong answers!
      </h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {gritQuestions.map((question, index) => (
            <FormField
              key={index}
              control={form.control}
              name={`responses.${index}`}
              render={({ field }) => (
                <FormItem className="p-4 border rounded-lg">
                  <FormLabel className="text-lg flex items-center gap-2 mb-4">
                    <span className="text-sm bg-orange-500 text-white px-3 py-1 rounded">
                      {index + 1}
                    </span>
                    {question}
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-1 gap-2 md:grid-cols-5"
                    >
                      {scaleOptions.map((option) => (
                        <div key={option.value} className="flex items-center">
                          <RadioGroupItem
                            value={option.value}
                            id={`q${index}-${option.value}`}
                          />
                          <label
                            htmlFor={`q${index}-${option.value}`}
                            className="ml-2 text-sm"
                          >
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
          ))}

          <Button
            type="submit"
            className={`${firaCode.className} w-full mt-6`}
            disabled={!isFormComplete}
          >
            Submit
          </Button>
        </form>
      </Form>
    </div>
  );
};
