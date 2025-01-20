"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { db } from "@/config/firebase";
import { CONSENT_TEXT } from "@/constants/consent";
import { zodResolver } from "@hookform/resolvers/zod";
import { doc, setDoc } from "firebase/firestore";
import { AlertCircle } from "lucide-react";
import { Fira_Code } from "next/font/google";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { UAParser } from "ua-parser-js";
import { z } from "zod";

/**
 * Consent and Demographics Form Component
 *
 * A form component that handles the consent and demographic information of participants.
 * Collects and validates:
 * - Participant consent to the study
 * - Basic demographic data including:
 *   - Pseudonym
 *   - Year of birth
 *   - Nationality
 *   - Gender
 *   - Input device preferences
 *   - Dominant hand
 */

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
});

const NATIONALITIES = [
  "Afghan",
  "Albanian",
  "Algerian",
  "American",
  "Andorran",
  "Angolan",
  "Antiguans",
  "Argentinean",
  "Armenian",
  "Australian",
  "Austrian",
  "Azerbaijani",
  "Bahamian",
  "Bahraini",
  "Bangladeshi",
  "Barbadian",
  "Barbudans",
  "Batswana",
  "Belarusian",
  "Belgian",
  "Belizean",
  "Beninese",
  "Bhutanese",
  "Bolivian",
  "Bosnian",
  "Brazilian",
  "British",
  "Bruneian",
  "Bulgarian",
  "Burkinabe",
  "Burmese",
  "Burundian",
  "Cambodian",
  "Cameroonian",
  "Canadian",
  "Cape Verdean",
  "Central African",
  "Chadian",
  "Chilean",
  "Chinese",
  "Colombian",
  "Comoran",
  "Congolese",
  "Costa Rican",
  "Croatian",
  "Cuban",
  "Cypriot",
  "Czech",
  "Danish",
  "Djibouti",
  "Dominican",
  "Dutch",
  "East Timorese",
  "Ecuadorean",
  "Egyptian",
  "Emirian",
  "Equatorial Guinean",
  "Eritrean",
  "Estonian",
  "Ethiopian",
  "Fijian",
  "Filipino",
  "Finnish",
  "French",
  "Gabonese",
  "Gambian",
  "Georgian",
  "German",
  "Ghanaian",
  "Greek",
  "Grenadian",
  "Guatemalan",
  "Guinea-Bissauan",
  "Guinean",
  "Guyanese",
  "Haitian",
  "Herzegovinian",
  "Honduran",
  "Hungarian",
  "I-Kiribati",
  "Icelander",
  "Indian",
  "Indonesian",
  "Iranian",
  "Iraqi",
  "Irish",
  "Israeli",
  "Italian",
  "Ivorian",
  "Jamaican",
  "Japanese",
  "Jordanian",
  "Kazakhstani",
  "Kenyan",
  "Kittian and Nevisian",
  "Kuwaiti",
  "Kyrgyz",
  "Laotian",
  "Latvian",
  "Lebanese",
  "Liberian",
  "Libyan",
  "Liechtensteiner",
  "Lithuanian",
  "Luxembourger",
  "Macedonian",
  "Malagasy",
  "Malawian",
  "Malaysian",
  "Maldivan",
  "Malian",
  "Maltese",
  "Marshallese",
  "Mauritanian",
  "Mauritian",
  "Mexican",
  "Micronesian",
  "Moldovan",
  "Monacan",
  "Mongolian",
  "Moroccan",
  "Mosotho",
  "Motswana",
  "Mozambican",
  "Namibian",
  "Nauruan",
  "Nepalese",
  "New Zealander",
  "Nicaraguan",
  "Nigerian",
  "Nigerien",
  "North Korean",
  "Northern Irish",
  "Norwegian",
  "Omani",
  "Pakistani",
  "Palauan",
  "Panamanian",
  "Papua New Guinean",
  "Paraguayan",
  "Peruvian",
  "Polish",
  "Portuguese",
  "Qatari",
  "Romanian",
  "Russian",
  "Rwandan",
  "Saint Lucian",
  "Salvadoran",
  "Samoan",
  "San Marinese",
  "Sao Tomean",
  "Saudi",
  "Scottish",
  "Senegalese",
  "Serbian",
  "Seychellois",
  "Sierra Leonean",
  "Singaporean",
  "Slovakian",
  "Slovenian",
  "Solomon Islander",
  "Somali",
  "South African",
  "South Korean",
  "Spanish",
  "Sri Lankan",
  "Sudanese",
  "Surinamer",
  "Swazi",
  "Swedish",
  "Swiss",
  "Syrian",
  "Taiwanese",
  "Tajik",
  "Tanzanian",
  "Thai",
  "Togolese",
  "Tongan",
  "Trinidadian or Tobagonian",
  "Tunisian",
  "Turkish",
  "Tuvaluan",
  "Ugandan",
  "Ukrainian",
  "Uruguayan",
  "Uzbekistani",
  "Venezuelan",
  "Vietnamese",
  "Welsh",
  "Yemenite",
  "Zambian",
  "Zimbabwean",
] as const;

