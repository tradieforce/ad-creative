# Product Direction

> Bray's plain-English direction document. **This is the most current and authoritative source for the product direction.** If anything in `docs/` (the older design phase) contradicts this, follow this document.

---

## Updated Final Software Structure / Product Direction

This is the final structure and direction for the software.

The important thing to understand is that this is **not about changing the underlying data or rebuilding the AI logic from scratch**. The existing system already understands the prompts, archetypes, rules, components, and ad outputs very well.

This direction is more about the **software structure, interface, visibility, and workflow**: how we want to see everything, manage everything, and move through the system internally.

This software is only for us/admins. Clients do **not** access this system, and clients do **not** fill out the onboarding form. We fill out the onboarding form ourselves on behalf of the client.

---

# Main Menu Structure

The software should have these main menu sections:

1. **Archetypes**
2. **Global Rules**
3. **Components**
4. **Onboarding / Clients**
5. **Ad Database**
6. **Master AI Prompt / AI Engine**

---

# 1. Archetypes

The main section of the software should be **Archetypes**.

Under Archetypes, we should be able to expand each archetype card. Each archetype should have a clear, visible structure similar to what was already built in the HTML version.

Each archetype card should include:

## Reference Ad

Each archetype should have a reference ad.

We should be able to upload or change the reference ad for that archetype.

The reference ad is simply the image we upload and want the system to use as the visual reference.

We do **not** need any accent color extraction from the reference ad. The reference ad is just the uploaded visual reference.

## Archetype-Specific Rules

Each archetype should have its own editable rules.

These are rules that apply only to that archetype.

Global rules should not be duplicated here. The archetype should automatically refer to the global rules, but we do not need to see all global rules repeated inside every archetype card.

## Variable Inputs

Each archetype should include its variable input options, such as:

* Headlines
* Subheadlines
* Value stacks
* CTAs
* Badges
* Visual hero options

These are the options Claude can pull from when generating prompts for that archetype.

## Components Available to This Archetype

Each archetype should be able to select which components it has access to.

There should be a complete global component library elsewhere in the app. Each archetype should simply reference that library.

So instead of duplicating component details inside every archetype, the archetype card should let us choose which components from the global library are available for that archetype.

## Funnel Stage

The funnel stage can stay.

Each archetype should still show or store its funnel stage.

## Gold Standard

The gold standard example can stay under each archetype.

This should live inside the archetype card.

## Live Prompt Preview

The live prompt preview is good and should stay.

We should be able to preview what the prompt looks like based on:

* Global rules
* Archetype-specific rules
* Variable inputs
* Selected components
* Funnel stage
* Reference ad
* Gold standard guidance

---

# 2. Global Rules

There should be a main menu section called **Global Rules**.

This is where we can list, edit, and manage all global rules.

Global rules apply across all archetypes.

They should not be duplicated inside each archetype card.

The final prompt should use both:

* Global rules
* Archetype-specific rules

But visually, the global rules should live in one clean place.

---

# 3. Components

There should be a main menu section called **Components**.

This should be a complete global component library.

We want a nice folder structure for all components.

The Components section should allow us to:

* View all components
* Organize components into folders/categories
* Collapse and expand component groups
* Upload/manage components
* Make components available to specific archetypes

Each archetype should be able to select which components it has access to from this global library.

The component details should live globally. The archetype should only reference them.

---

# 4. Onboarding / Clients

The **Onboarding / Clients** section should be one combined section.

This is where we internally onboard a new client.

The client does **not** fill out the onboarding form. We fill it out ourselves based on the client information we have.

Once we complete the onboarding form, it creates a new client in the system.

After a client is created, we should be able to access them from a dropdown or client list.

When we click into a client, we should be able to see everything related to that client in one place.

The client file should include:

## Client Details

* Onboarding form details
* Editable client information
* Uploaded assets
* Team images, if uploaded
* Any other relevant client inputs

## Generated Prompts

For each archetype, we should be able to see the prompt Claude generated for that client.

Each prompt should show:

* Archetype name
* Generated prompt
* Reference ad paired with that prompt
* Components used
* Variable inputs used
* Any important generation notes

## Generated Ads

For each generated ad, we should be able to see:

* Final ChatGPT image output
* Prompt used
* Reference ad used
* Archetype
* Client
* Date created

The goal is that each client file shows the full internal journey:

**Onboarding form → Claude prompt generation → reference ad pairing → ChatGPT image output → final stored ad**

Especially at the beginning, this should be very visible and expanded so we can clearly see what is happening. Later, we may decide to collapse or hide certain pieces, such as reference images, but for now we want the full flow visible.

---

# 5. Remove Old Gating Complexity

We can remove the old gating section because the logic is much simpler now.

All archetype ads should generally be created every time.

The only exception is the **Local Trust** ad.

The Local Trust ad should only be created if at least one of the trust-photo types is uploaded in the onboarding form: **team photos, owner photos, or van/vehicle photos**. Any one of the three is enough.

