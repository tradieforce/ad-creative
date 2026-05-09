# /assets/client-uploads — per-client photo uploads

Empty until real clients onboard. When the onboarding form is submitted, a folder is created here for the client and their photos go inside.

## Folder convention

```
client-uploads/{client-slug}/
├── team-1.png         ← team photo (required for A10 to fire)
├── owner-1.png        ← owner / face of business
├── van-1.png          ← branded vehicle
├── lifestyle-1.png    ← family/lifestyle photo
└── reaction-1.png     ← rare; mostly use stock
```

The `client-slug` is generated from business name (lowercase, hyphens). Examples:
- "Sharp Air Conditioning" → `sharp-aircon`
- "Cool Breeze Brisbane" → `cool-breeze-brisbane`

## A10 photo dependency

The Local Trust archetype (A10) is the only conditional one. It only generates if **at least one team photo** is uploaded. Backend boolean check:

```python
if len(client_assets.team_photos) > 0:
    fire_a10 = True
else:
    fire_a10 = False  # skip A10 for this client
```
