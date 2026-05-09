// Critic pass — Pass 2 of the two-pass composition.
//
// After the first compose, we send Claude back its own composed prompt and
// ask it to: critique against the gold standard for this archetype, the
// archetype DNA, all 19 hard rules, and the vision findings, then RE-EMIT a
// refined ChatGPT-ready prompt. Real Anthropic best practice for high-quality
// outputs.
//
// Same attachments are re-sent so Claude has the visual context.

import { composePrompt } from './composePrompt.js';

const CRITIC_INSTRUCTION = `
You previously composed the following ChatGPT-ready prompt for this ad. Your task NOW is two-fold:

STEP A — Critique the prompt rigorously. Read it against:
  • The 19 GLOBAL HARD RULES (HR01–HR19) in your system prompt — flag any that are missed or weakly enforced
  • The ARCHETYPE PATTERNS for the target archetype — flag any mandatory_elements missing or forbidden_elements present
  • The matching gold-standard example in your system prompt — flag any major drop in specificity, density, or composition discipline
  • The CRITICAL CLARITY RULE — must restate "DUCTED A/C" prominently, not just include it as a hard rule
  • The attached photos — flag any missed vision-driven palette/composition opportunity
  • Locked components — confirm AS-IS instructions are present and unambiguous
  • Pack-balance / palette-freshness language — must tell ChatGPT to pick fresh colours and fonts per generation
  • Layout specificity — every element should have position + size + treatment, not "small" or "subtle"

STEP B — Re-emit ONE complete refined prompt. Apply every fix from your critique. Keep what worked. Output ONLY the refined prompt — no critique, no preamble, no commentary, no markdown headers, no code fences. Start directly with "You are being given attached image(s):" or "Use the attached image as a strong style reference".

Below is your previous composition to refine. The asset images are re-attached for your reference.

═════════════════════════════════════════════════════════════
PREVIOUS COMPOSITION
═════════════════════════════════════════════════════════════

`;

export async function critiquePromptAndRefine({
  systemPrompt,
  originalUserMessage,
  composedPrompt,
  attachments,
}) {
  // Append the original brief + the previous prompt to the user message so
  // Claude has full context of what was being composed.
  const userMessage =
    CRITIC_INSTRUCTION + composedPrompt +
    '\n\n═════════════════════════════════════════════════════════════\n' +
    'ORIGINAL BRIEF (the inputs you were composing for)\n' +
    '═════════════════════════════════════════════════════════════\n\n' +
    originalUserMessage +
    '\n\nNow output ONLY the refined prompt.';

  return await composePrompt({
    systemPrompt,
    userMessage,
    attachments,
    // Slightly lower thinking budget — critique is more focused than original composition.
    thinkingBudget: 8000,
    maxTokens: 16000,
  });
}
