# Gold Standards

8 production-tested prompts. Each was composed by hand (Claude playing Layer 2 manually), submitted to ChatGPT, iterated until the output matched production-ready quality, then captured as JSON.

These are the **training reference** for the Layer 2 system prompt.

## Files

| File | Archetype | Variant |
|---|---|---|
| `A1_energy_bill_hero.json` | A1 | default |
| `A2_speed_guarantee.json` | A2 | (see file) |
| `A3_luxury_premium.json` | A3 | premium |
| `A4_pain_diagram_cold.json` | A4 | diagram |
| `A4_pain_wallet_warm.json` | A4 | wallet |
| `A5_seasonal_pain_summer.json` | A5 | summer |
| `A7_city_massive_sale.json` | A7 | per_week |
| `A10_local_trust.json` | A10 | (see file) |

## Schema

Every gold standard has:

```jsonc
{
  "archetype": "A1",
  "archetype_name": "Energy Bill Hero",
  "variant": "default",
  "funnel_stage": "Cold/Warm",
  "tested_outcome": "Production-ready first pass. Bill-holder hero landed perfectly...",
  "input_context": {
    "client_business_name": "...",
    "city": "Brisbane",
    "brand_focus": "...",
    // ... whatever inputs were used
  },
  "assets_attached": ["A03_reference.png", "..."],
  "composition_choices_that_worked": [
    "Made the bill amount ($842.64) prominently readable...",
    "Set hero photo as middle-aged Australian homeowner..."
  ],
  "full_prompt_used": "<the actual ChatGPT prompt that produced the result>",
  "lessons_for_layer_2": [
    "When the visual hero is a 'person holding X' shot, brief the photo with concrete details...",
    "Make the prop (bill, key object) PROMINENT and READABLE..."
  ]
}
```

## How to use them in the build

### As integration tests
For each gold standard:
1. Construct a fake client with the `input_context` values
2. Run Layer 1 to produce a manifest
3. Run Layer 2 against the manifest entry for this archetype
4. Compare Layer 2's output to the gold standard's `full_prompt_used`
5. Pass = output is similar in shape, structure, instruction set

This isn't byte-equality — Layer 2 will phrase things differently. The test checks structural elements: Are the same hard rules present? Is the layout pattern recognisable? Does it specify the same key elements (palette, hero element, badge, CTA position, brand strip)?

### As worked examples in the system prompt
Embed condensed versions in the Layer 2 system prompt under "Examples". When Layer 2 composes for archetype X, it has the gold standard for X as a reference.

### As QA reference for review
When reviewing Layer 3 outputs, compare against the gold standard's tested outcome. If the output is materially worse, regenerate or recompose.

## How to add new gold standards

When a new archetype is tested with a real client and the output is production-ready:

1. Save the input context, attached assets, full prompt, and outcome as JSON
2. Match the schema above
3. Add to this folder as `A{code}_{variant}.json`
4. Update this README
5. Optionally add a condensed version to the Layer 2 system prompt

Do this whenever an archetype's behaviour is "locked in". Build a library of these over time.

## Important

These are seed examples, not ceilings. Layer 2 should produce outputs that are at least this good — and often better, because Layer 2 sees the actual client photo via vision and can pull palette from it (which the gold standards weren't always able to do).
