import type {
  AgentState,
  AgentType,
  AgentToolType,
  SkillType,
  SessionType,
  TaskType,
  CurriculumType,
  ModuleType,
  AgentQueryRefs,
  ChatMessage,
  ChatSession,
  StartChatConfig,
  SendMessageRequest,
  GenerateSingleMessageRequest,
  AgentFactoryEventMap,
  AgentFactoryEventName,
  AgentFactoryEventHandler,
  FunctionCall,
  FunctionResponse,
  EnhancedContent,
  TestChatReturnType,
} from "./types/agentfactory.js";

import type { Content } from "@google/genai";
import { HttpClient } from "./http.js";
import { UniversalEventEmitter } from "./events.js";

export interface AgentFactoryOptions {
  baseUrl?: string;
  timeout?: number;
  debug?: boolean;
  autoUseSkill?: boolean;
  autoSwitchTask?: boolean;
  autoSwitchSession?: boolean;
}

export class AgentFactoryHandler extends UniversalEventEmitter {
  private http: HttpClient;
  private agentState: AgentState;
  private conversationHistory: EnhancedContent[] = [];
  public autoSwitchTask: boolean = true;
  public autoUseSkill: boolean = true;
  public autoSwitchSession: boolean = true;

  constructor(apiKey: string, opts?: AgentFactoryOptions) {
    super();

    this.http = new HttpClient({
      baseURL: opts?.baseUrl || "https://marco-api-dev.uk.r.appspot.com",
      timeout: opts?.timeout || 60000,
      apiKey,
      debug: opts?.debug || false,
    });

    this.agentState = {
      created_at: new Date(),
      updated_at: new Date(),
      agent_id: "",
      agent_details: {
        system_instructions: "",
        role: "",
        tools: [],
        sessions: [],
        name: "",
      },
      session_id: "",
      session_details: {},
      task_id: "",
      task_details: {},
    };

    this.conversationHistory = [];

    // Set auto options
    this.autoSwitchTask = opts?.autoSwitchTask ?? true;
    this.autoUseSkill = opts?.autoUseSkill ?? true;
    this.autoSwitchSession = opts?.autoSwitchSession ?? true;
  }

  // =============================================================================
  // TYPE-SAFE EVENT METHODS
  // =============================================================================

  /**
   * Add a typed event listener
   */
  public addEventListener<T extends AgentFactoryEventName>(
    event: T,
    handler: AgentFactoryEventHandler<T>,
  ): this {
    return super.on(event, handler as any);
  }

  /**
   * Add a typed one-time event listener
   */
  public addEventListenerOnce<T extends AgentFactoryEventName>(
    event: T,
    handler: AgentFactoryEventHandler<T>,
  ): this {
    return super.once(event, handler as any);
  }

  /**
   * Remove a typed event listener
   */
  public removeEventListener<T extends AgentFactoryEventName>(
    event: T,
    handler: AgentFactoryEventHandler<T>,
  ): this {
    return super.off(event, handler as any);
  }

  /**
   * Emit a typed event
   */
  private emitEvent<T extends AgentFactoryEventName>(
    event: T,
    data: AgentFactoryEventMap[T],
  ): boolean {
    return super.emit(event, data);
  }

  // =============================================================================
  // AGENT METHODS
  // =============================================================================

  /**
   * Create a new agent
   */
  async createAgent(agentData: Partial<AgentType>): Promise<AgentType> {
    return await this.http.post("/v2/agents/agents", agentData);
  }

  /**
   * Update an existing agent
   */
  async updateAgent(
    agentId: string,
    agentData: Partial<AgentType>,
  ): Promise<AgentType> {
    return await this.http.patch(`/v2/agents/agents/${agentId}`, agentData);
  }

  /**
   * Get detailed information about a specific agent
   */
  async getAgentDetails(agentId: string): Promise<AgentType> {
    return await this.http.get(`/v2/agents/agent-details/${agentId}`);
  }

  /**
   * Delete an agent
   */
  async deleteAgent(agentId: string): Promise<void> {
    await this.http.delete(`/v2/agents/agents/${agentId}`);
  }

  /**
   * Get a list of all agents
   */
  async getAllAgents(
    opts: AgentQueryRefs = {},
  ): Promise<{ agents: AgentType[]; nextPageQuery: number }> {
    const params = new URLSearchParams();
    if (opts.created_by) params.append("created_by", opts.created_by);
    if (opts.org_id) params.append("org_id", opts.org_id);
    if (opts.page_token) params.append("page_token", opts.page_token);
    if (opts.max_results)
      params.append("max_results", opts.max_results.toString());

    return await this.http.get(`/v2/agents/agents?${params.toString()}`);
  }

