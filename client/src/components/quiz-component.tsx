import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Question, InsertUserQuizAttempt, Achievement, UserAchievement } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { AchievementBadge } from "./achievements/achievement-badge";
import { Loader2, Trophy, ArrowRight, HelpCircle, Timer, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {Alert, AlertDescription} from "@/components/ui/alert"

interface QuizComponentProps {
  topicId: number;
  userId: number;
}

function TrueFalseQuestion({
  question,
  selectedAnswer,
  onAnswer
}: {
  question: Question;
  selectedAnswer: any;
  onAnswer: (value: any) => void;
}) {
  return (
    <RadioGroup
      value={selectedAnswer?.toString() || ''}
      onValueChange={(value) => onAnswer(value === 'true')}
      className="space-y-4"
    >
      {['True', 'False'].map((option, index) => (
        <div
          key={index}
          className={cn(
            "flex items-center space-x-2 p-4 rounded-lg transition-colors",
            "cursor-pointer touch-manipulation min-h-[56px]",
            selectedAnswer === (index === 0) ? "bg-primary/10" : "hover:bg-muted"
          )}
        >
          <RadioGroupItem
            value={String(index === 0)}
            id={`option-${index}`}
            className="w-5 h-5"
          />
          <Label
            htmlFor={`option-${index}`}
            className="text-base flex-grow cursor-pointer py-1"
          >
            {option}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}

function FillBlankQuestion({
  question,
  selectedAnswer,
  onAnswer
}: {
  question: Question;
  selectedAnswer: any;
  onAnswer: (value: any) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Input
          type="text"
          value={selectedAnswer || ''}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder={t('quiz.enterAnswer', 'Enter your answer')}
          className="w-full sm:max-w-[300px] min-h-[44px]"
        />
      </div>
      <div className="text-sm text-muted-foreground mt-4">
        <p>{question.context}</p>
      </div>
    </div>
  );
}

function MultipleChoiceQuestion({
  question,
  selectedAnswer,
  onAnswer
}: {
  question: Question;
  selectedAnswer: any;
  onAnswer: (value: any) => void;
}) {
  return (
    <RadioGroup
      value={selectedAnswer?.toString() || ''}
      onValueChange={(value) => onAnswer(parseInt(value))}
      className="space-y-4"
    >
      {question.options.map((option, index) => (
        <div
          key={index}
          className={cn(
            "flex items-center space-x-2 p-4 rounded-lg transition-colors",
            "cursor-pointer touch-manipulation min-h-[56px]",
            selectedAnswer === index ? "bg-primary/10" : "hover:bg-muted"
          )}
        >
          <RadioGroupItem
            value={index.toString()}
            id={`option-${index}`}
            className="w-5 h-5"
          />
          <Label
            htmlFor={`option-${index}`}
            className="text-base flex-grow cursor-pointer py-1"
          >
            {option}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}

export default function QuizComponent({ topicId, userId }: QuizComponentProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, any>>({});
  const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date());
  const [showHint, setShowHint] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [questionResults, setQuestionResults] = useState<Array<{
    question: Question;
    selectedAnswer: any;
    isCorrect: boolean;
  }>>([]);
  const { toast } = useToast();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const { 
    data: questions, 
    isLoading,
    error: questionsError
  } = useQuery<Question[]>({
    queryKey: [`/api/quiz/${topicId}`],
    retry: 2,
    onError: (error) => {
      toast({
        variant: "destructive",
        title: t('quiz.loadError'),
        description: error instanceof Error ? error.message : t('error.unknown'),
      });
    }
  });

  useEffect(() => {
    setQuestionStartTime(new Date());
  }, [currentQuestionIndex]);

  const submitAttemptMutation = useMutation({
    mutationFn: async (attempt: InsertUserQuizAttempt) => {
      const response = await apiRequest("POST", "/api/quiz/attempt", attempt);
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || t('quiz.submitError'));
      }
      return response.json();
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/quiz/history/${userId}/${topicId}`] });

      setIsCompleted(true);
      setFinalScore(data.attempt.score);

      if (data.attempt.score >= 70) {
        try {
          const progressResponse = await apiRequest("POST", `/api/progress/update`, {
            userId,
            topicId,
            completedExercises: 1,
            quizzesPassed: 1,
            confidenceLevel: Math.round(data.attempt.score / 20),
            totalPoints: data.attempt.score
          });

          if (progressResponse.ok) {
            queryClient.invalidateQueries({ queryKey: [`/api/progress/${userId}`] });
            queryClient.invalidateQueries({ queryKey: [`/api/learning-path/${userId}`] });
          } else {
            throw new Error(t('quiz.progressUpdateError'));
          }
        } catch (error) {
          toast({
            variant: "destructive",
            title: t('error.title'),
            description: error instanceof Error ? error.message : t('error.unknown'),
          });
        }
      }

      // Handle achievements
      if (data.newAchievements?.length > 0) {
        data.newAchievements.forEach((achievement: UserAchievement & { achievement: Achievement }) => {
          if (achievement?.achievement) {
            toast({
              title: t('achievements.new'),
              description: (
                <div className="flex items-center gap-3">
                  <AchievementBadge achievement={achievement.achievement} unlocked showAnimation />
                  <div>
                    <p className="font-semibold">{achievement.achievement.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {achievement.achievement.description}
                    </p>
                  </div>
                </div>
              ),
              duration: 5000,
            });
          }
        });
      }

      toast({
        title: t('quiz.completed'),
        description: t('quiz.finalScore', { score: data.attempt.score }),
        duration: 5000,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t('quiz.submitFailed'),
        description: error.message,
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center h-48 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm text-muted-foreground">{t('quiz.loading')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (questionsError || !questions) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('quiz.loadError')}
            </AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Button variant="outline" onClick={() => window.location.reload()}>
              {t('error.tryAgain')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const timeSpent = Math.round((new Date().getTime() - questionStartTime.getTime()) / 1000);

  const handleAnswer = (value: any) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: value,
    });
  };

  const handleSubmit = () => {
    const results = questions.map(question => ({
      question,
      selectedAnswer: selectedAnswers[question.id],
      isCorrect: question.type === 'true_false' || question.type === 'fill_blank'
        ? selectedAnswers[question.id]?.toString().toLowerCase() === question.correctAnswerValue?.toString().toLowerCase()
        : selectedAnswers[question.id] === question.correctAnswer
    }));

    const questionsAnswered = Object.entries(selectedAnswers).map(([questionId, answer]) => ({
      questionId: parseInt(questionId),
      answer,
      timeSpent
    }));

    const totalPoints = results.reduce((total, { isCorrect, question }) =>
      total + (isCorrect ? question.points : 0), 0);
    const maxPoints = questions.reduce((total, question) => total + question.points, 0);
    const score = Math.round((totalPoints / maxPoints) * 100);

    setQuestionResults(results);

    submitAttemptMutation.mutate({
      userId,
      topicId,
      questionsAnswered,
      score,
      completedAt: new Date(),
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowHint(false);
    }
  };

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case 'true_false':
        return (
          <TrueFalseQuestion
            question={currentQuestion}
            selectedAnswer={selectedAnswers[currentQuestion.id]}
            onAnswer={handleAnswer}
          />
        );
      case 'fill_blank':
        return (
          <FillBlankQuestion
            question={currentQuestion}
            selectedAnswer={selectedAnswers[currentQuestion.id]}
            onAnswer={handleAnswer}
          />
        );
      default:
        return (
          <MultipleChoiceQuestion
            question={currentQuestion}
            selectedAnswer={selectedAnswers[currentQuestion.id]}
            onAnswer={handleAnswer}
          />
        );
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <CardTitle className="text-xl">
            {t('quiz.question')} {currentQuestionIndex + 1} {t('quiz.of')} {questions.length}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Timer className="w-4 h-4" /> {timeSpent}s
            </span>
            <span className="text-sm text-muted-foreground">
              {t('quiz.answered')}: {Object.keys(selectedAnswers).length} {t('quiz.of')} {questions.length}
            </span>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <CardDescription className="text-lg font-medium flex-grow">
              {currentQuestion.questionText}
            </CardDescription>
            {currentQuestion.hints && currentQuestion.hints.length > 0 && (
              <div className="shrink-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowHint(!showHint)}
                        className="touch-manipulation"
                      >
                        <HelpCircle className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('quiz.showHint')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>

          {showHint && currentQuestion.hints && currentQuestion.hints.length > 0 && (
            <div className="bg-muted p-4 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-1 shrink-0" />
              <p className="text-sm">{currentQuestion.hints[0]}</p>
            </div>
          )}

          {currentQuestion.context && (
            <div className="bg-muted/50 p-4 rounded-lg text-sm">
              {currentQuestion.context}
            </div>
          )}

          {currentQuestion.imageUrl && (
            <div className="my-4">
              <img
                src={currentQuestion.imageUrl}
                alt="Question illustration"
                className="rounded-lg max-w-full h-auto"
                loading="lazy"
              />
            </div>
          )}

          <div className="mt-6">
            {renderQuestion()}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
          <Button
            variant="outline"
            onClick={() => {
              setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
              setShowHint(false);
            }}
            disabled={currentQuestionIndex === 0}
            className="w-full sm:w-auto min-h-[44px]"
          >
            {t('quiz.previousQuestion')}
          </Button>

          {questions.length === 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={selectedAnswers[currentQuestion.id] === undefined}
              className="w-full sm:w-auto min-h-[44px]"
            >
              {t('quiz.submitQuiz')}
            </Button>
          ) : (
            <Button
              onClick={currentQuestionIndex === questions.length - 1 ? handleSubmit : handleNext}
              disabled={selectedAnswers[currentQuestion.id] === undefined}
              className="w-full sm:w-auto min-h-[44px]"
            >
              {currentQuestionIndex < questions.length - 1 ? t('quiz.nextQuestion') : t('quiz.submitQuiz')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}