const DEMO_STEPS = {
  consent: {
    title: "Consent",
    content: CONSENT_TEXT,
    buttonText: "Approve",
  },
  demographics: {
    title: "Demographic Information",
    inputFields: {
      prolific: {
        title: "Please enter your Prolific ID",
        inputType: "text",
        placeholder: "Enter your Prolific ID",
      },
      yob: {
        title: "What is your year of birth?",
        inputType: "number",
        placeholder: "Select year of birth",
      },
      nationality: {
        title: "What is your nationality?",
        inputType: "select",
        inputOptions: NATIONALITIES,
        placeholder: "Select nationality",
      },
      gender: {
        title: "What is your gender?",
        inputType: "select",
        inputOptions: ["Female", "Male", "Other", "Decline to State"] as const,
        placeholder: "Select gender",
      },
      usesMouse: {
        title: "Do you use a computer mouse or trackpad?",
        inputType: "select",
        inputOptions: ["Mouse", "Trackpad"] as const,
        placeholder: "Select input device",
      },
      mouseHand: {
        title: "Which hand do you use for the mouse/trackpad?",
        inputType: "select",
        inputOptions: ["Left", "Right"] as const,
        placeholder: "Select hand preference",
      },
    },
    buttonText: "Submit",
  },
} as const;

const DemoFormSchema = z.object({
  prolific: z.string().min(1, "Prolific ID is required"),
  yob: z.string().min(1, "Year of birth is required"),
  nationality: z.string().min(1, "Nationality is required"),
  gender: z.string().min(1, "Gender is required"),
  usesMouse: z.string().min(1, "Mouse usage information is required"),
  mouseHand: z.string().min(1, "Mouse hand information is required"),
});

type FormData = z.infer<typeof DemoFormSchema>;

const ChevronDownIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.5 4.5L6 8L9.5 4.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function ConsentAndDemographicsForm() {
  const [step, setStep] = useState<"consent" | "demographics">("consent");
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(DemoFormSchema),
    defaultValues: {
      prolific: "",
      yob: "1990",
      nationality: "",
      gender: "",
      usesMouse: "",
      mouseHand: "",
    },
  });

  const handleButtonClick = () => {
    if (step === "consent") {
      setStep("demographics");
    } else {
      form.handleSubmit(async (data) => {
        try {
          // Get browser and screen information
          const parser = new UAParser();
          const browserInfo = parser.getResult();

          // Create user data object
          const userData = {
            ...data,
            status: "started",
            timestamp: new Date().toISOString(),
            screenSize: {
              width: window.innerWidth,
              height: window.innerHeight,
            },
            browser: {
              name: browserInfo.browser.name,
              version: browserInfo.browser.version,
              os: browserInfo.os.name,
            },
          };

          // Save to Firestore
          const userDocRef = doc(db, "users", data.prolific);
          await setDoc(userDocRef, userData);

          // Save to Storage as JSON file
          // const storageRef = ref(storage, `forms/${data.prolific}.json`);
          // await uploadString(
          //   storageRef,
          //   JSON.stringify(userData, null, 2),
          //   "raw"
          // );

          setSuccess(true);
          router.push("/instructions");
          // handle save and error
        } catch (error) {
          console.error("Error saving data:", error);
          setError(true);
        }
      })();
    }
  };

  const renderDemographics = () => {
    const fields = DEMO_STEPS.demographics.inputFields;

    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => {
            console.log(data);
          })}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            {Object.entries(fields).map(([field, config]) => (
              <FormItem key={field}>
                <FormLabel htmlFor={field}>{config.title}</FormLabel>
                {config.inputType === "number" ? (
                  <FormField
                    control={form.control}
                    name={field as keyof FormData}
                    render={({ field: formField }) => (
                      <FormControl>
                        <Input
                          id={field}
                          type="number"
                          {...formField}
                          min={1950}
                          max={new Date().getFullYear()}
                        />
                      </FormControl>
                    )}
                  />
                ) : config.inputType === "text" ? (
                  <FormField
                    control={form.control}
                    name={field as keyof FormData}
                    render={({ field: formField }) => (
                      <FormControl>
                        <Input
                          id={field}
                          type="text"
                          placeholder={config.placeholder}
                          {...formField}
                        />
                      </FormControl>
                    )}
                  />
                ) : (
                  <Controller
                    name={field as keyof FormData}
                    control={form.control}
                    render={({ field: formField }) => (
                      <div className="relative">
                        <select
                          id={field}
                          {...formField}
                          className="appearance-none [-webkit-appearance:none] [-moz-appearance:none] flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pe-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="" disabled>
                            {config.placeholder}
                          </option>
                          {config.inputOptions?.map((opt) => (
                            <option key={opt} value={String(opt)}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                          <ChevronDownIcon />
                        </div>
                      </div>
                    )}
                  />
                )}
              </FormItem>
            ))}
          </div>
        </form>
      </Form>
    );
  };

  return (
    <div className="py-16 flex flex-col items-center justify-start gap-4 h-full w-full bg-[url('/images/background.svg')] bg-cover bg-center">
      <div className="flex flex-col w-full max-w-2xl h-full overflow-y-scroll gap-4 p-12 border-2 bg-white border-zinc-400 rounded-lg shadow-lg">
        <h1 className={`text-2xl font-bold text-center ${firaCode.className}`}>
          {DEMO_STEPS[step].title}
        </h1>
        <div>
          {step === "consent" ? (
            <div className="text-justify p-4">{CONSENT_TEXT}</div>
          ) : (
            <div className="w-full">{renderDemographics()}</div>
          )}
        </div>
      </div>
      <Button
        onClick={handleButtonClick}
        disabled={step === "demographics" && !form.formState.isValid}
        className={`w-full max-w-2xl  ${firaCode.className} text-lg`}
      >
        {step === "consent" ? "I approve" : "Submit"}
      </Button>
      {error && (
        <Alert
          variant="destructive"
          className="fixed bottom-10 right-10 w-fit bg-white shadow-lg"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Please try again or refresh the page. Unable to create user.
          </AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert
          variant="default"
          className="fixed bottom-10 right-10 w-fit bg-white shadow-lg"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>User created successfully.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
