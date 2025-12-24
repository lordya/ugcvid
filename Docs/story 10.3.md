# Story 10.3: Dynamic Prompt Injection (The "Brain")

Parent Epic: Epic 10 - The AI Feedback Loop (Performance Analytics)

Description

As a Product Manager,
I want to inject successful script patterns back into the generation prompt,
So that future scripts mimic the structure of winning videos.

Acceptance Criteria

[ ] Context Retrieval: ScriptGenerator service updated to fetch the top 3 videos flagged as is_high_performer for the current user.

[ ] Fallback: If the user has no high performers, use a set of "Global Best Practices" or generic examples.

[ ] Prompt Engineering:

The System Prompt is dynamically constructed.

A new section "LEARNING FROM SUCCESS" is added.

The final_script content of the high performers is inserted as "Few-Shot" examples.

[ ] Instruction: The AI is explicitly instructed: "Analyze the tone and structure of these successful examples from this user, and emulate them for the new product."

Technical Notes

Privacy: Only use the user's own data for their prompts unless we anonymize global data.

Token Limits: Ensure adding these examples doesn't blow the context window (limit to 3 examples max).
