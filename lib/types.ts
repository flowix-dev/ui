export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "user" | "admin";
}

export interface WorkflowNode {
  id: number;
  nodeDefinitionId: string;
  name?: string;
  disabled: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  inputs: Record<string, unknown>;
}

export interface WorkflowEdge {
  sourceNodeId: number;
  sourceKey: string;
  targetNodeId: number;
  targetKey: string;
}

export type ExecutionStatus =
  "pending" | "running" | "completed" | "failed" | "cancelled";
export type NodeExecutionStatus =
  "pending" | "running" | "completed" | "failed" | "skipped";

export interface NodeExecution {
  nodeId: number;
  nodeName?: string;
  status: NodeExecutionStatus;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  inputData?: unknown;
  outputData?: unknown;
  error?: string;
  retryCount?: number;
}

export interface WorkflowExecution {
  _id: string;
  workflowId: string;
  triggeredBy:
    | string
    | { _id: string; firstName: string; lastName: string; email: string };
  triggerType: "manual" | "scheduled" | "webhook";
  status: ExecutionStatus;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  error?: string;
  outputData?: unknown;
  nodeExecutions: NodeExecution[];
  workflowSnapshot: {
    name: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface ChatModel {
  id: string;
  name: string;
  provider: "aws-bedrock" | "puter";
  modelId: string;
  description: string;
}

export interface Chat {
  _id: string;
  authorId: string;
  title: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatAttachment {
  name: string;
  type: string;
  size: number;
  s3Key: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  output?: unknown;
  error?: string;
  status: "completed" | "failed";
}

export interface ChatMessage {
  _id: string;
  chatId: string;
  authorId: string;
  role: "user" | "assistant";
  content: string;
  attachments: ChatAttachment[];
  toolCalls: ToolCall[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatFile {
  _id: string;
  chatId: string;
  authorId: string;
  name: string;
  type: string;
  size: number;
  s3Key: string;
  createdAt: string;
}
