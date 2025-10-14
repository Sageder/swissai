import { GraphNode, NodeConnection, ExecutionContext, ChatMessage, KnowledgeEntry, ExecutionHistoryEntry } from '@/types/disaster-control';

export class ExecutionEngine {
  private nodes: GraphNode[];
  private connections: NodeConnection[];
  private onNodeUpdate: (nodeId: string, status: GraphNode['status']) => void;
  private onContextUpdate: (context: ExecutionContext) => void;
  private onMessage: (message: ChatMessage) => void;
  private onWaitForUser: (nodeId: string, prompt: string) => void;
  private context: ExecutionContext;

  constructor(
    nodes: GraphNode[],
    connections: NodeConnection[],
    onNodeUpdate: (nodeId: string, status: GraphNode['status']) => void,
    onContextUpdate: (context: ExecutionContext) => void,
    onMessage: (message: ChatMessage) => void,
    onWaitForUser: (nodeId: string, prompt: string) => void
  ) {
    this.nodes = nodes || [];
    this.connections = connections || [];
    this.onNodeUpdate = onNodeUpdate;
    this.onContextUpdate = onContextUpdate;
    this.onMessage = onMessage;
    this.onWaitForUser = onWaitForUser;
    this.context = {
      variables: {},
      knowledgeBase: [],
      history: [],
      startTime: new Date(),
      status: 'idle',
    };
  }

  private addToHistory(nodeId: string, nodeType: GraphNode['type'], action: string, status: 'success' | 'error' | 'skipped', output?: any) {
    const entry: ExecutionHistoryEntry = {
      id: `hist-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      nodeId,
      nodeType,
      action,
      status,
      output,
    };
    this.context.history.push(entry);
  }

  private addToKnowledgeBase(nodeId: string, type: KnowledgeEntry['type'], content: any, summary: string) {
    const entry: KnowledgeEntry = {
      id: `kb-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      nodeId,
      type,
      content,
      summary,
    };
    this.context.knowledgeBase.push(entry);
  }

  async executeNode(nodeId: string): Promise<void> {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return;

    this.onNodeUpdate(nodeId, 'running');
    this.onMessage({
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `Executing: ${node.label}`,
      timestamp: new Date(),
    });

    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      switch (node.type) {
        case 'start':
          this.context.variables.startTime = new Date().toISOString();
          this.addToHistory(nodeId, node.type, 'Started workflow', 'success');
          break;

        case 'user-interaction':
          this.onNodeUpdate(nodeId, 'waiting');
          const userPromptInstruction = node.data.prompt || 'Ask the user for input';
          
          // Build context for AI to use when generating the question
          const userInteractionContext = Object.entries(this.context.variables)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
          
          const knowledgeContext = this.context.knowledgeBase
            .slice(-5) // Last 5 entries
            .map(kb => kb.summary)
            .join('\n');
          
          let generatedQuestion: string;
          
          // Log what we're working with
          console.log('User Interaction Node - Instruction:', userPromptInstruction);
          console.log('User Interaction Node - Context:', userInteractionContext);
          console.log('User Interaction Node - Knowledge:', knowledgeContext);
          
          try {
            console.log('Calling API to generate AI question...');
            
            // Call server-side API to generate question
            const response = await fetch('/api/generate-question', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                instruction: userPromptInstruction,
                context: userInteractionContext,
                knowledgeBase: knowledgeContext,
              }),
            });
            
            if (!response.ok) {
              throw new Error(`API returned ${response.status}`);
            }
            
