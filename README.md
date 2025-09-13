# Agent Factory SDK

A universal TypeScript SDK for interfacing with the MARCo Health Agent Factory API. This SDK can be used in both Node.js and frontend JavaScript applications.

## Installation

````bash
npm install agent-fact## Function Call Handling

The SDK automatically detects and handles function calls in agent responses. You can control the behavior with auto-execution settings:

```typescript
// Configure auto-execution behavior
agentFactory.autoSwitchTask = true;     // Auto-execute task switching
agentFactory.autoUseSkill = true;       // Auto-execute skill usage
agentFactory.autoSwitchSession = true;  // Auto-execute session switching

// Handle function calls manually
agentFactory.addEventListener('functionCallReceived', async (data) => {
  const { functionCall } = data;

  // Custom logic to approve or decline
  if (shouldApprove(functionCall)) {
    const result = await agentFactory.approveFunctionCall(functionCall);
    console.log('Function executed with result:', result);
  } else {
    agentFactory.declineFunctionCall(functionCall);
    console.log('Function call declined');
  }
});

// Supported function calls:
// - switchTask: { taskIndex: number } or { taskId: string }
// - switchSession: { sessionIndex: number } or { sessionId: string }
// - useSkill: { skillId: string, message: string }
````

## Error Handling

```typescript
try {
  const agent = await agentFactory.getAgentDetails("invalid-id");
} catch (error) {
  console.error("API Error:", error.message);
  // Handle error appropriately
}
```

## Usage

### Basic Set// Listen for skill calls

agentFactory.addEventListener('skillCalled', (data) => {
console.log('Skill called:', data.skillId, 'with message:', data.message);
});

// Listen for function calls in responses
agentFactory.addEventListener('functionCallReceived', (data) => {
console.log('Function call received:', data.functionCall.name);
console.log('Arguments:', data.functionCall.args);
});

// Listen for function call approvals
agentFactory.addEventListener('functionCallApproved', (data) => {
console.log('Function call approved:', data.functionCall.name);
});

// Listen for function call executions
agentFactory.addEventListener('functionCallExecuted', (data) => {
console.log('Function executed:', data.functionCall.name);
console.log('Result:', data.result);
});

// Listen for conversation updates
agentFactory.addEventListener('conversationHistoryUpdated', (data) => {
console.log('Conversation updated, messages:', data.history.length);
});```typescript
import { AgentFactoryHandler } from "agent-factory-sdk";

// Initialize the SDK
const agentFactory = new AgentFactoryHandler("your-api-key", {
baseUrl: "https://your-api-endpoint.com", // optional
timeout: 10000, // optional, default 10 seconds
debug: true, // optional, enables request/response logging
});

````

### Chat Functionality

```typescript
### Enhanced Chat Functionality

```typescript
// Initialize agent state first
await agentFactory.initializeAgentState('agent-123');

// Test chat with automatic function call handling
const response = await agentFactory.testChat('Hello, can you help me switch to task 2?');

// Test skill with specific skill ID
const skillResponse = await agentFactory.testSkill('Analyze this data', 'skill-456');

// Get conversation history
const history = agentFactory.getConversationHistory();
console.log('Conversation history:', history);

// Clear conversation history
agentFactory.clearConversationHistory();

// Control auto behaviors
agentFactory.autoSwitchTask = true;  // Auto-execute task switching function calls
agentFactory.autoUseSkill = true;   // Auto-execute skill usage function calls
agentFactory.autoSwitchSession = true; // Auto-execute session switching function calls

// Manual function call approval/decline
agentFactory.addEventListener('functionCallReceived', async (data) => {
  const { functionCall } = data;

  // Approve function call manually
  if (functionCall.name === 'switchTask') {
    await agentFactory.approveFunctionCall(functionCall);
  } else {
    // Decline function call
    agentFactory.declineFunctionCall(functionCall);
  }
});

// Send follow-up messages
await agentFactory.sendFollowUpMessage('Thanks for switching the task!');
````

````

### Agent Management

```typescript
// Create a new agent
const newAgent = await agentFactory.createAgent({
  name: "My Assistant",
  description: "A helpful AI assistant",
  system_instructions: "You are a knowledgeable assistant",
  role: "assistant",
});

// Get agent details
const agent = await agentFactory.getAgentDetails("agent-123");

// Update an agent
const updatedAgent = await agentFactory.updateAgent("agent-123", {
  description: "Updated description",
});

// List all agents
const { agents, nextPageQuery } = await agentFactory.getAllAgents({
  max_results: 10,
  created_by: "user-123",
});

// Delete an agent
await agentFactory.deleteAgent("agent-123");
````

### Tools Management

```typescript
// Create a new tool
const tool = await agentFactory.createTool({
  name: "calculator",
  description: "Performs mathematical calculations",
  parameters: {
    type: "object",
    properties: {
      expression: { type: "string" },
    },
  },
  required: ["expression"],
});

// Get all tools
const tools = await agentFactory.getTools();

// Update a tool
const updatedTool = await agentFactory.updateTool("tool-123", {
  description: "Updated calculator tool",
});

// Delete a tool
await agentFactory.deleteTool("tool-123");
```

### Skills Management

```typescript
// Create a new skill
const skill = await agentFactory.createSkill({
  skill_name: "Problem Solving",
  skill_description: "Ability to analyze and solve complex problems",
  system_instructions: "Break down problems into smaller parts",
});

// Get all skills
const skills = await agentFactory.getSkills();

