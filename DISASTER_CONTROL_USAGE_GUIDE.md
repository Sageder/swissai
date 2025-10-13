# Disaster Control System - Usage Guide

## ✅ What's Been Fixed

### 1. **AI-Powered Contextual Messages** 🤖
The agent now uses AI to generate dynamic, context-aware messages:
- **User Interaction nodes**: AI generates questions based on workflow context, variables, and recent actions
  - Example: Instead of "What is the emergency type?", it might ask "Based on the alert at coordinates (46.5, 7.8) with 3 affected buildings, what type of emergency are you reporting?"
- **Tool Call nodes**: Shows which tool was executed with parameters
- **Condition nodes**: Explains the evaluation with reasoning
- **Decision nodes**: Provides transparent reasoning based on context
- **Data Query nodes**: Shows what data was queried

### 2. **Node Dragging Performance**
- **Optimized with requestAnimationFrame**: Smooth, lag-free dragging
- **Fixed connection bug**: Dragging from input pins no longer attaches nodes to cursor
- **Prevented interference**: Connection creation now properly cancels node dragging

### 3. **Transparent Decision Making**
All AI decisions now include:
- 🔍 **Condition checks** with variable values and reasoning
- 🤖 **AI decisions** with context summary and recommendations
- 📊 **Data queries** showing what was queried
- 🔧 **Tool executions** with parameters

---

## 🤖 AI-Enhanced User Interactions

### How It Works

When a **User Interaction** node executes, the system:

1. **Gathers Context**:
   - All current workflow variables (e.g., location, severity, timestamps)
   - Recent actions from the knowledge base (last 5 entries)
   - Previous tool executions and decisions

2. **Generates Smart Question**:
   - Uses GPT-4o-mini to create a contextual question
   - Incorporates your prompt template as the base instruction
   - Adds relevant context to make the question more specific and helpful

3. **Asks the User**:
   - Displays the AI-generated question in the chat
   - Waits for user response
   - Stores response as `${nodeId}_response` for use in subsequent nodes

### Example Workflow

**Scenario**: Emergency response workflow with location data

```
[Start] → [Data Query: Get location] → [User Interaction] → [If: Check type]
```

**What Happens**:
1. Data Query sets `location = "Blatten, Switzerland (46.5, 7.8)"`
2. User Interaction node has instruction: `"Ask the user what type of emergency this is"`
3. AI considers the location context and generates: `"At Blatten, Switzerland (coordinates 46.5, 7.8), what type of emergency are you reporting?"`
4. User responds: `"Avalanche"`
5. Response stored as `${nodeId}_response = "Avalanche"`

### Benefits

✅ **More Natural**: Questions feel conversational and contextual
✅ **More Helpful**: Users get relevant information in the question itself
✅ **Less Confusion**: Context helps users understand what information is needed
✅ **Fallback Safe**: If AI generation fails, uses your template as-is

---

## 📖 How to Use Condition (If) Nodes

### Automatic Input Detection

**The If node automatically receives the output from the connected node** - no need to manually reference variables!

### Three Evaluation Modes

The If node has **three modes** depending on what you configure:

#### **Mode 1: Auto Mode** (Empty Condition Field)
- Leave both condition and evaluation prompt empty
- Any truthy input → TRUE, empty/falsy → FALSE
- Shows: `[Auto Mode] Input: "value" → TRUE/FALSE`

#### **Mode 2: AI Evaluation** (Has Evaluation Prompt)
- **Use this for intelligent semantic evaluation!**
- Fill in the "Evaluation Prompt" field (below condition)
- AI analyzes if the user's response matches your criteria
- Example: `"true if the user glazes LeBron James"`
- Shows: `[AI Mode] "response" evaluated against "prompt" → TRUE/FALSE`

#### **Mode 3: Simple Text/Variable** (Has Condition, No Prompt)
- Use for exact text matching or variable checks
- Supports: `equals`, `contains`, `greater than`, `${variable}`, etc.
- Shows: `[Text Mode]` or `[Variable Mode]` or `[Numeric Mode]`

### Condition Syntax (Mode 3)

You can use natural language conditions to control TRUE/FALSE branching:

#### **Text Comparisons**

**Exact Match:**
```
Condition: "equals fire"
Input: "fire" → TRUE
Input: "flood" → FALSE
```

**Contains:**
```
Condition: "contains emergency"
Input: "This is an emergency" → TRUE
Input: "All clear" → FALSE
```

