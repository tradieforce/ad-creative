# Codex prompt — Tradie Force stock image acquisition (v2, overlay-aware)

> Paste everything from "BEGIN PROMPT" to "END PROMPT" into Codex. v2 overhaul: this version judges every image **first by overlay-readiness for Meta ads**, then by subject correctness. Most v1 images failed because they were busy / centred / had competing products / wrong cultural context — this brief explicitly addresses each failure mode.

---

## BEGIN PROMPT

You are sourcing 27 stock photographs for a marketing agency's internal admin tool. The agency is **Tradie Force**, an Australian marketing company specialising in residential **ducted air conditioning installers**. These images become locked components in the ad-generation system — they will end up as **backdrops or hero elements in Meta (Facebook/Instagram) ads** that have headlines, sub-headlines, value-stack bullets, CTA buttons, brand-logo strips, price pills, and discount badges OVERLAID on top.

This is the most important framing: **you are not finding "good photos" — you are finding photos that will work as a backdrop with text overlaid, viewed at thumbnail size on a phone.**

A previous attempt failed because the briefs prioritised subject (e.g. "bill-holder photo") without specifying composition. The team selected images of busy kitchens, posed-stocky moments, retro-period photoshoots, US voting envelopes, robot vacuum advertisements, and culturally inappropriate imagery (Uluru). Every spec below has been rewritten with overlay-zones explicit.

---

## THE THREE PRIMARY CRITERIA (in priority order)

### 1. OVERLAY-READINESS (most important)

Every image must have:

- **Clear negative space** — at minimum 40% of the canvas should be a clean, simple, low-contrast area where headline + sub-headline + value stack + CTA can sit without competing with subject details.
- **Subject occupies a third of the frame, not the centre** — rule-of-thirds composition. Subject hugs the left third or right third, leaving 2/3 of the canvas clean for overlays. Centred subjects ALMOST ALWAYS fail because text has nowhere to go.
- **Simple background** — plain wall, blurred bokeh, sky, sand, blurred interior, dark void. NO BUSY backgrounds: no shelves with stuff, no patterned wallpaper, no cluttered worktops, no multiple paintings, no geometric patterns, no busy foliage.
- **High background contrast against subject, low background contrast within itself** — so when text is dropped onto the negative-space area, it reads. A photo with bright sky behind person = great (text on sky reads fine). A photo with cluttered shelves behind person = useless (text fights every detail).

### 2. SINGLE CLEAR MOOD AT THUMBNAIL SIZE

Every image must communicate ONE thing in a half-second glance, viewed at 200px wide on a phone scroll:

- "concerned about bill" — not "person holding paper, smiling, also there's a kettle"
- "sweating, hot" — not "woman taking selfie with cat by a window"
- "cosy evening" — not "1970s retro period photoshoot with magazine"
- "modern Australian home" — not "American Midwest farm field"

Stocky-posed = fail. Cluttered = fail. Multiple subjects fighting for attention = fail. Period costume = fail. Off-emotion = fail.

### 3. SUBJECT CORRECTNESS

Subject must match the spec: right person/object, right action, right context. This is the LAST criterion — a perfect subject in a bad composition is unusable. A good composition with the right mood gets us most of the way; a perfect subject in clutter gets us nowhere.

---

## HARD DISQUALIFIERS (auto-reject)

Reject ANY image with:

1. **Tradesmen, installers, work vehicles, team/owner photos, or anyone in trades-uniform.** None of these are in this list. They must come from the client's own photos in production. Reject any search result featuring a tradesperson.
2. **AI-generated faces** — waxy skin, weird eyes, inconsistent hands. Real photographic stock only.
3. **Watermarks** — never save watermarked previews.
4. **Wrong cultural context** — Uluru and any sacred Aboriginal site, religious imagery (crosses for Easter), Middle Eastern / South Asian / European-specific costuming or interiors when the brief says Australian. We're advertising to Australian homeowners; the photo must read as Australian or universally Western-contemporary.
5. **Wrong era** — period costume, retro photoshoots, 1970s-1990s stock-photo aesthetic. Must read as contemporary.
6. **Competing products** — robot vacuums, kitchen appliances dominating the frame, smart speakers as hero elements, branded products other than what's specified. The image must not advertise something else.
7. **US documents / US currency** — no voting ballots, no IRS forms, no US-format bills with US currency. Australian or generic only.
8. **Subject in centre of frame with cluttered background** — even if subject is perfect, this composition is useless.
9. **Loud patterned walls / floors / wallpapers** — geometric, abstract, or themed prints behind the subject. Text overlaid on these is illegible.
10. **Wrong emotion** — if the spec says "concerned/frustrated", an image of someone smiling fails. The emotion must be unmistakable at thumbnail size.