// Update a skill
const updatedSkill = await agentFactory.updateSkill("skill-123", {
  skill_description: "Enhanced problem solving capabilities",
});
```

### Sessions and Tasks

```typescript
// Create a session
const session = await agentFactory.createSession({
  session_name: "Learning Session",
  session_description: "Educational conversation session",
  system_instructions: "Guide the user through learning activities",
});

// Create a task
const task = await agentFactory.createTask({
  task_name: "Math Tutorial",
  task_description: "Help user learn basic mathematics",
  system_instructions: "Explain mathematical concepts clearly",
});

// Add task to session
await agentFactory.addTaskToSession(session.id, { taskId: task.id });

// Add skill to task
await agentFactory.addSkillToTask(task.id, { skillId: "skill-123" });
```

### State Management

```typescript
// Get current agent state
const currentState = agentFactory.getAgentState();

// Update agent state
agentFactory.updateAgentState({
  agent_id: "agent-123",
  session_id: "session-456",
});

// Set specific IDs
agentFactory.setAgentId("agent-123");
agentFactory.setSessionId("session-456");
agentFactory.setTaskId("task-789");
```

### Testing Methods

```typescript
// Test chat functionality
const chatResponse = await agentFactory.testChat("Hello", [
  { role: "user", content: "Previous message" },
  { role: "assistant", content: "Previous response" },
]);

// Test specific skill
const skillResponse = await agentFactory.testSkill(
  "Solve this math problem: 2 + 2 = ?",
  "skill-123",
  [],
);
```

## Error Handling

```typescript
try {
  const agent = await agentFactory.getAgentDetails("invalid-id");
} catch (error) {
  console.error("API Error:", error.message);
  // Handle error appropriately
}
```

## Event System

The SDK provides a comprehensive event system that allows you to listen for various events during agent operations:

```typescript
// Listen for agent state initialization
agentFactory.addEventListener("agentStateInitialized", (data) => {
  console.log("Agent state initialized:", data.agentState);
});

// Listen for initialization errors
agentFactory.addEventListener("agentStateInitializedError", (data) => {
  console.error(
    "Failed to initialize agent:",
    data.error,
    "for agent:",
    data.agentId,
  );
});

// Listen for messages being sent
agentFactory.addEventListener("messageSent", (data) => {
  console.log("Message sent:", data.message);
  console.log("Current agent state:", data.agentState);
});

// Listen for responses received
agentFactory.addEventListener("messageReceived", (data) => {
  console.log("Response received:", data.response);
  console.log("Original message:", data.message);
});

// Listen for task switches
agentFactory.addEventListener("taskSwitched", (data) => {
  console.log("Task switched from:", data.oldTaskId, "to:", data.newTaskId);
  console.log("New agent state:", data.agentState);
});

// Listen for session switches
agentFactory.addEventListener("sessionSwitched", (data) => {
  console.log(
    "Session switched from:",
    data.oldSessionId,
    "to:",
    data.newSessionId,
  );
});

// Listen for skill calls
agentFactory.addEventListener("skillCalled", (data) => {
  console.log("Skill called:", data.skillId, "with message:", data.message);
});

// One-time event listeners
agentFactory.addEventListenerOnce("agentStateInitialized", (data) => {
  console.log("Agent initialized for the first time");
});

// Remove event listeners
const handler = (data) => console.log("Message sent:", data.message);
agentFactory.addEventListener("messageSent", handler);
agentFactory.removeEventListener("messageSent", handler);

// Remove all listeners for an event
agentFactory.removeAllListeners("messageSent");

// Remove all listeners
agentFactory.removeAllListeners();
```

### Available Events

- **`agentStateInitialized`**: Emitted when agent state is successfully initialized
- **`agentStateInitializedError`**: Emitted when agent state initialization fails
- **`messageSent`**: Emitted when a message is sent to the agent
- **`messageReceived`**: Emitted when a response is received from the agent
- **`taskSwitched`**: Emitted when the current task changes
- **`sessionSwitched`**: Emitted when the current session changes
- **`skillCalled`**: Emitted when a specific skill is invoked
- **`functionCallReceived`**: Emitted when a function call is detected in agent response
- **`functionCallApproved`**: Emitted when a function call is approved for execution
- **`functionCallDeclined`**: Emitted when a function call is declined
- **`functionCallExecuted`**: Emitted when a function call has been executed
- **`conversationHistoryUpdated`**: Emitted when the conversation history changes

## API Key Management

```typescript
// Update API key
agentFactory.setApiKey("new-api-key");

// Remove API key
agentFactory.removeApiKey();
```

## TypeScript Support

The SDK is written in TypeScript and provides full type definitions for all methods and interfaces:

```typescript
import type {
  AgentType,
  AgentToolType,
  SkillType,
  SessionType,
  TaskType,
  ChatMessage,
  ChatSession,
} from "agent-factory-sdk";
```

## Node.js vs Frontend Usage

This SDK works in both Node.js and browser environments. The HTTP client is built on Axios and handles cross-platform compatibility automatically.

### Node.js Example

```javascript
const { AgentFactoryHandler } = require("agent-factory-sdk");

const agentFactory = new AgentFactoryHandler(process.env.AGENT_FACTORY_API_KEY);
```

### Frontend Example

```javascript
import { AgentFactoryHandler } from "agent-factory-sdk";

const agentFactory = new AgentFactoryHandler(
  localStorage.getItem("apiKey") || "your-api-key",
);
```