            const data = await response.json();
            generatedQuestion = data.question;
            console.log('AI generated question:', generatedQuestion);
          } catch (error) {
            console.error('Failed to generate AI question - Full error:', error);
            console.error('Error details:', {
              message: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined,
            });
            generatedQuestion = 'Please provide your input.';
          }
          
          this.onMessage({
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: generatedQuestion,
            timestamp: new Date(),
          });
          this.onWaitForUser(nodeId, generatedQuestion);
          return; // Wait for user response

        case 'tool-call':
          const toolName = node.data.toolName || 'unknown';
          const toolParams = node.data.parameters ? JSON.stringify(node.data.parameters) : 'default';
          const toolResult = `🔧 Executed tool: **${toolName}** with parameters: ${toolParams}`;
          
          this.addToKnowledgeBase(nodeId, 'tool-result', toolResult, toolResult);
          this.addToHistory(nodeId, node.type, 'Tool execution', 'success', toolResult);
          this.onMessage({
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: toolResult,
            timestamp: new Date(),
          });
          break;

        case 'if':
          const condition = node.data.condition || '';
          const evaluationPrompt = node.data.evaluationPrompt || '';
          let evalResult: boolean;
          let reasoning: string;
          
          // Get the input value from the connected node
          const incomingConnection = (this.connections || []).find(c => c.targetNodeId === nodeId);
          let inputValue: any = null;
          
          if (incomingConnection) {
            const sourceNodeId = incomingConnection.sourceNodeId;
            const sourceNode = this.nodes.find(n => n.id === sourceNodeId);
            inputValue = this.context.variables[`${sourceNodeId}_response`] || 
                        this.context.variables[`${sourceNodeId}_decision`] ||
                        this.context.variables[`${sourceNodeId}_result`];
          }
          
          // Determine evaluation mode
          let evaluationMode: 'auto' | 'ai-prompt' | 'simple-text' = 'auto';
          
          if (evaluationPrompt && evaluationPrompt.trim() !== '') {
            // Mode 2: AI Evaluation - has evaluation prompt (CHECK THIS FIRST!)
            evaluationMode = 'ai-prompt';
            
            // Simple AI simulation - check if input semantically matches the prompt
            const inputStr = String(inputValue || '').toLowerCase();
            const promptLower = evaluationPrompt.toLowerCase();
            
            // Positive indicators
            const positiveWords = ['yes', 'yeah', 'sure', 'absolutely', 'definitely', 'correct', 'right', 'agree', 'true', 'good', 'great', 'awesome', 'cool', 'amazing', 'love', 'like'];
            const negativeWords = ['no', 'nope', 'never', 'not', 'wrong', 'disagree', 'false', 'bad', 'terrible', 'hate', 'dislike'];
            
            // Check for positive/negative sentiment
            const hasPositive = positiveWords.some(word => inputStr.includes(word));
            const hasNegative = negativeWords.some(word => inputStr.includes(word));
            
            // Determine if condition is asking for positive or negative
            const conditionWantsPositive = promptLower.includes('true if') || promptLower.includes('when') || !promptLower.includes('false if');
            
            if (conditionWantsPositive) {
              evalResult = hasPositive && !hasNegative;
            } else {
              evalResult = hasNegative && !hasPositive;
            }
            
            // If no clear sentiment, check for length/substance
            if (!hasPositive && !hasNegative) {
              evalResult = inputStr.length > 10; // Substantial response = TRUE
            }
            
            reasoning = `[AI Mode] "${inputValue}" evaluated against "${evaluationPrompt}" → ${evalResult ? 'TRUE' : 'FALSE'}`;
          } else if (condition && condition.trim() !== '') {
            // Mode 3: Simple text/variable evaluation
            evaluationMode = 'simple-text';
            const inputStr = String(inputValue || '').toLowerCase();
            const conditionLower = condition.toLowerCase().trim();
            
            // Check if it's a variable reference
            if (condition.includes('${') && condition.includes('}')) {
              const varMatch = condition.match(/\$\{([^}]+)\}/);
              if (varMatch) {
                const varName = varMatch[1];
                const varValue = this.context.variables[varName];
                evalResult = Boolean(varValue);
                reasoning = `[Variable Mode] ${varName} = "${varValue}" → ${evalResult ? 'TRUE' : 'FALSE'}`;
              } else {
                evalResult = false;
                reasoning = `[Variable Mode] Invalid variable syntax → FALSE`;
              }
            } else if (conditionLower.startsWith('equals ')) {
              const target = conditionLower.substring(7).trim();
              evalResult = inputStr === target;
              reasoning = `[Text Mode] "${inputValue}" equals "${target}" → ${evalResult ? 'TRUE' : 'FALSE'}`;
            } else if (conditionLower.startsWith('contains ')) {
              const target = conditionLower.substring(9).trim();
              evalResult = inputStr.includes(target);
              reasoning = `[Text Mode] "${inputValue}" contains "${target}" → ${evalResult ? 'TRUE' : 'FALSE'}`;
            } else if (conditionLower.startsWith('greater than ')) {
              const target = parseFloat(conditionLower.substring(13).trim());
              const inputNum = parseFloat(inputStr);
              evalResult = !isNaN(inputNum) && !isNaN(target) && inputNum > target;
              reasoning = `[Numeric Mode] ${inputValue} > ${target} → ${evalResult ? 'TRUE' : 'FALSE'}`;
            } else if (conditionLower.startsWith('less than ')) {
              const target = parseFloat(conditionLower.substring(10).trim());
              const inputNum = parseFloat(inputStr);
              evalResult = !isNaN(inputNum) && !isNaN(target) && inputNum < target;
              reasoning = `[Numeric Mode] ${inputValue} < ${target} → ${evalResult ? 'TRUE' : 'FALSE'}`;
            } else {
              // Direct comparison
              evalResult = inputStr === conditionLower;
              reasoning = `[Text Mode] "${inputValue}" equals "${condition}" → ${evalResult ? 'TRUE' : 'FALSE'}`;
            }
          } else {
            // Mode 1: Auto mode - empty condition and no evaluation prompt
            evaluationMode = 'auto';
            evalResult = Boolean(inputValue);
            reasoning = `[Auto Mode] Input: "${inputValue}" → ${evalResult ? 'TRUE (truthy)' : 'FALSE (falsy)'}`;
          }
          
          this.context.variables[`${nodeId}_result`] = evalResult;
          this.addToHistory(nodeId, node.type, reasoning, 'success', evalResult);
          this.onMessage({
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: `🔍 **Condition Check**: ${reasoning}`,
            timestamp: new Date(),
          });
          break;

        case 'decision':
          // Analyze context and make a decision
          const decisionContextSummary = Object.entries(this.context.variables)
            .filter(([key]) => key.includes('_response'))
            .map(([key, value]) => `${key}: "${value}"`)
            .join(', ');
          
          const decisionPrompt = node.data.decisionPrompt || 'Analyzing situation...';
          const decision = `Based on: ${decisionContextSummary || 'initial context'}, I recommend: ${decisionPrompt}`;
          
          this.context.variables[`${nodeId}_decision`] = decision;
          this.addToKnowledgeBase(nodeId, 'decision', decision, decision);
          this.addToHistory(nodeId, node.type, 'Made decision', 'success', decision);
          
          this.onMessage({
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: `🤖 **AI Decision**: ${decision}`,
            timestamp: new Date(),
          });
          break;

        case 'data-query':
          const collection = node.data.collection || 'database';
          const query = node.data.query || 'all records';
          const queryResult = `📊 Queried ${collection} for: ${query}`;
          
          this.addToKnowledgeBase(nodeId, 'query-result', queryResult, queryResult);
          this.addToHistory(nodeId, node.type, 'Queried data', 'success', queryResult);
          
          this.onMessage({
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: queryResult,
            timestamp: new Date(),
          });
          break;

        case 'end':
          this.context.status = 'completed';
          this.addToHistory(nodeId, node.type, 'Completed workflow', 'success');
          this.onMessage({
            id: `msg-${Date.now()}`,
            role: 'system',
            content: 'Workflow completed successfully',
            timestamp: new Date(),
          });
          this.onNodeUpdate(nodeId, 'completed');
          this.onContextUpdate(this.context);
          return;

        default:
          this.addToHistory(nodeId, node.type, 'Executed node', 'success');
      }

      this.onNodeUpdate(nodeId, 'completed');
      this.onContextUpdate(this.context);

      // Find and execute next nodes
      const nextConnections = (this.connections || []).filter(c => c.sourceNodeId === nodeId);
      
      if (nextConnections.length > 0) {
        if (node.type === 'if') {
          const evalResult = this.context.variables[`${nodeId}_result`];
          const nextConnection = nextConnections.find(c => 
            c.sourceHandle === (evalResult ? 'true' : 'false')
          ) || nextConnections[0];
          
          if (nextConnection) {
            setTimeout(() => this.executeNode(nextConnection.targetNodeId), 500);
          }
        } else {
          for (const conn of nextConnections) {
            setTimeout(() => this.executeNode(conn.targetNodeId), 500);
          }
        }
      } else {
        this.context.status = 'completed';
        this.onContextUpdate(this.context);
        this.onMessage({
          id: `msg-${Date.now()}`,
          role: 'system',
          content: 'Workflow execution completed',
          timestamp: new Date(),
        });
      }
    } catch (error) {
      this.onNodeUpdate(nodeId, 'error');
      this.context.status = 'error';
      this.context.error = error instanceof Error ? error.message : 'Unknown error';
      this.addToHistory(nodeId, node.type, 'Error during execution', 'error');
      this.onContextUpdate(this.context);
    }
  }

  continueFromUserInput(nodeId: string, userResponse: string) {
    this.addToKnowledgeBase(nodeId, 'user-input', userResponse, `User response: ${userResponse}`);
    this.context.variables[`${nodeId}_response`] = userResponse;
    this.addToHistory(nodeId, 'user-interaction', 'Received user input', 'success', userResponse);
    this.onNodeUpdate(nodeId, 'completed');
    this.onContextUpdate(this.context);

    // Continue with next node
    const nextConnections = (this.connections || []).filter(c => c.sourceNodeId === nodeId);
    if (nextConnections.length > 0) {
      setTimeout(() => this.executeNode(nextConnections[0].targetNodeId), 500);
    } else {
      this.context.status = 'completed';
      this.onContextUpdate(this.context);
    }
  }

  start() {
    const startNode = this.nodes.find(n => n.type === 'start');
    if (!startNode) {
      throw new Error('No start node found');
    }

    this.context = {
      variables: {},
      knowledgeBase: [],
      history: [],
      startTime: new Date(),
      status: 'running',
    };
    this.onContextUpdate(this.context);

    setTimeout(() => this.executeNode(startNode.id), 500);
  }

  pause() {
    this.context.status = 'paused';
    this.onContextUpdate(this.context);
  }

  stop() {
    this.context.status = 'idle';
    this.onContextUpdate(this.context);
  }
}