---

## QUALITY BAR

- Minimum resolution **1500×1500**, target 2500×2500+
- Royalty-free for commercial use (Unsplash, Pexels, Pixabay, Adobe Stock free tier)
- JPEG, PNG, or WebP
- Lowercase filenames matching the spec exactly (underscores, not hyphens)

---

## PROJECT PATHS

Project root:
```
/Users/braychapman/Desktop/Ad Creative Tool/tradie-force-admin
```

Folders:
```
assets/components/bill-finance/         (5 files)
assets/components/stock-family/         (7 files)
assets/components/stock-reaction/       (5 files)
assets/components/holiday-backdrops/    (6 files)
assets/components/outdoor-backdrops/    (4 files)
```

If a folder doesn't exist, create it. Save each image at `assets/components/{folder}/{key}.{ext}`.

---

## PER-IMAGE SPECS

Each spec has the same structure:

```
N. KEY (folder)
   COMPOSITION & OVERLAY ZONES: (the most important section — where subject sits, where overlays go, what the negative space is)
   SUBJECT:
   MOOD AT THUMBNAIL:
   LIGHTING:
   DIMENSIONS:
   SOURCES (in order):
   SEARCH TERMS:
   AUTO-REJECT IF:
```

After saving each image, log: filename, source URL, search term, resolution, and how it scores against the three criteria.

---

### CATEGORY 1 — Stock bill / finance (5 images)

Used in **A1 Energy Bill Hero** ("DUCTED A/C THAT PAYS FOR ITSELF" + bill-holder hero + per-week price pill) and **A4 Problem/Solution Urgency** ("DREADING YOUR NEXT POWER BILL?" + wallet hero + WAS/NOW price). Both archetypes use the bill/wallet/finance image as the hero on one side, with text + price on the other.

#### 1. `bill_holder_man`
- **Composition & overlay zones:** Subject occupies LEFT THIRD or RIGHT THIRD, NOT centre. Holding a bill in front of him at chest height. Bill should be visible and readable but NOT the centre of frame. Two-thirds of the canvas is plain wall, soft daylight, or out-of-focus modern home interior — clean for headline + value stack overlay. Background must read as ONE colour at thumbnail (light grey, off-white, beige) — no shelves, no kettle, no fruit, no decor visible.
- **Subject:** Australian-looking man, 35-55, holding a paper electricity bill. Expression mildly concerned, brow slightly furrowed. NOT smiling, NOT happy, NOT exaggerated panic. The look of "I just opened this and I'm doing maths in my head".
- **Mood at thumbnail:** "Worried about a bill."
- **Lighting:** Natural daylight from a window, soft. Not warm-evening, not harsh.
- **Dimensions:** Min 2500×2000 px, horizontal preferred (wider canvas = more overlay space).
- **Sources:** Unsplash → Pexels → Adobe Stock free.
- **Search terms:** "man worried about bill", "homeowner reading bill concerned", "man electricity bill thoughtful", "bill holder concerned natural light"
- **Auto-reject if:** smiling, cluttered kitchen background, sunflower stickers / decor visible, business suit, US currency, dated/90s look, AI face, centred composition with no overlay space.

#### 2. `bill_holder_woman`
- **Composition & overlay zones:** Same as #1 but female subject. Should pair compositionally with `bill_holder_man` (similar lighting, similar third-of-frame placement, similar background simplicity). If man sat in left third, woman should sit in right third, or vice versa, so the pair works as a matched set.
- **Subject:** Australian-looking woman, 35-55, holding a paper electricity bill. Expression concerned/thoughtful.
- **Mood at thumbnail:** "Worried about a bill."
- **Lighting:** Natural daylight, soft.
- **Dimensions:** Min 2500×2000 px.
- **Sources:** Unsplash → Pexels → Adobe Stock free.
- **Search terms:** "woman bill concerned", "woman reading bill kitchen natural light", "homeowner woman bill stress soft light"
- **Auto-reject if:** sideways gaze with no bill in frame (the v1 reject), holding a phone instead of a bill, cluttered kitchen, smiling, AI face.

