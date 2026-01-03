// Mock data for LLM Course Builder

export type CourseStatus = 'not-started' | 'in-progress' | 'completed';
export type LessonType = 'theory' | 'practice' | 'quiz' | 'mixed';
export type LessonStatus = 'not-started' | 'in-progress' | 'completed';

export interface Source {
  id: string;
  domain: string;
  title: string;
  url: string;
  annotation: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  theoryReference?: string;
}

export interface TaskRubricItem {
  criterion: string;
  weight: number;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  type: LessonType;
  status: LessonStatus;
  duration: number; // in minutes
  theory?: string;
  practice?: {
    description: string;
    instructions: string[];
    rubric: TaskRubricItem[];
  };
  quiz?: QuizQuestion[];
  sources: Source[];
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  lessons: Lesson[];
  order: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  status: CourseStatus;
  progress: number; // 0-100
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // in hours
  language: 'en' | 'ru' | 'es' | 'fr';
  createdAt: string;
  modules: Module[];
}

export const mockCourses: Course[] = [
  {
    id: 'c1',
    title: 'Introduction to RAG Systems',
    description: 'Learn how Retrieval-Augmented Generation works and build your first RAG application',
    status: 'in-progress',
    progress: 45,
    difficulty: 'intermediate',
    estimatedDuration: 12,
    language: 'en',
    createdAt: '2024-12-15',
    modules: [],
  },
  {
    id: 'c2',
    title: 'Advanced React Patterns',
    description: 'Master advanced React concepts including hooks, context, and performance optimization',
    status: 'not-started',
    progress: 0,
    difficulty: 'advanced',
    estimatedDuration: 20,
    language: 'en',
    createdAt: '2024-12-10',
    modules: [],
  },
  {
    id: 'c3',
    title: 'TypeScript for Backend Development',
    description: 'Build type-safe Node.js applications with TypeScript and best practices',
    status: 'completed',
    progress: 100,
    difficulty: 'intermediate',
    estimatedDuration: 15,
    language: 'en',
    createdAt: '2024-11-20',
    modules: [],
  },
];

export const mockModules: Module[] = [
  {
    id: 'm1',
    courseId: 'c1',
    title: 'Fundamentals of RAG',
    description: 'Understanding the core concepts and architecture',
    order: 1,
    lessons: [],
  },
  {
    id: 'm2',
    courseId: 'c1',
    title: 'Vector Databases',
    description: 'Learn about embeddings and vector storage',
    order: 2,
    lessons: [],
  },
  {
    id: 'm3',
    courseId: 'c1',
    title: 'Building Your First RAG App',
    description: 'Hands-on project implementation',
    order: 3,
    lessons: [],
  },
];

