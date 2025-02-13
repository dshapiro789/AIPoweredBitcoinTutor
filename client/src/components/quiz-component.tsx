import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Question, InsertUserQuizAttempt } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface QuizComponentProps {
  topicId: number;
  userId: number;
}

export default function QuizComponent({ topicId, userId }: QuizComponentProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const { toast } = useToast();

  const { data: questions, isLoading } = useQuery<Question[]>({
    queryKey: [`/api/quiz/${topicId}`],
  });

  const submitAttemptMutation = useMutation({
    mutationFn: async (attempt: InsertUserQuizAttempt) => {
      const response = await apiRequest("POST", "/api/quiz/attempt", attempt);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/quiz/history/${userId}/${topicId}`] });
      toast({
        title: "Quiz completed!",
        description: "Your answers have been submitted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit quiz",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading || !questions) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswer = (value: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: parseInt(value),
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate score
      const questionsAnswered = Object.entries(selectedAnswers).map(([questionId, answer]) => ({
        questionId: parseInt(questionId),
        answer,
      }));

      const score = questionsAnswered.reduce((total, { questionId, answer }) => {
        const question = questions.find(q => q.id === questionId);
        return total + (question?.correctAnswer === answer ? question?.points || 0 : 0);
      }, 0);

      // Submit quiz attempt
      submitAttemptMutation.mutate({
        userId,
        topicId,
        questionsAnswered,
        score,
        completedAt: new Date(),
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center mb-4">
          <CardTitle className="text-xl">Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
          <span className="text-sm text-muted-foreground">
            Score: {Object.keys(selectedAnswers).length} / {questions.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <CardDescription className="text-lg font-medium">
          {currentQuestion.questionText}
        </CardDescription>
        
        <RadioGroup
          value={selectedAnswers[currentQuestion.id]?.toString()}
          onValueChange={handleAnswer}
          className="space-y-4"
        >
          {currentQuestion.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem value={index.toString()} id={`option-${index}`} />
              <Label htmlFor={`option-${index}`} className="text-base">
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <div className="flex justify-end pt-4">
          <Button
            onClick={handleNext}
            disabled={!selectedAnswers[currentQuestion.id]}
          >
            {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Submit Quiz"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