  /**
   * Add a session to an agent
   */
  async addSessionToAgent(
    agentId: string,
    sessionData: any,
  ): Promise<AgentType> {
    return await this.http.post(
      `/v2/agents/agents/${agentId}/sessions`,
      sessionData,
    );
  }

  /**
   * Remove a session from an agent
   */
  async removeSessionFromAgent(
    agentId: string,
    sessionData: any,
  ): Promise<AgentType> {
    return await this.http.delete(`/v2/agents/agents/${agentId}/sessions`, {
      data: sessionData,
    });
  }

  /**
   * Get a compiled agent with all its components assembled
   */
  async getCompiledAgent(): Promise<AgentType> {
    return await this.http.get("/v2/agents/agents/compiled");
  }

  /**
   * Get compiled notes from agent interactions
   */
  async getCompiledNotes(): Promise<any> {
    return await this.http.get("/v2/agents/agents/compiled/notes");
  }

  // =============================================================================
  // TOOLS METHODS
  // =============================================================================

  /**
   * Create a new agent tool
   */
  async createTool(toolData: Partial<AgentToolType>): Promise<AgentToolType> {
    return await this.http.post("/v2/agents/tools", toolData);
  }

  /**
   * Get a list of all available tools
   */
  async getTools(opts: AgentQueryRefs = {}): Promise<AgentToolType[]> {
    const params = new URLSearchParams();
    if (opts.created_by) params.append("created_by", opts.created_by);
    if (opts.org_id) params.append("org_id", opts.org_id);
    if (opts.page_token) params.append("page_token", opts.page_token);
    if (opts.max_results)
      params.append("max_results", opts.max_results.toString());

    return await this.http.get(`/v2/agents/tools?${params.toString()}`);
  }

  /**
   * Get detailed information about a specific tool
   */
  async getTool(toolId: string): Promise<AgentToolType> {
    return await this.http.get(`/v2/agents/tools/${toolId}`);
  }

  /**
   * Update an existing tool
   */
  async updateTool(
    toolId: string,
    toolData: Partial<AgentToolType>,
  ): Promise<AgentToolType> {
    return await this.http.patch(`/v2/agents/tools/${toolId}`, toolData);
  }

  /**
   * Delete a tool
   */
  async deleteTool(toolId: string): Promise<void> {
    await this.http.delete(`/v2/agents/tools/${toolId}`);
  }

  // =============================================================================
  // SKILLS METHODS
  // =============================================================================

  /**
   * Create a new skill
   */
  async createSkill(skillData: Partial<SkillType>): Promise<SkillType> {
    return await this.http.post("/v2/agents/skills", skillData);
  }

  /**
   * Get a list of all available skills
   */
  async getSkills(opts: AgentQueryRefs = {}): Promise<SkillType[]> {
    const params = new URLSearchParams();
    if (opts.created_by) params.append("created_by", opts.created_by);
    if (opts.org_id) params.append("org_id", opts.org_id);
    if (opts.page_token) params.append("page_token", opts.page_token);
    if (opts.max_results)
      params.append("max_results", opts.max_results.toString());

    return await this.http.get(`/v2/agents/skills?${params.toString()}`);
  }

  /**
   * Get detailed information about a specific skill
   */
  async getSkill(skillId: string): Promise<SkillType> {
    return await this.http.get(`/v2/agents/skills/${skillId}`);
  }

  /**
   * Update an existing skill
   */
  async updateSkill(
    skillId: string,
    skillData: Partial<SkillType>,
  ): Promise<SkillType> {
    return await this.http.patch(`/v2/agents/skills/${skillId}`, skillData);
  }

  /**
   * Delete a skill
   */
  async deleteSkill(skillId: string): Promise<void> {
    await this.http.delete(`/v2/agents/skills/${skillId}`);
  }

  // =============================================================================
  // SESSIONS METHODS
  // =============================================================================

  /**
   * Create a new session
   */
  async createSession(sessionData: Partial<SessionType>): Promise<SessionType> {
    return await this.http.post("/v2/agents/sessions", sessionData);
  }

