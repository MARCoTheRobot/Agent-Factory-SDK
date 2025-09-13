import type { Content } from "@google/genai";
// Universal types for Agent Factory SDK
export type Timestamp = Date;

export interface AgentType {
  id: string;
  name: string;
  display_name: string;
  role: string;
  description: string;
  system_instructions: string;
  response_factors: string[];
  created_by: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  organization?: string;
  public_access?: "NONE" | "READ" | "WRITE";
  org_access?: "NONE" | "READ" | "WRITE";
  read_share?: string[];
  write_share?: string[];
  tools?: AgentToolType[] | undefined;
  sessions?: SessionType[] | string[] | undefined;
  sub_agents?: AgentType[] | undefined;
  curriculums?: Partial<CurriculumType>[] | undefined;
}

export interface AgentState {
  created_at?: Timestamp;
  updated_at?: Timestamp;
  agent_id: string;
  agent_details:
    | Partial<AgentType>
    | {
        system_instructions: string;
        role: string;
        tools?: AgentToolType[];
        sessions: Partial<SessionType>[];
        name: string;
      };
  session_id: string;
  session_details: Partial<SessionType>;
  task_id?: string;
  task_details?: Partial<TaskType>;
}

export interface CurriculumType {
  id: string;
  name: string;
  display_name: string;
  description: string;
  system_instructions: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by: string;
  updated_by: string;
  is_active: boolean;
  prerequisites: string[];
  tags: string[];
  materials: string[];
  assessments: string[];
  estimated_time: string;
  is_public: boolean;
  completion_criteria: string;
  modules?: ModuleType[] | undefined;
  organization?: string;
  public_access?: "NONE" | "READ" | "WRITE";
  org_access?: "NONE" | "READ" | "WRITE";
  read_share?: string[];
  write_share?: string[];
  tools?: string[];
}

export interface ModuleType {
  id: string;
  name: string;
  display_name: string;
  description: string;
  system_instructions: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by: string;
  updated_by: string;
  is_active: boolean;
  prerequisites: string[];
  tags: string[];
  materials: string[];
  assessments: string[];
  estimated_time: string;
  is_public: boolean;
  completion_criteria: string;
  organization?: string;
  public_access?: "NONE" | "READ" | "WRITE";
  org_access?: "NONE" | "READ" | "WRITE";
  read_share?: string[];
  write_share?: string[];
  tools?: string[];
}

export interface SessionType {
  id: string;
  session_name: string;
  session_description: string;
  system_instructions: string;
  display_name: string;
  created_by: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  tasks?: Partial<TaskType>[];
  tools?: AgentToolType[] | undefined;
  organization?: string;
  public_access?: "NONE" | "READ" | "WRITE";
  org_access?: "NONE" | "READ" | "WRITE";
  read_share?: string[];
  write_share?: string[];
}

export interface SkillType {
  id: string;
  system_instructions: string;
  display_name: string;
  skill_id?: string;
  skill_name: string;
  skill_description: string;
  created_by: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  description: string;
  tools?: AgentToolType[] | undefined;
  organization?: string;
  public_access?: "NONE" | "READ" | "WRITE";
  org_access?: "NONE" | "READ" | "WRITE";
  read_share?: string[];
  write_share?: string[];
}

export interface TaskType {
  id: string;
  task_name: string;
  task_description: string;
  system_instructions: string;
  display_name: string;
  description: string;
  created_by: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  skills?: Partial<SkillType>[]; // Array of skills associated with the task
  min_interactions?: number; // Minimum interactions required for the task
  max_interactions?: number; // Maximum interactions allowed for the task
  tools?: AgentToolType[] | undefined;
  completion_criteria?: string; // Criteria for task completion
  organization?: string; // Organization associated with the task
  public_access?: "NONE" | "READ" | "WRITE"; // Public access level
  org_access?: "NONE" | "READ" | "WRITE"; // Organization access level
  read_share?: string[]; // Users or groups with read access
  write_share?: string[]; // Users or groups with write access
}

export interface AgentToolType {
  name: string;
  id: string;
  description: string;
  function_name?: string;
  parameters: {
    type: string;
    properties: {
      [key: string]: {
        type: string;
        items?: {
          type: string;
        };
      };
    };
  };
  required?: string[];
  created_by?: string;
  created_at?: Timestamp;
  updated_at?: Timestamp;
  updated_by?: string;
  display_name?: string;
}

export interface AgentQueryRefs {
  created_by?: string;
  org_id?: string;
  page_token?: string;
  max_results?: number;
}

// Additional SDK-specific interfaces
export interface ChatMessage {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
}

export interface ChatSession {
  chatId: string;
  messages: ChatMessage[];
  agentId?: string | undefined;
  sessionId?: string | undefined;
  createdAt: Date;
}

export interface StartChatConfig {
  agentId?: string;
  sessionId?: string;
  systemMessage?: string;
}

export interface SendMessageRequest {
  message: string;
  chatId?: string;
}

export interface GenerateSingleMessageRequest {
  prompt: string;
  agentId?: string;
  context?: string;
}

// Event system interfaces
export interface AgentFactoryEventMap {
  agentStateInitialized: { agentState: AgentState };
  agentStateInitializedError: { error: Error; agentId: string };
  messageSent: { message: string; agentState: AgentState };
  messageReceived: { message: string; response: any; agentState: AgentState };
  taskSwitched: {
    oldTaskId?: string;
    newTaskId: string;
    agentState: AgentState;
  };
  sessionSwitched: {
    oldSessionId?: string;
    newSessionId: string;
    agentState: AgentState;
  };
  skillCalled: { skillId: string; message: string; agentState: AgentState };
  functionCallReceived: {
    functionCall: FunctionCall;
    message?: EnhancedContent;
    agentState: AgentState;
  };
  functionCallApproved: { functionCall: FunctionCall; agentState: AgentState };
  functionCallDeclined: { functionCall: FunctionCall; agentState: AgentState };
  functionCallExecuted: {
    functionCall: FunctionCall;
    result: any;
    agentState: AgentState;
  };
  conversationHistoryUpdated: {
    history: EnhancedContent[];
    agentState: AgentState;
  };
}

export type AgentFactoryEventName = keyof AgentFactoryEventMap;
export type AgentFactoryEventHandler<T extends AgentFactoryEventName> = (
  data: AgentFactoryEventMap[T],
) => void;

// Function call interfaces for enhanced chat functionality
export interface FunctionCall {
  name: string;
  args: Record<string, any>;
}

export interface FunctionResponse {
  name: string;
  response: any;
}

// Enhanced Content interface to support function calls
export interface EnhancedContent extends Content {
  _meta?: {
    timestamp?: string;
    functionCallStatus?: "PENDING" | "APPROVED" | "DECLINED";
  };
}

export interface TestChatReturnType {
  message: string;
  notes: string;
  action: any;
  agentState: AgentState;
  conversationHistory: EnhancedContent[];
  timestamp: string;
}