#### 3. `wallet_coins`
- **Composition & overlay zones:** Wallet sits in the LOWER THIRD or LEFT THIRD of frame. Top half/right half is dark moody negative space — perfect for headline overlay. **NO PEOPLE.** Coins should be SCATTERED or in motion (mid-air or freshly fallen), conveying "money slipping out", not sitting passively inside the wallet.
- **Subject:** Worn leather wallet, open, with coins scattered around it on a dark surface (wood, slate, dark fabric). Coins SCATTERED, not stacked.
- **Mood at thumbnail:** "Money slipping away."
- **Lighting:** Dramatic side-lighting from one direction. Slightly desaturated. Photoreal, cinematic.
- **Dimensions:** Min 2000×2000 px, square or horizontal.
- **Sources:** Unsplash → Pexels → Pixabay.
- **Search terms:** "wallet coins falling dramatic", "empty wallet scattered coins moody", "spilled coins wallet dark", "wallet money loss cinematic dark"
- **Auto-reject if:** coins inside the wallet (need them OUT/scattered), bright cheerful lighting, US dollars in frame, brand logos visible on wallet, people in frame, cluttered tabletop.

#### 4. `savings_graph`
- **Composition & overlay zones:** Object centred or off-centre in lower half. Top half is plain bright background (white, cream, soft blue) — ample headline space.
- **Subject:** A real bill or stack of bills with a hand-drawn or graphic DOWNWARD ARROW overlaid showing savings. OR: a calculator next to a bill with "lower number" handwritten. OR: a piggy bank with coins beside a bill. **The subject MUST include a bill or money element** — NOT just a chart on its own. Bright optimistic palette (cool white, soft blue, mint).
- **Mood at thumbnail:** "Saving money — winning."
- **Lighting:** Bright clean studio lighting on a clean backdrop.
- **Dimensions:** Min 2000×2000 px.
- **Sources:** Unsplash → Pexels → Pixabay.
- **Search terms:** "bills decreasing arrow savings", "calculator bill savings clean studio", "piggy bank savings clean white", "saving money concept bright"
- **Auto-reject if:** aggressive RED downward arrow (reads as crash/loss, not savings — must be cool tone or green), abstract chart with no money/bill context, dark moody mood, busy props.

#### 5. `bill_shock_red`
- **Composition & overlay zones:** Bill takes 50-60% of frame, hands holding it visible at edge. Negative space (dark or red-toned) on top half for headline overlay.
- **Subject:** A real-looking electricity bill (Australian-format or generic, NOT US ballot/voting/document) with red elements — red highlight on a dollar amount, red "OVERDUE" stamp, red exclamation mark stamped on it, OR hands holding the bill with a red colour-cast/lighting. Visceral pain visual.
- **Mood at thumbnail:** "Bill shock — urgent."
- **Lighting:** Dark, urgent, red-leaning palette. High-contrast.
- **Dimensions:** Min 2000×2000 px.
- **Sources:** Unsplash → Pexels → Pixabay.
- **Search terms:** "overdue bill red stamp", "bill shock red urgent", "electricity bill warning red", "final notice bill red"
- **Auto-reject if:** US voting ballot (the v1 disaster), US currency / IRS forms, cheerful palette, low-resolution, watermarks. **MUST be a utility/electricity-style bill, not any other paperwork.**

---

### CATEGORY 2 — Stock family lifestyle (7 images)

Used in **A2 Speed Guarantee** (family + offer block layout) and **A3 Luxury Lifestyle** (text-left / photo-right two-half layout). The photo sits on one side of the canvas with text on the other side. Overlay zones are CRITICAL.