export const mockLessons: Lesson[] = [
  {
    id: 'l1',
    moduleId: 'm1',
    title: 'What is RAG?',
    type: 'theory',
    status: 'completed',
    duration: 15,
    theory: `# What is Retrieval-Augmented Generation?

Retrieval-Augmented Generation (RAG) is a technique that enhances Large Language Models (LLMs) by providing them with relevant external information during generation. Instead of relying solely on the knowledge encoded in the model's parameters, RAG systems retrieve relevant documents or data from external sources and use this context to generate more accurate and up-to-date responses.

## Key Components

1. **Retrieval System**: Searches and retrieves relevant information from a knowledge base
2. **Language Model**: Generates responses based on the retrieved context
3. **Knowledge Base**: A collection of documents, usually stored in a vector database

## Why RAG?

- **Up-to-date information**: Access current data without retraining
- **Domain-specific knowledge**: Incorporate specialized information
- **Source attribution**: Track where information comes from
- **Reduced hallucinations**: Ground responses in factual data

## How It Works

\`\`\`
User Query → Embedding → Vector Search → Retrieved Documents → LLM + Context → Response
\`\`\`

The process involves converting the user's query into a vector embedding, searching for similar embeddings in the knowledge base, retrieving the most relevant documents, and then providing both the query and retrieved context to the LLM for response generation.`,
    sources: [
      {
        id: 's1',
        domain: 'arxiv.org',
        title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',
        url: 'https://arxiv.org/abs/2005.11401',
        annotation: 'Original RAG paper by Lewis et al., introducing the concept and architecture',
      },
      {
        id: 's2',
        domain: 'openai.com',
        title: 'Retrieval-Augmented Generation: A New Approach',
        url: 'https://openai.com/research/rag',
        annotation: 'OpenAI\'s perspective on RAG systems and their applications',
      },
    ],
  },
  {
    id: 'l2',
    moduleId: 'm1',
    title: 'RAG Architecture Deep Dive',
    type: 'theory',
    status: 'completed',
    duration: 20,
    theory: `# RAG Architecture: A Detailed Look

Understanding the architecture of RAG systems is crucial for building effective applications. Let's break down each component and how they work together.

## 1. Document Processing Pipeline

Before retrieval can happen, documents must be processed:

- **Chunking**: Breaking documents into smaller segments
- **Embedding**: Converting text chunks into vector representations
- **Storage**: Indexing vectors in a vector database

\`\`\`python
# Example: Processing a document
def process_document(doc):
    chunks = split_into_chunks(doc, chunk_size=500)
    embeddings = model.embed(chunks)
    vector_db.store(embeddings, metadata=chunks)
\`\`\`

## 2. Query Processing

When a user asks a question:

1. Convert query to embedding
2. Perform similarity search
3. Retrieve top-k most relevant chunks

## 3. Context Assembly

Retrieved chunks are assembled with the query to create a prompt for the LLM.

## Best Practices

- Use appropriate chunk sizes (usually 200-1000 tokens)
- Implement hybrid search (semantic + keyword)
- Consider re-ranking retrieved results
- Monitor retrieval quality metrics`,
    sources: [
      {
        id: 's3',
        domain: 'pinecone.io',
        title: 'RAG Architecture Best Practices',
        url: 'https://www.pinecone.io/learn/rag-architecture',
        annotation: 'Comprehensive guide to building production RAG systems',
      },
    ],
  },
  {
    id: 'l3',
    moduleId: 'm1',
    title: 'Implement Document Chunking',
    type: 'practice',
    status: 'in-progress',
    duration: 30,
    practice: {
      description: 'Implement a document chunking function that splits text intelligently while preserving semantic meaning.',
      instructions: [
        'Create a function that splits documents into chunks of approximately 500 tokens',
        'Ensure chunks don\'t break in the middle of sentences',
        'Add overlap between chunks (50-100 tokens) to maintain context',
        'Handle edge cases like very short documents',
        'Return chunks with metadata (position, character count)',
      ],
      rubric: [
        { criterion: 'Correct chunk size implementation', weight: 0.3 },
        { criterion: 'Semantic boundary preservation', weight: 0.25 },
        { criterion: 'Overlap implementation', weight: 0.2 },
        { criterion: 'Edge case handling', weight: 0.15 },
        { criterion: 'Code quality and documentation', weight: 0.1 },
      ],
    },
    sources: [
      {
        id: 's4',
        domain: 'langchain.com',
        title: 'Text Splitting Strategies',
        url: 'https://python.langchain.com/docs/modules/data_connection/document_transformers/',
        annotation: 'LangChain\'s documentation on various text splitting approaches',
      },
    ],
  },
  {
    id: 'l4',
    moduleId: 'm1',
    title: 'RAG Fundamentals Quiz',
    type: 'quiz',
    status: 'not-started',
    duration: 10,
    quiz: [
      {
        id: 'q1',
        question: 'What is the primary benefit of using RAG over a standalone LLM?',
        options: [
          'RAG models are faster',
          'RAG can access external, up-to-date information',
          'RAG requires less computational resources',
          'RAG models are smaller in size',
        ],
        correctAnswer: 1,
        explanation: 'RAG\'s main advantage is the ability to retrieve and incorporate external information, allowing the system to access current data and domain-specific knowledge without retraining the model.',
        theoryReference: 'l1',
      },
      {
        id: 'q2',
        question: 'Which component is responsible for converting text into numerical representations?',
        options: [
          'Vector database',
          'Language model',
          'Embedding model',
          'Retrieval system',
        ],
        correctAnswer: 2,
        explanation: 'The embedding model converts text (both documents and queries) into vector representations that can be compared mathematically for similarity.',
        theoryReference: 'l2',
      },
      {
        id: 'q3',
        question: 'Why is chunk overlap important in RAG systems?',
        options: [
          'To increase storage efficiency',
          'To maintain context across chunk boundaries',
          'To reduce processing time',
          'To improve embedding quality',
        ],
        correctAnswer: 1,
        explanation: 'Chunk overlap ensures that important context isn\'t lost at chunk boundaries, allowing the system to retrieve complete semantic information even when relevant content spans multiple chunks.',
        theoryReference: 'l2',
      },
    ],
    sources: [],
  },
  {
    id: 'l5',
    moduleId: 'm2',
    title: 'Introduction to Vector Databases',
    type: 'theory',
    status: 'not-started',
    duration: 18,
    theory: `# Vector Databases: The Foundation of RAG

Vector databases are specialized storage systems designed for high-dimensional vector data. They enable efficient similarity search, which is essential for RAG systems.

## What Makes Vector Databases Special?

Unlike traditional databases that organize data in rows and tables, vector databases store and index vectors (arrays of numbers) and provide fast similarity search capabilities.

## Key Operations

1. **Insert**: Store vectors with associated metadata
2. **Search**: Find k-nearest neighbors to a query vector
3. **Update**: Modify stored vectors or metadata
4. **Delete**: Remove vectors from the index

## Popular Vector Databases

- **Pinecone**: Managed cloud service
- **Weaviate**: Open-source with GraphQL API
- **Qdrant**: High-performance with filtering
- **Milvus**: Scalable for large datasets
- **ChromaDB**: Lightweight, easy to get started

## Distance Metrics

Vector databases use various metrics to measure similarity:

- **Cosine similarity**: Measures angle between vectors
- **Euclidean distance**: Straight-line distance
- **Dot product**: Direct vector multiplication`,
    sources: [
      {
        id: 's5',
        domain: 'qdrant.tech',
        title: 'Vector Database Fundamentals',
        url: 'https://qdrant.tech/documentation/overview/',
        annotation: 'Comprehensive overview of vector database concepts and use cases',
      },
    ],
  },
];
