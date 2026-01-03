import React from 'react';
import { CircleCheck, CircleX, Info } from 'lucide-react';
import { QuizQuestion } from '../data/mockData';
import { Button } from './ui/button';

interface QuizViewProps {
  questions: QuizQuestion[];
  onComplete: () => void;
}

export function QuizView({ questions, onComplete }: QuizViewProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [selectedAnswer, setSelectedAnswer] = React.useState<number | null>(null);
  const [submitted, setSubmitted] = React.useState(false);
  const [answers, setAnswers] = React.useState<Array<{ questionId: string; answer: number; correct: boolean }>>([]);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    setAnswers([
      ...answers,
      {
        questionId: currentQuestion.id,
        answer: selectedAnswer,
        correct: isCorrect,
      },
    ]);
    setSubmitted(true);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      onComplete();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setSubmitted(false);
    }
  };

  const calculateScore = () => {
    const correct = answers.filter(a => a.correct).length;
    return Math.round((correct / questions.length) * 100);
  };

  // Quiz completed view
  if (currentQuestionIndex >= questions.length && answers.length === questions.length) {
    const score = calculateScore();
    
    return (
      <div className="space-y-6">
        <div 
          className="p-8 rounded-lg text-center"
          style={{
            backgroundColor: score >= 70 ? 'var(--success-bg)' : 'var(--warning-bg)',
            border: `1px solid ${score >= 70 ? 'var(--success)' : 'var(--warning)'}`,
          }}
        >
          <div 
            className="text-4xl mb-2"
            style={{ color: score >= 70 ? 'var(--success)' : 'var(--warning)' }}
          >
            {score}%
          </div>
          <h3 style={{ color: 'var(--text-primary)' }}>
            {score >= 70 ? 'Great job!' : 'Keep practicing!'}
          </h3>
          <p 
            className="mt-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            You answered {answers.filter(a => a.correct).length} out of {questions.length} questions correctly.
          </p>
        </div>

        {/* Review Answers */}
        <div>
          <h3 className="mb-4" style={{ color: 'var(--text-primary)' }}>
            Review Your Answers
          </h3>
          <div className="space-y-4">
            {questions.map((question, index) => {
              const answer = answers[index];
              const isCorrect = answer.correct;
              
              return (
                <div 
                  key={question.id}
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: 'var(--surface-1)',
                    border: `1px solid ${isCorrect ? 'var(--success)' : 'var(--error)'}`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CircleCheck className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
                    ) : (
                      <CircleX className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--error)' }} />
                    )}
                    <div className="flex-1">
                      <p className="mb-2" style={{ color: 'var(--text-primary)' }}>
                        {question.question}
                      </p>
                      <p 
                        className="text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Your answer: {question.options[answer.answer]}
                      </p>
                      {!isCorrect && (
                        <p 
                          className="text-sm mt-1"
                          style={{ color: 'var(--success)' }}
                        >
                          Correct answer: {question.options[question.correctAnswer]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span 
          className="text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          Question {currentQuestionIndex + 1} of {questions.length}
        </span>
        <span 
          className="text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          Score: {answers.filter(a => a.correct).length} / {answers.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div 
        className="h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--surface-1)' }}
      >
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
            backgroundColor: 'var(--accent-orange)',
          }}
        />
      </div>

      {/* Question */}
      <div 
        className="p-6 rounded-lg"
        style={{
          backgroundColor: 'var(--surface-1)',
          border: '1px solid var(--border-default)',
        }}
      >
        <h3 className="mb-6" style={{ color: 'var(--text-primary)' }}>
          {currentQuestion.question}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === currentQuestion.correctAnswer;
            const showResult = submitted;

            let borderColor = 'var(--border-default)';
            let bgColor = 'var(--bg-0)';

            if (showResult) {
              if (isCorrect) {
                borderColor = 'var(--success)';
                bgColor = 'var(--success-bg)';
              } else if (isSelected && !isCorrect) {
                borderColor = 'var(--error)';
                bgColor = 'var(--error-bg)';
              }
            } else if (isSelected) {
              borderColor = 'var(--accent-orange)';
              bgColor = 'var(--accent-orange-bg)';
            }

            return (
              <button
                key={index}
                onClick={() => !submitted && setSelectedAnswer(index)}
                disabled={submitted}
                className="w-full p-4 rounded-lg text-left transition-all flex items-center gap-3"
                style={{
                  border: `2px solid ${borderColor}`,
                  backgroundColor: bgColor,
                }}
              >
                <span 
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm"
                  style={{
                    backgroundColor: isSelected ? 'var(--accent-orange)' : 'var(--surface-1)',
                    color: isSelected ? 'white' : 'var(--text-secondary)',
                    border: `2px solid ${isSelected ? 'var(--accent-orange)' : 'var(--border-default)'}`,
                  }}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {option}
                </span>
                {showResult && isCorrect && (
                  <CircleCheck className="ml-auto w-5 h-5" style={{ color: 'var(--success)' }} />
                )}
                {showResult && isSelected && !isCorrect && (
                  <CircleX className="ml-auto w-5 h-5" style={{ color: 'var(--error)' }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Explanation */}
      {submitted && (
        <div 
          className="p-4 rounded-lg"
          style={{
            backgroundColor: 'var(--accent-orange-bg)',
            border: '1px solid var(--accent-orange-light)',
          }}
        >
          <div className="flex gap-3">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-orange)' }} />
            <div>
              <h4 className="mb-1" style={{ color: 'var(--text-primary)' }}>
                Explanation
              </h4>
              <p 
                className="text-sm"
                style={{ color: 'var(--text-primary)' }}
              >
                {currentQuestion.explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {!submitted ? (
          <Button
            onClick={handleSubmit}
            disabled={selectedAnswer === null}
            style={{
              backgroundColor: selectedAnswer !== null ? 'var(--accent-orange)' : 'var(--surface-1)',
              color: selectedAnswer !== null ? 'white' : 'var(--text-tertiary)',
            }}
          >
            Submit Answer
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            style={{
              backgroundColor: 'var(--accent-orange)',
              color: 'white',
            }}
          >
            {isLastQuestion ? 'View Results' : 'Next Question'}
          </Button>
        )}
      </div>
    </div>
  );
}