#### 6. `fam_couple_laptop`
- **Composition & overlay zones:** Couple in LEFT THIRD or RIGHT THIRD with body angled toward laptop. The other 2/3 is clean modern wall, blurred kitchen, or simple living room. NO paintings on the wall, NO ornate decor.
- **Subject:** Couple (30-45), modern Australian-feel, sitting at kitchen island or on couch, looking at a laptop together. Candid mid-research moment. Both engaged with laptop, not posing for camera.
- **Mood at thumbnail:** "Couple researching at home."
- **Lighting:** Bright daylight, mid-morning, cool whites.
- **Dimensions:** Min 2500×1800 px, horizontal.
- **Sources:** Unsplash → Pexels.
- **Search terms:** "couple laptop kitchen island modern home", "couple researching home daylight modern minimalist", "couple home laptop simple background"
- **Auto-reject if:** subject in dead centre, busy wall behind (paintings, framed art), staircase visible, English/American traditional decor, woman smiling at camera (= stocky), period costume.

#### 7. `fam_couple_evening`
- **Composition & overlay zones:** Couple in LEFT or RIGHT third on a couch. Background is a plain warm-lit wall — NO retro wallpaper, NO ornate furniture, NO geometric prints. Simple modern minimalist living room. Negative space on the opposite side for overlay.
- **Subject:** Couple (30-50), modern Australian-feel, on a contemporary couch, evening warm light. Premium / quiet luxury energy. Casual contemporary clothing — NO 1970s costumes.
- **Mood at thumbnail:** "Cosy modern evening at home."
- **Lighting:** Warm golden-hour or low warm interior. Not overly orange/sepia.
- **Dimensions:** Min 2500×1800 px.
- **Sources:** Unsplash → Pexels → Adobe Stock free.
- **Search terms:** "couple modern couch evening warm minimalist", "couple home cosy evening neutral palette", "modern couple living room evening contemporary"
- **Auto-reject if:** retro/period setting, 1970s-90s aesthetic, LIFE magazine / vintage props, loud geometric wallpaper, cluttered shelves.

#### 8. `fam_dinner_table`
- **Composition & overlay zones:** Family fills middle horizontal band of frame. Top third is plain wall or ceiling. Bottom third is table surface. Both top and bottom available for overlay. Modern dining setting.
- **Subject:** Family of 3-5 (parents + kids), modern Australian-feel, candid mid-meal moment in a contemporary dining area. NOT staged-perfect.
- **Mood at thumbnail:** "Family at dinner — modern home."
- **Lighting:** Warm interior evening or bright daylight — either works as long as it reads contemporary.
- **Dimensions:** Min 2500×1800 px.
- **Sources:** Unsplash → Pexels.
- **Search terms:** "modern family dinner table candid contemporary", "family eating home modern open plan", "australian family meal candid"
- **Auto-reject if:** 1990s-aesthetic stock photo (the v1 reject), low resolution, religious meal context, themed Christmas-specific.

#### 9. `fam_kids_playing`
- **Composition & overlay zones:** Kids occupy LEFT or RIGHT half. Other half = plain wall or simple room. **NO loud geometric / multi-coloured walls** (the v1 reject). Wall must be plain so headline reads on it.
- **Subject:** Kids (5-10) playing in a contemporary living room. Casual lifestyle, energetic but not staged.
- **Mood at thumbnail:** "Family-friendly home, energetic."
- **Lighting:** Bright cheerful daylight.
- **Dimensions:** Min 2500×1800 px.
- **Sources:** Unsplash → Pexels.
- **Search terms:** "kids playing modern living room plain wall", "children home contemporary minimalist", "kids candid living room bright neutral"
- **Auto-reject if:** loud patterned walls, themed studio shot, AI-generated kids, cheesy stock smile-to-camera, school setting, outdoor.

#### 10. `fam_couple_reading`
- **Composition & overlay zones:** Couple in LEFT or RIGHT third on couch, reading. Other 2/3 is plain wall or premium room with single accent (one piece of art OK; no clutter). Premium minimalist. Negative space on the opposite side for overlay.
- **Subject:** Couple (30-50), modern Australian-feel, on a couch, one reading a book. Quiet luxury / refined energy.
- **Mood at thumbnail:** "Refined, calm, premium home."
- **Lighting:** Soft warm interior light. Premium not bargain.
- **Dimensions:** Min 2500×1800 px.
- **Sources:** Unsplash → Pexels.
- **Search terms:** "couple reading premium minimalist couch", "couple home refined contemporary reading", "elegant couple reading home neutral"
- **Auto-reject if:** loud geometric walls (v1 reject — same studio as kids_playing), cluttered shelves, fluorescent lighting, dated.

