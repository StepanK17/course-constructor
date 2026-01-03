import React from 'react';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { listDocuments, uploadDocument, ApiDocument } from '../api/documentsApi';
import { toast } from 'sonner';

interface CourseCreationProps {
  onBack: () => void;
  onGenerate: (config: CourseConfig) => Promise<void>;
}

export interface CourseConfig {
  topic: string;
  goal: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  minutesPerDay: string;
  language: 'en' | 'ru' | 'es' | 'fr';
  sourceTypes: string[];
  sourceMode: 'internet' | 'documents';
  selectedDocuments: string[];
}

export function CourseCreation({ onBack, onGenerate }: CourseCreationProps) {
  const [generating, setGenerating] = React.useState(false);
  const [config, setConfig] = React.useState<CourseConfig>({
    topic: '',
    goal: '',
    level: 'intermediate',
    duration: '2',
    minutesPerDay: '30',
    language: 'en',
    sourceTypes: ['documentation', 'articles'],
    sourceMode: 'internet',
    selectedDocuments: [],
  });
  const [documents, setDocuments] = React.useState<ApiDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = React.useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await onGenerate(config);
    } finally {
      setGenerating(false);
    }
  };

  React.useEffect(() => {
    if (config.sourceMode !== 'documents') return;

    const loadDocuments = async () => {
      setLoadingDocuments(true);
      try {
        const response = await listDocuments();
        setDocuments(response.items);
      } catch (error) {
        toast.error('Failed to load documents', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        setLoadingDocuments(false);
      }
    };

    loadDocuments();
  }, [config.sourceMode]);

  const isValid = config.topic.trim() && config.goal.trim();
  const needsDocuments = config.sourceMode === 'documents';
  const hasSelectedDocuments = config.selectedDocuments.length > 0;
  const isReady = isValid && (!needsDocuments || hasSelectedDocuments);

  const toggleDocumentSelection = (documentId: string) => {
    setConfig((prev) => {
      const selected = prev.selectedDocuments.includes(documentId)
        ? prev.selectedDocuments.filter((id) => id !== documentId)
        : [...prev.selectedDocuments, documentId];
      return { ...prev, selectedDocuments: selected };
    });
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await uploadDocument(file);
      const response = await listDocuments();
      setDocuments(response.items);
      toast.success('Document uploaded');
    } catch (error) {
      toast.error('Failed to upload document', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-1)' }}
    >
      {/* Header */}
      <div 
        className="border-b"
        style={{ 
          backgroundColor: 'var(--bg-0)',
          borderColor: 'var(--border-default)',
        }}
      >
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Button>
          <h1 style={{ color: 'var(--text-primary)' }}>
            Create New Course
          </h1>
          <p 
            className="mt-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            Tell us what you want to learn, and we'll generate a structured course for you
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div 
          className="rounded-lg p-8 space-y-8"
          style={{
            backgroundColor: 'var(--surface-0)',
            border: '1px solid var(--border-default)',
          }}
        >
          {/* Topic */}
          <div className="space-y-2">
            <Label htmlFor="topic">
              Course Topic *
            </Label>
            <Input
              id="topic"
              placeholder="e.g., Introduction to RAG Systems"
              value={config.topic}
              onChange={(e) => setConfig({ ...config, topic: e.target.value })}
              style={{
                backgroundColor: 'var(--bg-1)',
                borderColor: 'var(--border-default)',
              }}
            />
          </div>

          {/* Goal */}
          <div className="space-y-2">
            <Label htmlFor="goal">
              Learning Goal *
            </Label>
            <Textarea
              id="goal"
              placeholder="What do you want to achieve? e.g., Build a working RAG application using LangChain and OpenAI"
              value={config.goal}
              onChange={(e) => setConfig({ ...config, goal: e.target.value })}
              rows={4}
              style={{
                backgroundColor: 'var(--bg-1)',
                borderColor: 'var(--border-default)',
              }}
            />
          </div>

          {/* Level and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="level">Difficulty Level</Label>
              <Select 
                value={config.level} 
                onValueChange={(value: any) => setConfig({ ...config, level: value })}
              >
                <SelectTrigger 
                  id="level"
                  style={{
                    backgroundColor: 'var(--bg-1)',
                    borderColor: 'var(--border-default)',
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Target Duration (weeks)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="52"
                value={config.duration}
                onChange={(e) => setConfig({ ...config, duration: e.target.value })}
                style={{
                  backgroundColor: 'var(--bg-1)',
                  borderColor: 'var(--border-default)',
                }}
              />
            </div>
          </div>

          {/* Minutes per day and Language */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="minutes">Minutes per Day</Label>
              <Input
                id="minutes"
                type="number"
                min="10"
                max="240"
                value={config.minutesPerDay}
                onChange={(e) => setConfig({ ...config, minutesPerDay: e.target.value })}
                style={{
                  backgroundColor: 'var(--bg-1)',
                  borderColor: 'var(--border-default)',
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Course Language</Label>
              <Select 
                value={config.language} 
                onValueChange={(value: any) => setConfig({ ...config, language: value })}
              >
                <SelectTrigger 
                  id="language"
                  style={{
                    backgroundColor: 'var(--bg-1)',
                    borderColor: 'var(--border-default)',
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ru">Russian</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sources */}
          <div className="space-y-4">
            <Label>Course Sources</Label>
            <div className="flex flex-wrap gap-2">
              {['internet', 'documents'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setConfig({ ...config, sourceMode: mode as CourseConfig['sourceMode'] })}
                  className="px-3 py-2 rounded-md text-sm transition-all"
                  style={{
                    backgroundColor: config.sourceMode === mode 
                      ? 'var(--accent-orange-bg)' 
                      : 'var(--surface-1)',
                    border: `1px solid ${config.sourceMode === mode 
                      ? 'var(--accent-orange)' 
                      : 'var(--border-default)'}`,
                    color: config.sourceMode === mode 
                      ? 'var(--accent-orange)' 
                      : 'var(--text-secondary)',
                  }}
                >
                  {mode === 'internet' ? 'Internet sources' : 'My documents'}
                </button>
              ))}
            </div>

            {config.sourceMode === 'internet' && (
              <div className="space-y-2">
                <Label>Preferred Source Types</Label>
                <div className="flex flex-wrap gap-2">
                  {['documentation', 'articles', 'videos', 'tutorials', 'research-papers'].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        const newTypes = config.sourceTypes.includes(type)
                          ? config.sourceTypes.filter(t => t !== type)
                          : [...config.sourceTypes, type];
                        setConfig({ ...config, sourceTypes: newTypes });
                      }}
                      className="px-3 py-2 rounded-md text-sm transition-all"
                      style={{
                        backgroundColor: config.sourceTypes.includes(type) 
                          ? 'var(--accent-orange-bg)' 
                          : 'var(--surface-1)',
                        border: `1px solid ${config.sourceTypes.includes(type) 
                          ? 'var(--accent-orange)' 
                          : 'var(--border-default)'}`,
                        color: config.sourceTypes.includes(type) 
                          ? 'var(--accent-orange)' 
                          : 'var(--text-secondary)',
                      }}
                    >
                      {type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {config.sourceMode === 'documents' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <label
                    className="px-3 py-2 rounded-md text-sm transition-all cursor-pointer"
                    style={{
                      backgroundColor: 'var(--surface-1)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Upload document
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt,.md"
                      onChange={handleUpload}
                      className="hidden"
                    />
                  </label>
                  {loadingDocuments && (
                    <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      Loading documents...
                    </span>
                  )}
                </div>

                {documents.length === 0 && !loadingDocuments && (
                  <div
                    className="text-sm p-3 rounded-md"
                    style={{
                      backgroundColor: 'var(--surface-1)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    No documents uploaded yet.
                  </div>
                )}

                {documents.length > 0 && (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <label
                        key={doc.id}
                        className="flex items-center gap-3 p-3 rounded-md"
                        style={{
                          backgroundColor: 'var(--surface-1)',
                          border: '1px solid var(--border-default)',
                        }}
                      >
                        <Checkbox
                          checked={config.selectedDocuments.includes(doc.id)}
                          onCheckedChange={() => toggleDocumentSelection(doc.id)}
                        />
                        <div className="flex-1">
                          <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                            {doc.filename}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {doc.status}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <p 
              className="text-sm"
              style={{ color: 'var(--text-tertiary)' }}
            >
              * Required fields
            </p>
            <Button
              onClick={handleGenerate}
              disabled={!isReady || generating}
              className="gap-2"
              style={{
                backgroundColor: isReady && !generating ? 'var(--accent-orange)' : 'var(--surface-1)',
                color: isReady && !generating ? 'white' : 'var(--text-tertiary)',
              }}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Course...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Course
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Info Box */}
        <div 
          className="mt-6 p-4 rounded-lg"
          style={{
            backgroundColor: 'var(--accent-orange-bg)',
            border: '1px solid var(--accent-orange-light)',
          }}
        >
          <p 
            className="text-sm"
            style={{ color: 'var(--text-primary)' }}
          >
            <strong>How it works:</strong> Our AI will analyze web sources related to your topic and create a structured learning path with theory, practice exercises, and quizzes. The course will be tailored to your specified difficulty level and time constraints.
          </p>
        </div>
      </div>
    </div>
  );
}