**Starts With:**
```
Condition: "starts with yes"
Input: "yes, I agree" → TRUE
Input: "no thanks" → FALSE
```

**Ends With:**
```
Condition: "ends with confirmed"
Input: "order confirmed" → TRUE
Input: "order pending" → FALSE
```

#### **Numeric Comparisons**

**Greater Than:**
```
Condition: "greater than 5"
Input: "10" → TRUE
Input: "3" → FALSE
```

**Less Than:**
```
Condition: "less than 100"
Input: "50" → TRUE
Input: "150" → FALSE
```

#### **Empty Checks**

**Is Empty:**
```
Condition: "is empty"
Input: "" → TRUE
Input: "something" → FALSE
```

**Not Empty:**
```
Condition: "not empty"
Input: "anything" → TRUE
Input: "" → FALSE
```

#### **Direct Comparison (No Keyword)**

```
Condition: "fire"
Input: "fire" → TRUE
Input: "Fire" → TRUE (case-insensitive)
Input: "flood" → FALSE
```

#### **No Condition (Auto-Mode)**

```
Condition: (leave empty)
Input: "anything" → TRUE
Input: "" → FALSE
```

### Example Workflows

**AI Evaluation Example (Your LeBron James Example):**
```
[Start] → [User: "Is LeBron James cool?"] → [If Node]
                                                  ↓
                                    Evaluation Prompt: "true if the user glazes LeBron James"
                                                  ↓
                                         ↓ TRUE              ↓ FALSE
                                    [He's a fan!]      [Not impressed]
```

**User says:** "He's the GOAT! Best player ever!"
**AI evaluates:** `[AI Mode] "He's the GOAT! Best player ever!" evaluated against "true if the user glazes LeBron James" → TRUE`

**Emergency Type Router (Text Mode):**
```
[User: "What type of emergency?"] → [If: "contains fire"]
                                           ↓ TRUE        ↓ FALSE
                                    [Dispatch Fire]  [If: "contains flood"]
```

**Severity Check (Numeric Mode):**
```
[User: "Severity level 1-10?"] → [If: "greater than 7"]
                                        ↓ TRUE              ↓ FALSE
                                  [High Priority]    [Standard Response]
```

**Simple Auto Mode:**
```
[User: "Ready to proceed?"] → [If: (empty)]
                                    ↓ TRUE (any response)    ↓ FALSE (empty)
                              [Continue]                [Wait]
```

---

## 🎯 Complete Workflow Example

### Emergency Response Workflow

```
1. [Start Node]
   ↓
2. [User Interaction: "What is the emergency type?"]
   ↓
3. [If: "contains fire"]
   ↓ TRUE                           ↓ FALSE
4. [Tool Call: DispatchFireTruck]   [If: "contains flood"]
   ↓                                 ↓ TRUE              ↓ FALSE
5. [Decision: Fire response]        [Flood response]    [General response]
   ↓
6. [Data Query: Get nearby fire stations]
   ↓
7. [End]
```

**Chat Output:**
```
Assistant: What is the emergency type?
User: Fire in building
Assistant: 🔍 **Condition Check**: "Fire in building" contains "fire" → TRUE
Assistant: 🔧 Executed tool: **DispatchFireTruck** with parameters: {"location":"current"}
Assistant: 🤖 **AI Decision**: Based on: node-100_response: "Fire in building", I recommend: Deploy fire suppression team immediately
Assistant: 📊 Queried emergency_resources for: nearby fire stations
System: Workflow completed successfully
```

### Multi-Branch Example

```
[User: "Severity 1-10?"] → [If: "greater than 7"]
                                  ↓ TRUE                    ↓ FALSE
                            [High Priority]           [If: "greater than 3"]
                                                      ↓ TRUE        ↓ FALSE
                                                   [Medium]      [Low]
```

---

## 🔧 Node Types Reference

### **Start Node**
- Entry point for workflow
- Initializes execution context

### **User Interaction Node** 🤖
- **Prompt Instruction**: Tell the AI what information to ask for
- **AI-Powered**: The agent uses your instruction + workflow context to generate the actual question
- **How it works**:
  - You provide: `"Ask the user what type of emergency this is"`
  - AI considers: Current workflow variables, recent actions, knowledge base
  - AI generates: A natural, contextual question