#### 11. `fam_mum_kitchen`
- **Composition & overlay zones:** Mum + child in LEFT or RIGHT half. Other half = clean modern kitchen backsplash or pantry — minimal clutter on worktops. Mid-section of canvas is the focal point; top and bottom thirds available for overlay.
- **Subject:** Mum (30-45) with toddler in a modern Australian open-plan kitchen. Casual moment.
- **Mood at thumbnail:** "Modern Australian family kitchen moment."
- **Lighting:** Bright kitchen daylight.
- **Dimensions:** Min 2500×1800 px.
- **Sources:** Unsplash → Pexels.
- **Search terms:** "mum toddler modern australian kitchen", "mother child kitchen contemporary minimalist", "mum kid modern open plan kitchen"
- **Auto-reject if:** dated kitchen, cluttered worktops with appliances/jars/dishes, Latin American/southern European tile look, posed-stocky.

#### 12. `fam_dog_lounge`
- **Composition & overlay zones:** People + dog in LEFT or RIGHT third. Other 2/3 is plain modern lounge — wall, simple curtain, large window. **NO competing products in frame** (the v1 reject was a robot vacuum ad).
- **Subject:** Family or couple with a dog in modern Australian lounge. Relaxed, warm.
- **Mood at thumbnail:** "Comfortable family lounge with pet."
- **Lighting:** Bright/warm daylight.
- **Dimensions:** Min 2500×1800 px.
- **Sources:** Unsplash → Pexels.
- **Search terms:** "family dog modern lounge minimalist", "couple pet dog home contemporary plain", "family with dog living room modern home"
- **Auto-reject if:** robot vacuum / smart speaker / branded product visible, outdoor settings, staged stock-perfect.

---

### CATEGORY 3 — Stock reaction (5 images)

Used in **A5 Seasonal Pain** (reaction model takes left half edge-to-edge, hot/cool palette overlay) and **A6 Seasonal Sale Event** (reaction + condenser + discount badge). Reaction photos are the visceral hook of seasonal-pain ads.

#### 13. `react_sweating_woman`
- **Composition & overlay zones:** Subject occupies LEFT THIRD or LEFT HALF — designed to fill the left side of an A5-style ad. Right 2/3 is plain wall, fan in background, or window with hot daylight bleed — clean for "DON'T MELT" / value stack / price overlay.
- **Subject:** Woman (any adult age — variety preferred, older works too) actively fanning herself with hand or paper, OR wiping forehead with tissue, OR holding hand to forehead grimacing. Indoor home setting (not gym, not outdoor sport). Visible discomfort.
- **Mood at thumbnail:** "Hot, uncomfortable at home."
- **Lighting:** Warm/orange daylight bleed, slightly oversaturated warm tones.
- **Dimensions:** Min 2000×2500 px (vertical preferred — fills left half of square ad).
- **Sources:** Unsplash → Pexels.
- **Search terms:** "woman fanning hot indoor", "woman wiping forehead heat home", "woman heat exhaustion indoor uncomfortable", "woman summer hot home"
- **Auto-reject if:** taking selfie / smiling / not visibly hot (v1 reject — woman with cat), gym/exercise context, outdoor athletic, AI face, cluttered foreground (plant fronds blocking face = v1 reject).

#### 14. `react_couple_freezing`
- **Composition & overlay zones:** Couple LEFT THIRD or LEFT HALF. Right side clean for overlay.
- **Subject:** Couple bundled in blankets / winter clothing on a couch, **faces visible**, looking visibly cold/uncomfortable. NOT romantic / cosy — uncomfortable.
- **Mood at thumbnail:** "Couple freezing in their home."
- **Lighting:** Cool blue-leaning palette. Indoor winter feel.
- **Dimensions:** Min 2000×2500 px (vertical).
- **Sources:** Unsplash → Pexels.
- **Search terms:** "couple bundled blanket cold uncomfortable home", "couple winter freezing living room", "couple shivering indoor blankets"
- **Auto-reject if:** just hands under blanket with no faces (v1 reject), romantic-cosy mood, outdoor camping / ski.

