import React from 'react';
import { CircleCheck, AlertCircle } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';

interface PracticeViewProps {
  practice: {
    description: string;
    instructions: string[];
    rubric: Array<{ criterion: string; weight: number }>;
  };
  onSubmit: (answer: string) => void;
}

export function PracticeView({ practice, onSubmit }: PracticeViewProps) {
  const [answer, setAnswer] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{
    strengths: string[];
    improvements: string[];
    score: number;
  } | null>(null);

  const handleSubmit = () => {
    // Simulate AI feedback
    setFeedback({
      strengths: [
        'Good implementation of the core chunking logic',
        'Proper handling of sentence boundaries',
        'Clear code structure and naming',
      ],
      improvements: [
        'Consider adding more robust error handling for edge cases',
        'The overlap implementation could be more efficient',
        'Add unit tests to validate the chunking behavior',
      ],
      score: 85,
    });
    setSubmitted(true);
    onSubmit(answer);
  };

  return (
    <div className="space-y-6">
      {/* Description */}
      <div 
        className="p-6 rounded-lg"
        style={{
          backgroundColor: 'var(--surface-1)',
          border: '1px solid var(--border-default)',
        }}
      >
        <p style={{ color: 'var(--text-primary)' }}>
          {practice.description}
        </p>
      </div>

      {/* Instructions */}
      <div>
        <h3 className="mb-3" style={{ color: 'var(--text-primary)' }}>
          Instructions
        </h3>
        <ol className="space-y-2">
          {practice.instructions.map((instruction, index) => (
            <li 
              key={index}
              className="flex gap-3"
            >
              <span 
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm"
                style={{
                  backgroundColor: 'var(--accent-orange-bg)',
                  color: 'var(--accent-orange)',
                }}
              >
                {index + 1}
              </span>
              <span style={{ color: 'var(--text-primary)' }}>
                {instruction}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Evaluation Rubric */}
      <div>
        <h3 className="mb-3" style={{ color: 'var(--text-primary)' }}>
          Evaluation Rubric
        </h3>
        <div className="space-y-2">
          {practice.rubric.map((item, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 rounded-lg"
              style={{
                backgroundColor: 'var(--surface-1)',
              }}
            >
              <span 
                className="text-sm"
                style={{ color: 'var(--text-primary)' }}
              >
                {item.criterion}
              </span>
              <span 
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                {Math.round(item.weight * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Answer Input */}
      <div>
        <h3 className="mb-3" style={{ color: 'var(--text-primary)' }}>
          Your Solution
        </h3>
        <Textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Write your code or answer here..."
          rows={12}
          disabled={submitted}
          className="font-mono"
          style={{
            backgroundColor: submitted ? 'var(--surface-1)' : 'var(--bg-0)',
            borderColor: 'var(--border-default)',
          }}
        />
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="space-y-4">
          {/* Score */}
          <div 
            className="p-6 rounded-lg text-center"
            style={{
              backgroundColor: 'var(--success-bg)',
              border: '1px solid var(--success)',
            }}
          >
            <div className="text-3xl mb-2" style={{ color: 'var(--success)' }}>
              {feedback.score}%
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Great work! Here's detailed feedback on your solution.
            </p>
          </div>

          {/* Strengths */}
          <div 
            className="p-6 rounded-lg"
            style={{
              backgroundColor: 'var(--surface-1)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <CircleCheck className="w-5 h-5" style={{ color: 'var(--success)' }} />
              <h4 style={{ color: 'var(--text-primary)' }}>Strengths</h4>
            </div>
            <ul className="space-y-2">
              {feedback.strengths.map((strength, index) => (
                <li 
                  key={index}
                  className="flex gap-2 text-sm"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <span style={{ color: 'var(--success)' }}>✓</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div 
            className="p-6 rounded-lg"
            style={{
              backgroundColor: 'var(--surface-1)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5" style={{ color: 'var(--warning)' }} />
              <h4 style={{ color: 'var(--text-primary)' }}>Areas for Improvement</h4>
            </div>
            <ul className="space-y-2">
              {feedback.improvements.map((improvement, index) => (
                <li 
                  key={index}
                  className="flex gap-2 text-sm"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <span style={{ color: 'var(--warning)' }}>→</span>
                  {improvement}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Submit Button */}
      {!submitted && (
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!answer.trim()}
            style={{
              backgroundColor: answer.trim() ? 'var(--accent-orange)' : 'var(--surface-1)',
              color: answer.trim() ? 'white' : 'var(--text-tertiary)',
            }}
          >
            Submit for Review
          </Button>
        </div>
      )}
    </div>
  );
}