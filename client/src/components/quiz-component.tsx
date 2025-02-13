import { useState } from "react";
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
import { Loader2, Trophy, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

interface QuizComponentProps {
  topicId: number;
  userId: number;
}

export default function QuizComponent({ topicId, userId }: QuizComponentProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const { toast } = useToast();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const { data: questions, isLoading } = useQuery<Question[]>({
    queryKey: [`/api/quiz/${topicId}`],
  });

  const submitAttemptMutation = useMutation({
    mutationFn: async (attempt: InsertUserQuizAttempt) => {
      const response = await apiRequest("POST", "/api/quiz/attempt", attempt);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/quiz/history/${userId}/${topicId}`] });

      setIsCompleted(true);
      setFinalScore(data.attempt.score);

      if (data.newAchievements?.length > 0) {
        data.newAchievements.forEach((achievement: UserAchievement & { achievement: Achievement }) => {
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
          <div className="flex flex-col gap-4 items-center">
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
      const questionsAnswered = Object.entries(selectedAnswers).map(([questionId, answer]) => ({
        questionId: parseInt(questionId),
        answer,
      }));

      const score = questionsAnswered.reduce((total, { questionId, answer }) => {
        const question = questions.find(q => q.id === questionId);
        return total + (question?.correctAnswer === answer ? question?.points || 0 : 0);
      }, 0);

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
          <CardTitle className="text-xl">
            {t('quiz.question')} {currentQuestionIndex + 1} {t('quiz.of')} {questions.length}
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {t('quiz.answered')}: {Object.keys(selectedAnswers).length} {t('quiz.of')} {questions.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <CardDescription className="text-lg font-medium">
          {currentQuestion.questionText}
        </CardDescription>

        <RadioGroup
          value={selectedAnswers[currentQuestion.id]?.toString() || ''}
          onValueChange={handleAnswer}
          className="space-y-4"
        >
          {currentQuestion.options.map((option, index) => (
            <div 
              key={index} 
              className={cn(
                "flex items-center space-x-2 p-3 rounded-lg transition-colors",
                selectedAnswers[currentQuestion.id] === index ? "bg-primary/10" : "hover:bg-muted"
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

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
          >
            {t('quiz.previousQuestion')}
          </Button>
          <Button
            onClick={handleNext}
            disabled={!selectedAnswers[currentQuestion.id]}
          >
            {currentQuestionIndex < questions.length - 1 ? t('quiz.nextQuestion') : t('quiz.submitQuiz')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}