This does not need an AI decision.

It is just a simple backend condition:

* If team OR owner OR van photos are uploaded, generate the Local Trust ad.
* If none of those are uploaded, do not generate the Local Trust ad.

We do not need a big visible gating UI for this.

The old gating logic and anything like "always files/fires" or complicated conditional controls can be removed.

---

# 6. Ad Database

There should be a main database of every ad that has ever been created.

This is separate from the individual client file, but the data should connect.

The ad database should allow us to see all ads grouped or filtered by:

* Archetype
* Client
* Date created
* Prompt used
* Reference ad used
* Final generated image

This database should make it easy to review all historical ads.

It should also help with diversity, so future prompts and ads do not become too similar to previous ones.

---

# 7. Master AI Prompt / AI Engine

There should be a main menu section for the **Master AI Prompt** or **AI Engine**.

This is where we can view and edit the master instructions that tell Claude what to do.

This master prompt directs Claude on how to:

* Use the onboarding form data
* Apply global rules
* Apply archetype-specific rules
* Select variable inputs
* Select components
* Generate prompts for each archetype
* Ensure diversity
* Avoid repetitive ad concepts
* Decide whether to include the Local Trust ad based on uploaded team images
* Format prompts correctly for ChatGPT Image

This should be editable so we can improve the AI behavior over time.

---

# Simplified Generation Flow

The generation flow should be:

1. Admin configures global rules.
2. Admin configures the component library.
3. Admin configures each archetype.
4. Admin fills out the onboarding form for a client.
5. The onboarding form creates a new client file.
6. The AI engine/master prompt tells Claude what to do.
7. Claude receives the onboarding data.
8. Claude generates a prompt for each archetype.
9. Claude uses:

   * Global rules
   * Archetype-specific rules
   * Available components
   * Variable inputs
   * Funnel stage
   * Client onboarding data
   * Diversity requirements
10. Claude generates the prompts for each archetype for that client.
11. Each generated prompt is paired with the relevant reference ad.
12. The prompt and reference ad are given to ChatGPT Image.
13. ChatGPT Image generates the final ads.
14. Final prompts and final ads are stored under the client file.
15. Final prompts and final ads are also stored in the global ad database.

---

# Prompt / Ad Diversity

We need to make sure the generated ads are not too similar to each other.

Every time a new ad is created, the system should try to create something meaningfully different from previous ads.

This can be handled through prompting, through checking previous ads, or both.

The system should have enough variable inputs and component options for Claude to generate fresh combinations.

Possible diversity logic:

* Claude checks previous prompts for that archetype.
* Claude checks previous ads for that client.
* Claude avoids repeating the same headline, subheadline, CTA, value stack, component combination, or visual structure too often.
* Claude intentionally rotates through different variable inputs and components.
* Claude creates a new prompt that is clearly distinct from past outputs.

The exact method can be decided later, but the important requirement is:

**The system should generate fresh, varied ads and avoid producing ads that are too similar to previous ads.**

---

# Diversity scope (clarification — geographic, not global)

Diversity is **city/postcode based**. It depends on the client's postcode.

We could have the same ad running in Melbourne, Perth, Sydney, and Brisbane. Especially if that ad performs well, we should do that.

Our clients never go outside of a 100 km range from their set address. That means we can run the same ad for clients as long as their service areas don't overlap each other.

For one client check, instead of always regenerating, we could reuse strong-performing ads from clients in non-overlapping geographies. This is a feature, not a duplication problem.

For now, just have the diversity logic visible in the UI as a note. The actual reuse-vs-regenerate logic can be implemented later by the tech guy.

---

# Key Product Decisions

* This is an internal admin tool only.
* Clients do not access the software.
* Clients do not fill out the onboarding form.
* We fill out the onboarding form on behalf of the client.
* Onboarding and client management should be one combined section.
* The onboarding form creates a client file.
* Each client file should show the full journey from onboarding to prompts to reference ads to final generated ads.
* Remove complicated gating.
* The only simple condition is that the Local Trust ad is generated only if team images are uploaded.
* Do not duplicate global rules inside archetypes.
* Reference ads are uploaded manually and can be changed.
* Do not extract accent colors from reference ads.
* Funnel stage stays.
* Gold standard stays under each archetype.
* Live prompt preview stays.
* Components live in a global component library.
* Archetypes select which components they have access to.
* All ads are stored under the relevant client file.
* All ads are also stored in a global ad database.
* Claude is the master AI prompt-generation step.
* ChatGPT Image 2 is the image-generation step.
* The software should make the full workflow visible and easy to inspect.

---

# Important Note

You already have the underlying data, prompt structures, archetypes, components, and ad-generation logic.

This is not a request to change all of that.

The existing work is already producing strong prompts and good ad outputs.

This direction is mainly about the **final software design and user flow**: how we want to visually manage the system, how we want to navigate it, and how we want to see the full process from internal onboarding through to final ad generation.