  /**
   * Get a list of all available sessions
   */
  async getSessions(opts: AgentQueryRefs = {}): Promise<SessionType[]> {
    const params = new URLSearchParams();
    if (opts.created_by) params.append("created_by", opts.created_by);
    if (opts.org_id) params.append("org_id", opts.org_id);
    if (opts.page_token) params.append("page_token", opts.page_token);
    if (opts.max_results)
      params.append("max_results", opts.max_results.toString());

    return await this.http.get(`/v2/agents/sessions?${params.toString()}`);
  }

  /**
   * Get detailed information about a specific session
   */
  async getSession(sessionId: string): Promise<SessionType> {
    return await this.http.get(`/v2/agents/sessions/${sessionId}`);
  }

  /**
   * Update an existing session
   */
  async updateSession(
    sessionId: string,
    sessionData: Partial<SessionType>,
  ): Promise<SessionType> {
    return await this.http.patch(
      `/v2/agents/sessions/${sessionId}`,
      sessionData,
    );
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.http.delete(`/v2/agents/sessions/${sessionId}`);
  }

  /**
   * Add a task to a session
   */
  async addTaskToSession(
    sessionId: string,
    taskData: { taskId: string },
  ): Promise<SessionType> {
    return await this.http.post(
      `/v2/agents/sessions/${sessionId}/tasks`,
      taskData,
    );
  }

  /**
   * Remove a task from a session
   */
  async removeTaskFromSession(
    sessionId: string,
    taskData: { taskId: string },
  ): Promise<SessionType> {
    return await this.http.delete(`/v2/agents/sessions/${sessionId}/tasks`, {
      data: taskData,
    });
  }

  // =============================================================================
  // TASKS METHODS
  // =============================================================================

  /**
   * Create a new task
   */
  async createTask(taskData: Partial<TaskType>): Promise<TaskType> {
    return await this.http.post("/v2/agents/tasks", taskData);
  }

  /**
   * Get a list of all available tasks
   */
  async getTasks(opts: AgentQueryRefs = {}): Promise<TaskType[]> {
    const params = new URLSearchParams();
    if (opts.created_by) params.append("created_by", opts.created_by);
    if (opts.org_id) params.append("org_id", opts.org_id);
    if (opts.page_token) params.append("page_token", opts.page_token);
    if (opts.max_results)
      params.append("max_results", opts.max_results.toString());

    return await this.http.get(`/v2/agents/tasks?${params.toString()}`);
  }

  /**
   * Get detailed information about a specific task
   */
  async getTask(taskId: string): Promise<TaskType> {
    return await this.http.get(`/v2/agents/tasks/${taskId}`);
  }