#### 15. `react_frustrated_bill`
- **Composition & overlay zones:** Subject LEFT THIRD or LEFT HALF, holding/looking at paper. Other side clean for overlay.
- **Subject:** Person (35-55) reacting to a bill in hand — hand on forehead, tense expression, OR shocked-looking-down-at-paper. The REACTION moment, not just holding (this is what makes it different from `bill_holder_man/woman`).
- **Mood at thumbnail:** "Bill shock reaction."
- **Lighting:** Indoor daytime. Slightly red/concern tones acceptable.
- **Dimensions:** Min 2000×2500 px (vertical).
- **Sources:** Unsplash → Pexels.
- **Search terms:** "homeowner shocked bill hand forehead", "person stressed bill reaction", "bill shock reaction home"
- **Auto-reject if:** office/corporate setting, AI face, smiling/posed, no bill visible.

#### 16. `react_elderly_cold`
- **Composition & overlay zones:** Subject LEFT THIRD or LEFT HALF. Right clean for overlay.
- **Subject:** Elderly Australian-looking person (65+) in winter clothing inside a contemporary Australian home, looking uncomfortably cold. NOT culturally specific (no head-wraps, no ornate non-Western blankets — the v1 reject was Middle Eastern).
- **Mood at thumbnail:** "Elderly person cold at home — sympathetic."
- **Lighting:** Cool blue tones, indoor winter feel.
- **Dimensions:** Min 2000×2500 px.
- **Sources:** Unsplash → Pexels.
- **Search terms:** "elderly woman cold home blanket australian", "senior person cold indoor neutral", "elderly cold home contemporary"
- **Auto-reject if:** cultural/religious head-coverings, ornate ethnic blankets, terracotta/Middle-Eastern interiors, hospital/clinical, outdoor.

#### 17. `react_thumbs_up_summer`
- **Composition & overlay zones:** Subject in LEFT or RIGHT THIRD with thumbs-up gesture clearly visible. **Face must be in focus, NOT the v1 dark-moody close-up where face was blurred.** Bright clean negative space on the opposite side.
- **Subject:** Person smiling, giving thumbs-up gesture, in a cool comfortable contemporary home. Sale-energy positive.
- **Mood at thumbnail:** "Happy customer, satisfied."
- **Lighting:** Bright fresh, cool palette (suggesting being in a cool home).
- **Dimensions:** Min 2000×2500 px.
- **Sources:** Unsplash → Pexels.
- **Search terms:** "thumbs up satisfied home modern bright", "happy customer gesture home contemporary", "homeowner thumbs up bright"
- **Auto-reject if:** dark moody close-up with blurred face (v1 reject), workplace/corporate, tradesman uniform, gym/outdoor.

---

### CATEGORY 4 — Holiday backdrops (6 images, NO PEOPLE)

Used in **A9 Holiday Event** as atmospheric backdrops. The hero is typically a holiday name in big type or a locked condenser; these sit behind. Must have **plenty of clean dark/light space for type overlay**.

#### 18. `holiday_xmas_bg`
- **Composition & overlay zones:** Bokeh fairy-light pattern with dark blurred areas in at least 50% of canvas. Dark areas are where overlay text sits.
- **Subject:** Christmas warm lights (fairy lights, bokeh, blurred tree). NO PEOPLE. NO COPYRIGHTED CHARACTERS (Santa, etc).
- **Mood at thumbnail:** "Christmas warm festive."
- **Lighting:** Warm festive bokeh, golden/red tones.
- **Dimensions:** Min 2500×2500 px.
- **Sources:** Unsplash → Pexels → Pixabay.
- **Search terms:** "christmas bokeh lights warm dark background", "holiday fairy lights dark backdrop", "christmas atmosphere warm bokeh negative space"
- **Auto-reject if:** no negative space (lights fill entire frame), reindeer/Santa cartoons, copyrighted characters, daytime decoration shots.

