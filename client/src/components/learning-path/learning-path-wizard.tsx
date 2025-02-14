import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type Question = {
  id: string;
  text: string;
  options: {
    value: string;
    label: string;
  }[];
};

const questions: Question[] = [
  {
    id: "experience",
    text: "What is your current level of Bitcoin knowledge?",
    options: [
      { value: "beginner", label: "Complete Beginner" },
      { value: "basic", label: "Basic Understanding" },
      { value: "intermediate", label: "Some Experience" },
      { value: "advanced", label: "Advanced User" }
    ]
  },
  {
    id: "goal",
    text: "What is your primary learning goal?",
    options: [
      { value: "understanding", label: "Understand Bitcoin Fundamentals" },
      { value: "investing", label: "Learn About Bitcoin Investment" },
      { value: "technical", label: "Master Technical Aspects" },
      { value: "development", label: "Learn Bitcoin Development" }
    ]
  },
  {
    id: "time",
    text: "How much time can you dedicate to learning per week?",
    options: [
      { value: "minimal", label: "1-2 hours" },
      { value: "moderate", label: "3-5 hours" },
      { value: "dedicated", label: "6-10 hours" },
      { value: "intensive", label: "10+ hours" }
    ]
  },
  {
    id: "style",
    text: "What's your preferred learning style?",
    options: [
      { value: "visual", label: "Visual Learning with Diagrams" },
      { value: "practical", label: "Hands-on Practice" },
      { value: "theoretical", label: "Theoretical Understanding" },
      { value: "interactive", label: "Interactive Discussions" }
    ]
  }
];

interface LearningPathWizardProps {
  userId: number;
  onComplete: () => void;
}

export function LearningPathWizard({ userId, onComplete }: LearningPathWizardProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestion].id]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const response = await apiRequest("POST", `/api/learning-path/personalize/${userId}`, answers);
      if (!response.ok) throw new Error("Failed to generate learning path");
      
      toast({
        title: t("learningPath.wizardComplete"),
        description: t("learningPath.pathGenerated"),
      });
      onComplete();
    } catch (error) {
      toast({
        title: t("error.title"),
        description: t("error.failedToGeneratePath"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentAnswer = answers[questions[currentQuestion].id];
  const isLastQuestion = currentQuestion === questions.length - 1;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t("learningPath.wizard.title")}</CardTitle>
        <CardDescription>
          {t("learningPath.wizard.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="text-lg font-medium">
            {questions[currentQuestion].text}
          </div>
          <RadioGroup
            value={currentAnswer}
            onValueChange={handleAnswer}
            className="space-y-4"
          >
            {questions[currentQuestion].options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentQuestion === 0}
        >
          {t("common.back")}
        </Button>
        {isLastQuestion ? (
          <Button
            onClick={handleSubmit}
            disabled={!currentAnswer || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("common.generating")}
              </>
            ) : (
              t("common.complete")
            )}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={!currentAnswer}
          >
            {t("common.next")}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