  /**
   * Update an existing task
   */
  async updateTask(
    taskId: string,
    taskData: Partial<TaskType>,
  ): Promise<TaskType> {
    return await this.http.patch(`/v2/agents/tasks/${taskId}`, taskData);
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<void> {
    await this.http.delete(`/v2/agents/tasks/${taskId}`);
  }

  /**
   * Add a skill to a task
   */
  async addSkillToTask(
    taskId: string,
    skillData: { skillId: string },
  ): Promise<TaskType> {
    return await this.http.post(`/v2/agents/tasks/${taskId}/skills`, skillData);
  }

  /**
   * Remove a skill from a task
   */
  async removeSkillFromTask(
    taskId: string,
    skillData: { skillId: string },
  ): Promise<TaskType> {
    return await this.http.delete(`/v2/agents/tasks/${taskId}/skills`, {
      data: skillData,
    });
  }

  // =============================================================================
  // CURRICULUM METHODS
  // =============================================================================

  /**
   * Create a new curriculum
   */
  async createCurriculum(
    curriculumData: Partial<CurriculumType>,
  ): Promise<CurriculumType> {
    return await this.http.post("/v2/agents/curriculums", curriculumData);
  }

  /**
   * Get a list of all available curriculums
   */
  async getCurriculums(opts: AgentQueryRefs = {}): Promise<CurriculumType[]> {
    const params = new URLSearchParams();
    if (opts.created_by) params.append("created_by", opts.created_by);
    if (opts.org_id) params.append("org_id", opts.org_id);
    if (opts.page_token) params.append("page_token", opts.page_token);
    if (opts.max_results)
      params.append("max_results", opts.max_results.toString());

    return await this.http.get(`/v2/agents/curriculums?${params.toString()}`);
  }

  /**
   * Get detailed information about a specific curriculum
   */
  async getCurriculum(curriculumId: string): Promise<CurriculumType> {
    return await this.http.get(`/v2/agents/curriculums/${curriculumId}`);
  }

  /**
   * Update an existing curriculum
   */
  async updateCurriculum(
    curriculumId: string,
    curriculumData: Partial<CurriculumType>,
  ): Promise<CurriculumType> {
    return await this.http.patch(
      `/v2/agents/curriculums/${curriculumId}`,
      curriculumData,
    );
  }

  /**
   * Delete a curriculum
   */
  async deleteCurriculum(curriculumId: string): Promise<void> {
    await this.http.delete(`/v2/agents/curriculums/${curriculumId}`);
  }

  /**
   * Add a module to a curriculum
   */
  async addModuleToCurriculum(
    curriculumId: string,
    moduleData: { moduleId: string },
  ): Promise<CurriculumType> {
    return await this.http.post(
      `/v2/agents/curriculums/${curriculumId}/modules`,
      moduleData,
    );
  }

  /**
   * Remove a module from a curriculum
   */
  async removeModuleFromCurriculum(
    curriculumId: string,
    moduleData: { moduleId: string },
  ): Promise<CurriculumType> {
    return await this.http.delete(
      `/v2/agents/curriculums/${curriculumId}/modules`,
      {
        data: moduleData,
      },
    );
  }

  // =============================================================================
  // MODULE METHODS
  // =============================================================================

  /**
   * Create a new module
   */
  async createModule(moduleData: Partial<ModuleType>): Promise<ModuleType> {
    return await this.http.post("/v2/agents/modules", moduleData);
  }

  /**
   * Get a list of all available modules
   */
  async getModules(opts: AgentQueryRefs = {}): Promise<ModuleType[]> {
    const params = new URLSearchParams();
    if (opts.created_by) params.append("created_by", opts.created_by);
    if (opts.org_id) params.append("org_id", opts.org_id);
    if (opts.page_token) params.append("page_token", opts.page_token);
    if (opts.max_results)
      params.append("max_results", opts.max_results.toString());

    return await this.http.get(`/v2/agents/modules?${params.toString()}`);
  }

  /**
   * Get detailed information about a specific module
   */
  async getModule(moduleId: string): Promise<ModuleType> {
    return await this.http.get(`/v2/agents/modules/${moduleId}`);
  }

  /**
   * Update an existing module
   */
  async updateModule(
    moduleId: string,
    moduleData: Partial<ModuleType>,
  ): Promise<ModuleType> {
    return await this.http.patch(`/v2/agents/modules/${moduleId}`, moduleData);
  }

  /**
   * Delete a module
   */
  async deleteModule(moduleId: string): Promise<void> {
    await this.http.delete(`/v2/agents/modules/${moduleId}`);
  }

  // =============================================================================
  // TESTING METHODS
  // =============================================================================

  /**
   * Test chat with current agent state
   */
  async testChat(
    message: string,
    history: EnhancedContent[] = this.conversationHistory,
  ): Promise<any> {
    // Create user message but don't add to history yet
    const userMessage: EnhancedContent = {
      role: "user",
      parts: [{ text: message }],
      _meta: {
        timestamp: new Date().toLocaleTimeString(),
      },
    };

    // Create temporary history for this request
    const requestHistory = [...history, userMessage];

    // Emit message sent event
    this.emitEvent("messageSent", {
      message,
      agentState: this.agentState,
    });

    try {
      const response = (await this.http.post("/chat/test-chat", {
        message,
        history: requestHistory,
        agentState: this.agentState,
      })) as TestChatReturnType;

      // Now update the actual conversation history with user message
      this.conversationHistory.push(userMessage);

      // Check for function calls in the response FIRST
      if (response.action) {
        const functionResult = await this.handleFunctionCall(response.action);
        // Return the function result instead of processing as regular message
        return functionResult;
      }

      // Process the response and handle function calls
      const processedResponse = await this.processResponseWithFunctionCalls(
        response,
        message,
      );

      // Emit message received event
      this.emitEvent("messageReceived", {
        message: processedResponse.message,
        response: processedResponse,
        agentState: this.agentState,
      });

      // Emit conversation history updated event
      this.emitEvent("conversationHistoryUpdated", {
        history: this.conversationHistory,
        agentState: this.agentState,
      });

      return processedResponse;
    } catch (error) {
      console.error("Error in testChat:", error);
      throw error;
    }
  }

  /**
   * Test skill with current agent state
   */
  async testSkill(
    message: string,
    skillName: number,
    history: EnhancedContent[] = this.conversationHistory,
  ): Promise<any> {
    // Create user message but don't add to history yet
    const userMessage: EnhancedContent = {
      role: "user",
      parts: [{ text: message }],
      _meta: {
        timestamp: new Date().toLocaleTimeString(),
      },
    };

    // Create temporary history for this request
    const requestHistory = [...history, userMessage];

    const selectedSkill = this.agentState.task_details?.skills?.[skillName - 1];

    // Emit skill called event
    this.emitEvent("skillCalled", {
      skillId: selectedSkill?.id as string,
      message,
      agentState: this.agentState,
    });

    // Emit message sent event
    this.emitEvent("messageSent", {
      message,
      agentState: this.agentState,
    });

    try {
      if (!selectedSkill) {
        throw new Error(
          `Skill with index ${skillName} not found in current task.`,
        );
      }

      const response = await this.http.post("/chat/test-skill", {
        message,
        skillId: selectedSkill.id,
        history: requestHistory,
        agentState: this.agentState,
      });

      // Now update the actual conversation history with user message
      this.conversationHistory.push(userMessage);

      // Check for function calls in the response FIRST
      if (response.action) {
        const functionResult = await this.handleFunctionCall(response.action);
        // Return the function result instead of processing as regular message
        return functionResult;
      }

      // Process the response and handle function calls
      const processedResponse = await this.processResponseWithFunctionCalls(
        response,
        message,
      );

      // Emit message received event
      this.emitEvent("messageReceived", {
        message: processedResponse.message,
        response: processedResponse,
        agentState: this.agentState,
      });

      // Emit conversation history updated event
      this.emitEvent("conversationHistoryUpdated", {
        history: this.conversationHistory,
        agentState: this.agentState,
      });

      return processedResponse;
    } catch (error) {
      console.error("Error in testSkill:", error);
      throw error;
    }
  }

  /**
   * Process chat response and handle function calls
   */
  private async processResponseWithFunctionCalls(
    response: TestChatReturnType,
    originalMessage: string,
  ): Promise<any> {
    // Create assistant message with the actual response
    const assistantMessage: EnhancedContent = {
      role: "model",
      parts: [{ text: response.message || JSON.stringify(response) }],
      _meta: {
        timestamp: new Date().toLocaleTimeString(),
      },
    };

    // Add assistant message to conversation history
    this.conversationHistory.push(assistantMessage);

    // Return the original response object
    return response;
  }

  /**
   * Handle function calls from assistant responses
   */
  private async handleFunctionCall(
    functionCall: FunctionCall,
    message?: EnhancedContent,
  ): Promise<any> {
    // Emit function call received event
    this.emitEvent("functionCallReceived", {
      functionCall,
      agentState: this.agentState,
    });

    // Set function call status to pending
    if (message?._meta) {
      message._meta.functionCallStatus = "PENDING";
    }

    // Auto-approve and execute function calls based on settings
    const shouldAutoExecute = this.shouldAutoExecuteFunctionCall(functionCall);

    if (shouldAutoExecute) {
      return await this.approveFunctionCall(functionCall);
    } else {
      // If not auto-executing, return the function call for manual handling
      return { functionCall, requiresApproval: true };
    }
  }

  /**
   * Determine if a function call should be auto-executed
   */
  private shouldAutoExecuteFunctionCall(functionCall: FunctionCall): boolean {
    switch (functionCall.name) {
      case "switchTask":
        return this.autoSwitchTask;
      case "switchSession":
        return this.autoSwitchSession;
      case "useSkill":
        return this.autoUseSkill;
      default:
        return false;
    }
  }

  /**
   * Approve and execute a function call
   */
  async approveFunctionCall(functionCall: FunctionCall): Promise<any> {
    try {
      // Emit approval event
      this.emitEvent("functionCallApproved", {
        functionCall,
        agentState: this.agentState,
      });

      let result: any;

      // Execute the function call based on its name
      switch (functionCall.name) {
        case "switchTask":
          result = await this.executeSwitchTask(functionCall.args);
          break;
        case "switchSession":
          result = await this.executeSwitchSession(functionCall.args);
          break;
        case "useSkill":
          result = await this.executeUseSkill(functionCall.args);
          break;
        default:
          throw new Error(`Unknown function call: ${functionCall.name}`);
      }

      // Emit execution completed event
      this.emitEvent("functionCallExecuted", {
        functionCall,
        result,
        agentState: this.agentState,
      });

      return result;
    } catch (error) {
      console.error(
        `Error executing function call ${functionCall.name}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Decline a function call
   */
  declineFunctionCall(functionCall: FunctionCall): void {
    // Emit decline event
    this.emitEvent("functionCallDeclined", {
      functionCall,
      agentState: this.agentState,
    });

    // Update function call status in conversation history
    for (const message of this.conversationHistory) {
      if (message.parts) {
        for (const part of message.parts) {
          if (
            part.functionCall &&
            part.functionCall.name === functionCall.name
          ) {
            if (message._meta) {
              message._meta.functionCallStatus = "DECLINED";
            }
          }
        }
      }
    }
  }

  /**
   * Execute switchTask function call
   */
  private async executeSwitchTask(args: Record<string, any>): Promise<any> {
    const { task_id } = args;
    console.log("Executing switchTask with args:", args);

    if (task_id !== undefined) {
      await this.changeTask(task_id);
      //   console.log("Switched to task:", this.agentState.task_details);
      return this.sendFollowUpMessage(
        `Switched to task ${this.agentState.task_details?.display_name || task_id}`,
      );
    }

    throw new Error("Missing task_id in switchTask function call");
  }

  /**
   * Execute switchSession function call
   */
  private async executeSwitchSession(args: Record<string, any>): Promise<any> {
    const { sessionIndex, sessionId } = args;

    if (sessionIndex !== undefined) {
      await this.changeSession(sessionIndex);
      return {
        success: true,
        message: `Switched to session at index ${sessionIndex}`,
      };
    } else if (sessionId) {
      await this.changeSession(sessionId);
      return { success: true, message: `Switched to session ${sessionId}` };
    }

    throw new Error(
      "Missing sessionIndex or sessionId in switchSession function call",
    );
  }

  /**
   * Execute useSkill function call
   */
  private async executeUseSkill(args: Record<string, any>): Promise<any> {
    const { skillName, message } = args;

    if (!skillName) {
      throw new Error("Missing skillName in useSkill function call");
    }

    const result = await this.testSkill(message || "Using skill", skillName);
    return { success: true, message: `Used skill ${skillName}`, result };
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): EnhancedContent[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history
   */
  clearConversationHistory(): void {
    this.conversationHistory = [];
    this.emitEvent("conversationHistoryUpdated", {
      history: this.conversationHistory,
      agentState: this.agentState,
    });
  }

  /**
   * Add message to conversation history
   */
  addMessageToHistory(message: EnhancedContent): void {
    this.conversationHistory.push(message);
    this.emitEvent("conversationHistoryUpdated", {
      history: this.conversationHistory,
      agentState: this.agentState,
    });
  }

  /**
   * Send a follow-up message after function execution
   */
  async sendFollowUpMessage(message: string): Promise<any> {
    return await this.testChat(message);
  }

  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================

  /**
   * Get current agent state
   */
  getAgentState(): AgentState {
    return { ...this.agentState };
  }

  getConversationHistoryRaw(): EnhancedContent[] {
    return this.conversationHistory;
  }

  /**
   * Update agent state
   */
  updateAgentState(updates: Partial<AgentState>): void {
    this.agentState = {
      ...this.agentState,
      ...updates,
      updated_at: new Date(),
    };
  }

  /**
   * Initialize the agent state from an existing agentID
   */
  async initializeAgentState(agentId: string): Promise<void> {
    try {
      this.agentState.agent_id = agentId;
      const agentDetails = await this.http.get(
        `/v2/agents/agent-details/${agentId}`,
      );
      this.agentState = {
        ...this.agentState,
        ...agentDetails,
      };

      // Get the first session if available
      if (agentDetails.sessions && agentDetails.sessions.length > 0) {
        const firstSession: SessionType =
          typeof agentDetails.sessions[0] === "string"
            ? await this.http.get(
                `/v2/agents/sessions/${agentDetails.sessions[0]}`,
              )
            : await this.http.get(
                `/v2/agents/sessions/${agentDetails.sessions[0].id}`,
              );
        this.agentState.session_id = firstSession.id;
        this.agentState.session_details = firstSession;

        // Get the first task if available
        if (firstSession.tasks && firstSession.tasks.length > 0) {
          const firstTask: TaskType =
            typeof firstSession.tasks[0] === "string"
              ? await this.http.get(`/v2/agents/tasks/${firstSession.tasks[0]}`)
              : await this.http.get(
                  `/v2/agents/tasks/${firstSession.tasks[0]?.id}`,
                );
          this.agentState.task_id = firstTask.id;
          this.agentState.task_details = firstTask;
        }
      }

      // Emit success event
      this.emitEvent("agentStateInitialized", { agentState: this.agentState });

      return;
    } catch (error) {
      // Emit error event
      this.emitEvent("agentStateInitializedError", {
        error: error as Error,
        agentId,
      });
      throw error;
    }
  }

  /**
   * Change the agent's current session
   */
  async changeSession(
    sessionId: string | number,
    callback?: () => void,
  ): Promise<void> {
    let actualSessionId: string;
    const oldSessionId = this.agentState.session_id;

    if (typeof sessionId === "string") {
      actualSessionId = sessionId;
    } else {
      // sessionId is a number, treat as 1-based index
      const sessions = this.agentState.agent_details.sessions;
      if (!sessions || sessions.length === 0) {
        throw new Error("No sessions available in agent state");
      }
      if (sessionId < 1 || sessionId > sessions.length) {
        throw new Error(
          `Session index ${sessionId} is out of range. Available sessions: 1-${sessions.length}`,
        );
      }

      const sessionRef = sessions[sessionId - 1];
      if (!sessionRef) {
        throw new Error(`Session at index ${sessionId} not found`);
      }
      actualSessionId =
        typeof sessionRef === "string" ? sessionRef : sessionRef.id || "";
    }

    const sessionDetails = await this.http.get(
      `/v2/agents/sessions/${actualSessionId}`,
    );
    this.agentState.session_id = actualSessionId;
    this.agentState.session_details = sessionDetails;

    // We need to update the task details if the session has tasks
    if (sessionDetails.tasks && sessionDetails.tasks.length > 0) {
      const firstTask: TaskType =
        typeof sessionDetails.tasks[0] === "string"
          ? await this.http.get(`/v2/agents/tasks/${sessionDetails.tasks[0]}`)
          : await this.http.get(
              `/v2/agents/tasks/${sessionDetails.tasks[0]?.id}`,
            );
      this.agentState.task_id = firstTask.id;
      this.agentState.task_details = firstTask;
    }

    // Emit session switched event
    const eventData: AgentFactoryEventMap["sessionSwitched"] = {
      newSessionId: actualSessionId,
      agentState: this.agentState,
    };
    if (oldSessionId) {
      eventData.oldSessionId = oldSessionId;
    }
    this.emitEvent("sessionSwitched", eventData);

    if (callback) {
      callback();
    }
  }

  /**
   * Change the agent's current task
   */
  async changeTask(
    taskId: string | number,
    callback?: () => void,
  ): Promise<void> {
    let actualTaskId: string;
    const oldTaskId = this.agentState.task_id;
    console.log("Changing task to:", taskId);

    if (typeof taskId === "string") {
      actualTaskId = taskId;
    } else {
      // taskId is a number, treat as 1-based index
      const tasks = this.agentState.session_details.tasks;
      if (!tasks || tasks.length === 0) {
        throw new Error("No tasks available in current session");
      }
      if (taskId > tasks.length) {
        throw new Error(
          `Task index ${taskId} is out of range. Available tasks: 1-${tasks.length}`,
        );
      }

      const taskRef = tasks[taskId];
      if (!taskRef) {
        throw new Error(`Task at index ${taskId} not found`);
      }
      actualTaskId = typeof taskRef === "string" ? taskRef : taskRef.id || "";
    }

    const taskDetails = await this.http.get(`/v2/agents/tasks/${actualTaskId}`);
    this.agentState.task_id = actualTaskId;
    this.agentState.task_details = taskDetails;

    // Emit task switched event
    const eventData: AgentFactoryEventMap["taskSwitched"] = {
      newTaskId: actualTaskId,
      agentState: this.agentState,
    };
    if (oldTaskId) {
      eventData.oldTaskId = oldTaskId;
    }
    this.emitEvent("taskSwitched", eventData);

    if (callback) {
      callback();
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  /**
   * Update API key
   */
  setApiKey(apiKey: string): void {
    this.http.setAuthToken(apiKey);
  }

  /**
   * Remove API key
   */
  removeApiKey(): void {
    this.http.removeAuthToken();
  }
}
