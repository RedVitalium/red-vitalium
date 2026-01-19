import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, XCircle, ClipboardCheck, ChevronRight, Trophy, Loader2 } from "lucide-react";
import { useDailySurvey, SurveyQuestion } from "@/hooks/useDailySurvey";
import { cn } from "@/lib/utils";

interface DailySurveyCardProps {
  currentWeek: number;
  hasActiveCycle: boolean;
  className?: string;
}

interface QuestionResponse {
  questionId: string;
  answer: boolean | null;
  followUpValue?: number;
}

export function DailySurveyCard({ currentWeek, hasActiveCycle, className }: DailySurveyCardProps) {
  const {
    questions,
    todayResponses,
    weeklyStats,
    isLoading,
    isSaving,
    hasCompletedToday,
    submitAllResponses,
  } = useDailySurvey(currentWeek);

  const [isExpanded, setIsExpanded] = useState(false);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Initialize responses when questions load
  useEffect(() => {
    if (questions.length > 0) {
      const initialResponses = questions.map((q) => {
        const existing = todayResponses.find((r) => r.question_id === q.id);
        return {
          questionId: q.id,
          answer: existing ? existing.answer : null,
          followUpValue: existing?.follow_up_value || undefined,
        };
      });
      setResponses(initialResponses);
    }
  }, [questions, todayResponses]);

  const handleAnswer = (questionId: string, answer: boolean) => {
    setResponses((prev) =>
      prev.map((r) =>
        r.questionId === questionId
          ? { ...r, answer, followUpValue: answer ? undefined : r.followUpValue }
          : r
      )
    );
  };

  const handleFollowUp = (questionId: string, value: number) => {
    setResponses((prev) =>
      prev.map((r) => (r.questionId === questionId ? { ...r, followUpValue: value } : r))
    );
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    const validResponses = responses
      .filter((r) => r.answer !== null)
      .map((r) => ({
        questionId: r.questionId,
        answer: r.answer!,
        followUpValue: r.followUpValue,
      }));

    if (validResponses.length < questions.length) {
      return;
    }

    const success = await submitAllResponses(validResponses);
    if (success) {
      setIsExpanded(false);
      setCurrentQuestionIndex(0);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentResponse = responses.find((r) => r.questionId === currentQuestion?.id);
  const allAnswered = responses.every((r) => r.answer !== null);
  const needsFollowUp =
    currentQuestion?.question_type === "yes_no_count" &&
    currentResponse?.answer === false &&
    !currentResponse?.followUpValue;

  const achievedToday = responses.filter((r) => r.answer === true).length;
  const progressPercentage = questions.length > 0 ? (achievedToday / questions.length) * 100 : 0;

  if (!hasActiveCycle) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className={cn("bg-gradient-to-br from-background to-muted/30", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return null;
  }

  return (
    <Card className={cn("bg-gradient-to-br from-background to-muted/30 overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Logros Diarios</CardTitle>
          </div>
          {hasCompletedToday && (
            <Badge variant="outline" className="bg-success/10 text-success border-success/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Completado
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!isExpanded ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Summary View */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {hasCompletedToday
                    ? `${achievedToday}/${questions.length} logros alcanzados hoy`
                    : "Registra tus logros de ayer"}
                </p>
                {weeklyStats && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Promedio semanal: {weeklyStats.averageAchievement}%
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(true)}
                className="gap-1"
              >
                {hasCompletedToday ? "Ver/Editar" : "Comenzar"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress bar */}
            {hasCompletedToday && (
              <div className="space-y-1">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-primary to-success rounded-full"
                  />
                </div>
              </div>
            )}

            {/* Weekly category stats */}
            {weeklyStats && weeklyStats.categoryStats && (
              <div className="grid grid-cols-3 gap-2 pt-2">
                {Object.entries(weeklyStats.categoryStats).map(([category, stats]) => (
                  <div
                    key={category}
                    className="text-center p-2 rounded-lg bg-muted/50"
                  >
                    <p className="text-xs text-muted-foreground capitalize">{category}</p>
                    <p className="text-sm font-semibold text-foreground">{stats.percentage}%</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Progress indicator */}
              <div className="flex items-center gap-1">
                {questions.map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      idx === currentQuestionIndex
                        ? "bg-primary"
                        : responses[idx]?.answer !== null
                        ? responses[idx]?.answer
                          ? "bg-success"
                          : "bg-destructive/50"
                        : "bg-muted"
                    )}
                  />
                ))}
              </div>

              {/* Question */}
              <div className="py-4">
                <p className="text-sm font-medium text-foreground leading-relaxed">
                  {currentQuestion?.question_text}
                </p>
              </div>

              {/* Answer buttons */}
              <div className="flex gap-3">
                <Button
                  variant={currentResponse?.answer === true ? "default" : "outline"}
                  className={cn(
                    "flex-1 gap-2",
                    currentResponse?.answer === true && "bg-success hover:bg-success/90"
                  )}
                  onClick={() => handleAnswer(currentQuestion.id, true)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Sí
                </Button>
                <Button
                  variant={currentResponse?.answer === false ? "default" : "outline"}
                  className={cn(
                    "flex-1 gap-2",
                    currentResponse?.answer === false && "bg-destructive hover:bg-destructive/90"
                  )}
                  onClick={() => handleAnswer(currentQuestion.id, false)}
                >
                  <XCircle className="h-4 w-4" />
                  No
                </Button>
              </div>

              {/* Follow-up dropdown */}
              {currentQuestion?.question_type === "yes_no_count" &&
                currentResponse?.answer === false && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-2"
                  >
                    <p className="text-sm text-muted-foreground">
                      {currentQuestion.follow_up_label}
                    </p>
                    <Select
                      value={currentResponse.followUpValue?.toString()}
                      onValueChange={(val) => handleFollowUp(currentQuestion.id, parseFloat(val))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(currentQuestion.follow_up_options || []).map((opt) => (
                          <SelectItem key={opt} value={opt.toString()}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                )}

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={
                    currentQuestionIndex === 0 ? () => setIsExpanded(false) : handlePrevious
                  }
                >
                  {currentQuestionIndex === 0 ? "Cancelar" : "Anterior"}
                </Button>

                {currentQuestionIndex === questions.length - 1 ? (
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={!allAnswered || needsFollowUp || isSaving}
                    className="gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trophy className="h-4 w-4" />
                    )}
                    Guardar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleNext}
                    disabled={currentResponse?.answer === null || needsFollowUp}
                  >
                    Siguiente
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
}
