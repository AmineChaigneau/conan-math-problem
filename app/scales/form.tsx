"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { Fira_Code } from "next/font/google";
import { useForm } from "react-hook-form";
import * as z from "zod";

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
});

const formSchema = z.object({
  hasWorkedBefore: z.string(),
  workDuration: z.string().optional(),
  sleepQuality: z.string(),
});

type FormData = z.infer<typeof formSchema>;

interface FormScaleProps {
  onComplete: (data: FormData) => void;
}

const sleepQualityOptions = [
  { value: "very_poor", label: "Very Poor" },
  { value: "poor", label: "Poor" },
  { value: "fair", label: "Fair" },
  { value: "good", label: "Good" },
  { value: "very_good", label: "Very Good" },
];

export const FormScale = ({ onComplete }: FormScaleProps) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hasWorkedBefore: "",
      workDuration: "",
      sleepQuality: "",
    },
  });

  const handleSubmit = (data: FormData) => {
    if (form.formState.isValid) {
      onComplete(data);
    }
  };

  return (
    <div className="p-6">
      <h2
        className={`${firaCode.className} text-xl font-bold text-center mb-6`}
      >
        Additional Information
      </h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="hasWorkedBefore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Have you worked before participating in this experiment today?
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.watch("hasWorkedBefore") === "yes" && (
            <FormField
              control={form.control}
              name="workDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>For how long did you work (in hours)?</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter number of hours"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="sleepQuality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  How would you rate your sleep quality last night?
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sleep quality" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sleepQualityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className={`${firaCode.className} w-full mt-6`}
            disabled={!form.formState.isValid}
          >
            Submit
          </Button>
        </form>
      </Form>
    </div>
  );
};