#### 19. `holiday_nye_bg`
- **Composition & overlay zones:** Fireworks in upper third, dark sky takes 60-70% of canvas — overlay paradise.
- **Subject:** Fireworks against dark night sky. NO PEOPLE.
- **Mood at thumbnail:** "New Year fireworks."
- **Lighting:** High-contrast — black sky, vivid bursts.
- **Dimensions:** Min 2500×2000 px.
- **Sources:** Unsplash → Pexels → Pixabay.
- **Search terms:** "fireworks dark night sky", "new year fireworks atmospheric", "fireworks display dark backdrop overlay"
- **Auto-reject if:** identifiable city skyline (need neutral atmospheric), daytime, crowd shots.

#### 20. `holiday_easter_bg`
- **Composition & overlay zones:** Subject occupies LOWER THIRD or off-centre, with at least 60% of canvas as plain pastel space for overlay. **NOT the v1 busy mini-eggs flat-lay** — that had no negative space.
- **Subject:** Pastel spring atmospheric — soft pastel flowers in corner / arrangement of 2-3 eggs in a corner / pastel ribbon trail / pastel ombré gradient. **MUST have generous plain pastel space for overlay**, not a dense pattern.
- **Mood at thumbnail:** "Easter / spring soft."
- **Lighting:** Soft pastels, bright daylight.
- **Dimensions:** Min 2500×2000 px.
- **Sources:** Unsplash → Pexels → Pixabay.
- **Search terms:** "easter pastel minimal background negative space", "spring pastel soft minimalist backdrop", "easter eggs corner pastel plain background"
- **Auto-reject if:** dense flat-lay with no negative space (v1 reject), religious crosses, eggs-with-faces.

#### 21. `holiday_boxing_day_bg`
- **Composition & overlay zones:** Sky takes 50%+ of canvas, beach/sand below. Wide horizon. Plenty of sky for top overlay, sand/water for bottom overlay.
- **Subject:** Australian beach atmospheric — sand, ocean, summer sun. NO PEOPLE in foreground (background figures OK if small).
- **Mood at thumbnail:** "Australian summer holiday."
- **Lighting:** Bright sunny daylight.
- **Dimensions:** Min 2500×2000 px.
- **Sources:** Unsplash → Pexels.
- **Search terms:** "australian beach summer sky empty", "manly bondi beach atmospheric wide", "australian summer beach landscape no people"
- **Auto-reject if:** Hawaii/tropical resort, crowded beach scenes, foreground people.

#### 22. `holiday_blackfriday_bg`
- **Composition & overlay zones:** Abstract shapes occupy <50% of frame. Plenty of black space for overlay.
- **Subject:** Black/red high-contrast abstract or geometric backdrop. NO PEOPLE. NO BRANDED RETAIL IMAGERY.
- **Mood at thumbnail:** "Bold sale / Black Friday."
- **Lighting:** Black + red palette, dramatic.
- **Dimensions:** Min 2500×2500 px.
- **Sources:** Unsplash → Pexels.
- **Search terms:** "black red abstract minimal dark background", "black friday banner abstract red dark", "high contrast red black geometric minimal"
- **Auto-reject if:** "BLACK FRIDAY" text already on image, retailer branding, fake-AI-illustration.

#### 23. `holiday_australia_day_bg`
- **Composition & overlay zones:** Generous sky or simple Aussie outdoor scene with plenty of plain area for overlay.
- **Subject:** Generic Australian outdoor — Australian flag colour palette abstracted, clean coastal scene, gum trees against bright sky, OR Australian beach. **HARD REJECT: NO ULURU, NO ABORIGINAL CULTURAL SITES, NO ABORIGINAL ART OR IMAGERY.** This was the v1 reject — sacred Anangu site used for commercial sale ads is the worst possible combination. Default to coastal, gum trees, or generic blue-sky-and-beach instead.
- **Mood at thumbnail:** "Generic Australian outdoor / patriotic-light."
- **Lighting:** Bright Australian daylight.
- **Dimensions:** Min 2500×2000 px.
- **Sources:** Unsplash → Pexels.
- **Search terms:** "australian beach generic landscape sky", "gum trees blue sky australian", "australian coast horizon bright simple", "blue sky red dirt coastal australian"
- **Auto-reject if:** **Uluru / Ayers Rock** (the v1 disaster), Aboriginal art / sacred sites, copyrighted national imagery, Australian flag as primary subject (use only colour palette).