- **Output**: Stores user response as `${nodeId}_response`
- **Agent message**: Shows AI-generated question
- **Examples**: 
  - Instruction: `"Ask about emergency type"`
  - Generated: `"What type of emergency are you reporting?"`
  - With context: `"Based on the alert at coordinates (46.5, 7.8), what type of emergency is this?"`

### **If (Condition) Node**
- **Automatic Input**: Receives output from connected node
- **Outputs**: Two handles (TRUE/FALSE)
- **Three Modes**:
  1. **Auto Mode**: Leave both fields empty → truthy/falsy check
  2. **AI Mode**: Fill "Evaluation Prompt" → intelligent semantic evaluation
  3. **Text/Variable Mode**: Fill "Condition" only → pattern matching
- **Condition Field** (Mode 3):
  - `equals X`, `contains X`, `greater than X`, etc.
  - `${variableName}` for variable references
- **Evaluation Prompt Field** (Mode 2):
  - Natural language criteria like "true if the user agrees"
  - AI analyzes sentiment and meaning
- **Agent message**: Shows mode and evaluation reasoning with `[Mode]` indicator

### **Tool Call Node**
- **Tool Name**: Name of the tool to execute
- **Parameters**: JSON parameters for the tool
- **Agent message**: Shows tool execution details

### **Decision Node**
- **Decision Prompt**: Context for the decision
- **Output**: Stores decision as `${nodeId}_decision`
- **Agent message**: Shows reasoning and recommendation

### **Data Query Node**
- **Collection**: Database/source to query
- **Query**: What to search for
- **Agent message**: Shows query details

### **Parallel Node**
- Execute multiple branches simultaneously
- **Branches**: List of node IDs to run in parallel

### **Merge Node**
- Combine parallel branches back together
- Wait for all branches to complete

### **End Node**
- Marks workflow completion
- Shows completion message

---

## 💡 Tips & Best Practices

1. **Name your nodes clearly**: Use descriptive labels like "Ask Emergency Type" instead of "User Interaction"

2. **Write clear instructions**: Tell the AI what to ask, not the exact question
   - ✅ Good: `"Ask the user what type of emergency this is"`
   - ✅ Good: `"Find out how many people are affected"`
   - ❌ Avoid: `"What type of emergency?"` (This is a question, not an instruction)

3. **Use natural language conditions**: Write conditions like "contains fire" or "greater than 5" - no complex syntax needed!

4. **Check the chat**: All reasoning and decisions are explained in real-time with actual input values

5. **Test your workflow**: Use the Execute button to run and verify logic

6. **Connect TRUE/FALSE**: Make sure If nodes have both paths connected for complete logic

7. **Smooth dragging**: Nodes now drag smoothly with optimized performance

8. **Connection vs Drag**: Click and hold on output pins to create connections, click on node body to drag

9. **Case-insensitive**: All text comparisons are case-insensitive, so "Fire" matches "fire"

10. **Chain conditions**: Use multiple If nodes in sequence for complex decision trees

11. **Build context early**: Use Data Query and Tool Call nodes before User Interaction to give the AI more context

---

## 🐛 Troubleshooting

**Q: Agent not asking questions?**
A: Make sure the User Interaction node has a prompt configured in the Properties Panel.

**Q: Condition always evaluating to FALSE?**
A: Check the condition syntax. Use natural language like "contains fire" or "equals yes". The input is automatically received from the connected node.

**Q: How do I check for specific text?**
A: Use conditions like:
- `contains fire` - checks if input contains "fire"
- `equals yes` - checks if input exactly matches "yes"
- `starts with emergency` - checks if input starts with "emergency"

**Q: Can I compare numbers?**
A: Yes! Use `greater than 5` or `less than 100` for numeric comparisons.

**Q: Node dragging feels laggy?**
A: This has been fixed with requestAnimationFrame optimization. Refresh if issues persist.

**Q: Node attached to cursor when creating connection?**
A: This has been fixed - connection creation now properly prevents node dragging.

**Q: How do I see what value the condition received?**
A: Check the chat messages - condition evaluations show the actual input value and reasoning, e.g., `"Fire in building" contains "fire" → TRUE`

---

## 🚀 Next Steps

1. Create a simple workflow with Start → User Interaction → If → End
2. Test the condition evaluation with different user responses
3. Add Tool Call and Decision nodes for more complex logic
4. Use the chat to verify the agent's reasoning at each step

Enjoy building intelligent disaster response workflows! 🎉
