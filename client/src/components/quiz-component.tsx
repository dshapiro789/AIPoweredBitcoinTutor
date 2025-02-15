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
            "flex items-center space-x-2 p-3 rounded-lg transition-colors",
            selectedAnswer === (index === 0) ? "bg-primary/10" : "hover:bg-muted"
          )}
        >
          <RadioGroupItem value={String(index === 0)} id={`option-${index}`} />
          <Label htmlFor={`option-${index}`} className="text-base flex-grow cursor-pointer">
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
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input
          type="text"
          value={selectedAnswer || ''}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder={question.options?.[0] || "Enter your answer"}
          className="max-w-[200px]"
        />
      </div>
      {question.options && (
        <div className="text-sm text-muted-foreground mt-2">
          Suggested answers: {question.options.join(', ')}
        </div>
      )}
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
            "flex items-center space-x-2 p-3 rounded-lg transition-colors",
            selectedAnswer === index ? "bg-primary/10" : "hover:bg-muted"
          )}
        >
          <RadioGroupItem value={index.toString()} id={`option-${index}`} />
          <Label
            htmlFor={`option-${index}`}
            className="text-base flex-grow cursor-pointer"
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

  const { data: questions, isLoading } = useQuery<Question[]>({
    queryKey: [`/api/quiz/${topicId}`],
  });

  useEffect(() => {
    setQuestionStartTime(new Date());
  }, [currentQuestionIndex]);

  const submitAttemptMutation = useMutation({
    mutationFn: async (attempt: InsertUserQuizAttempt) => {
      const response = await apiRequest("POST", "/api/quiz/attempt", attempt);
      if (!response.ok) {
        throw new Error("Failed to submit quiz attempt");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/quiz/history/${userId}/${topicId}`] });

      setIsCompleted(true);
      setFinalScore(data.attempt.score);

      // If score is 100%, update learning progress
      if (data.attempt.score === 100) {
        // Update learning progress
        apiRequest("POST", `/api/progress/update`, {
          userId,
          topicId,
          completedExercises: 1,
          quizzesPassed: 1
        });
      }

      if (data.newAchievements?.length > 0) {
        data.newAchievements.forEach((achievement: UserAchievement & { achievement: Achievement }) => {
          if (achievement?.achievement) {
            toast({
              title: t('achievements.new', 'New Achievement Unlocked!'),
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
        title: t('quiz.submitFailed'),
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
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isCompleted) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <Trophy className="w-16 h-16 mx-auto text-primary mb-4" />
          <CardTitle className="text-2xl mb-2">
            {t('quiz.congratulations')}
          </CardTitle>
          <CardDescription className="text-lg">
            {t('quiz.yourScore')}: {finalScore}%
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">{t('quiz.reviewAnswers')}</h3>
            {questionResults.map(({ question, selectedAnswer, isCorrect }, index) => (
              <div
                key={question.id}
                className={cn(
                  "p-4 rounded-lg",
                  isCorrect ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "rounded-full p-1.5",
                    isCorrect ? "bg-green-500/20 text-green-600" : "bg-red-500/20 text-red-600"
                  )}>
                    {isCorrect ? "✓" : "✗"}
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="font-medium">
                      {index + 1}. {question.questionText}
                    </p>
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">
                        Your answer: {
                          question.type === 'true_false'
                            ? String(selectedAnswer)
                            : question.type === 'multiple_choice'
                              ? question.options[selectedAnswer]
                              : selectedAnswer
                        }
                      </p>
                      {!isCorrect && (
                        <p className="text-muted-foreground">
                          Correct answer: {
                            question.type === 'true_false'
                              ? String(question.correctAnswerValue)
                              : question.type === 'multiple_choice'
                                ? question.options[question.correctAnswer]
                                : String(question.correctAnswerValue)
                          }
                        </p>
                      )}
                      {!isCorrect && (
                        <p className="text-sm mt-2">{question.explanation}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4 items-center pt-4">
            {finalScore === 100 && (
              <AlertDialog>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('quiz.lessonCompleted')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('quiz.moveToNextLesson')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setLocation('/dashboard')}>
                      {t('common.later')}
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                      // Navigate to the next topic
                      const nextTopicId = topicId + 1;
                      setLocation(`/chat/${nextTopicId}`);
                    }}>
                      {t('common.continue')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button
              onClick={() => setLocation('/dashboard')}
              className="w-full max-w-sm"
              variant="outline"
            >
              {t('quiz.returnToDashboard')}
            </Button>
            <Button
              onClick={() => setLocation('/')}
              className="w-full max-w-sm"
            >
              {t('quiz.continueLeaning')} <ArrowRight className="ml-2 h-4 w-4" />
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
      <CardHeader>
        <div className="flex justify-between items-center mb-4">
          <CardTitle className="text-xl">
            {t('quiz.question')} {currentQuestionIndex + 1} {t('quiz.of')} {questions.length}
          </CardTitle>
          <div className="flex items-center gap-4">
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
          <div className="flex items-start justify-between">
            <CardDescription className="text-lg font-medium">
              {currentQuestion.questionText}
            </CardDescription>
            {currentQuestion.hints && currentQuestion.hints.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowHint(!showHint)}
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('quiz.showHint')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
                className="rounded-lg max-w-full"
              />
            </div>
          )}

          {renderQuestion()}
        </div>

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => {
              setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
              setShowHint(false);
            }}
            disabled={currentQuestionIndex === 0}
          >
            {t('quiz.previousQuestion')}
          </Button>

          {questions.length === 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={selectedAnswers[currentQuestion.id] === undefined}
            >
              {t('quiz.submitQuiz')}
            </Button>
          ) : (
            <Button
              onClick={currentQuestionIndex === questions.length - 1 ? handleSubmit : handleNext}
              disabled={selectedAnswers[currentQuestion.id] === undefined}
            >
              {currentQuestionIndex < questions.length - 1 ? t('quiz.nextQuestion') : t('quiz.submitQuiz')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}