---

### CATEGORY 5 — Outdoor backdrops (4 images, NO PEOPLE)

Background plates for A1, A5, A6, A7, A8 hero variants. Used as backdrops for locked condenser shots OR as standalone atmospheric.

#### 24. `outdoor_sky_grass`
- **Composition & overlay zones:** ~70% sky / 30% grass. NO buildings, NO fences, NO trees breaking horizon, NO distant farmhouses (the v1 had all of these). Just clean blue sky and clean green grass.
- **Subject:** Bright blue Australian sky with green grass below. Wide horizon. **NOTHING ELSE.**
- **Mood at thumbnail:** "Bright optimistic outdoor."
- **Lighting:** Bright clean midday daylight. Vibrant saturation.
- **Dimensions:** Min 2500×2500 px.
- **Sources:** Unsplash → Pexels → Pixabay.
- **Search terms:** "blue sky green grass minimal empty", "vibrant blue sky lush grass simple", "summer sky grass clean horizon empty"
- **Auto-reject if:** fence posts, farm buildings (v1 reject — Midwest American farm), distant trees, telephone poles, cloudy/overcast, dawn/dusk.

#### 25. `outdoor_suburban_aus`
- **Composition & overlay zones:** Home in lower 2/3, sky in upper third (overlay zone). Modest fence / front yard visible.
- **Subject:** Australian suburban home — Queenslander, modern brick, weatherboard. NOT American picket-fence colonial, NOT English row house.
- **Mood at thumbnail:** "Australian suburb."
- **Lighting:** Bright daylight.
- **Dimensions:** Min 2500×1800 px.
- **Sources:** Unsplash → Pexels.
- **Search terms:** "australian suburban home queenslander", "brisbane suburban street home", "modern australian home street view"
- **Auto-reject if:** American suburb aesthetic, English row houses, mansions, dilapidated homes.

#### 26. `outdoor_modern_home`
- **Composition & overlay zones:** Home fills 60-70% of frame in middle/lower band. Sky available above for overlay.
- **Subject:** Modern Australian home exterior — contemporary architecture, brick / timber / glass mix.
- **Mood at thumbnail:** "Modern Australian home."
- **Lighting:** Warm afternoon golden hour OR clean midday.
- **Dimensions:** Min 2500×1800 px.
- **Sources:** Unsplash → Pexels → Adobe Stock free.
- **Search terms:** "modern australian home contemporary architecture afternoon", "australian architectural home brick timber", "modern home exterior australia daylight"
- **Auto-reject if:** magazine-cover mansion, American craftsman, English Tudor.

#### 27. `outdoor_heatwave_sunset`
- **Composition & overlay zones:** Sky takes 70%+ of canvas. Tree silhouettes / horizon in lower 20-30%.
- **Subject:** Australian summer atmospheric — orange/red sky with gum-tree silhouettes OR oppressive heat haze landscape. Strong orange/red palette.
- **Mood at thumbnail:** "Hot summer / heatwave intensity."
- **Lighting:** Heavy orange/red palette, hot.
- **Dimensions:** Min 2500×1800 px.
- **Sources:** Unsplash → Pexels.
- **Search terms:** "australian sunset orange gum trees silhouette", "hot summer sunset australian outback", "heatwave orange sky landscape australia"
- **Auto-reject if:** pretty pleasant sunset (we want oppressive heat feel), forest fire imagery (sensitive), people in foreground.

---

## REPORTING BACK

After all 27 images saved, output a Markdown table:

```
| # | Key | Source | URL | Search term | Resolution | Overlay-zone score | Notes |
|---|-----|--------|-----|-------------|-----------|-------------------|-------|
| 1 | bill_holder_man | Unsplash | https://... | "man worried about bill" | 3000x2200 | strong: subject left third, plain wall negative space top-right | matches brief |
...
```

The "Overlay-zone score" column is critical — describe specifically WHERE the negative space is and what overlay would land there. If you can't describe it cleanly, the image is probably not overlay-ready.

If you can't find a good match for an image after trying all sources, save your best attempt with a "FLAGGED" note describing what's wrong, and continue. Don't stall.

## END PROMPT
