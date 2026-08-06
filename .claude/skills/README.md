# Vendored design skills

These are not ours. They come from **[leonxlnx/taste-skill](https://github.com/leonxlnx/taste-skill)**
(MIT), copied in on 2026-08-06 at commit `e988add`, and left unmodified.

They are prompts, not code — nothing here runs or ships with the app. They only
change how Claude approaches a design task in this repo.

The ones relevant to Homework Hub:

| Skill | Use it for |
| --- | --- |
| `redesign-skill` | Auditing and upgrading screens that already exist — the usual case here |
| `taste-skill` | A new screen from scratch, without it looking templated |
| `soft-skill` | The spacing/shadow/type details that separate polished from cheap |
| `minimalist-skill` | The direction this app already follows: quiet, editorial, restrained colour |

The rest target things this project doesn't do — image generation (`imagegen-*`,
`brandkit`), other tools (`stitch-skill`, `gpt-tasteskill`, `image-to-code-skill`),
or a look this app deliberately avoids (`brutalist-skill`).

`output-skill` is not a design skill at all: it instructs against truncating
long output. Harmless, but unrelated to the rest.

## Updating

Re-copy from upstream; nothing here is patched, so there is nothing to merge:

```bash
git clone --depth 1 https://github.com/leonxlnx/taste-skill /tmp/taste-skill
cp -r /tmp/taste-skill/skills/*/ .claude/skills/
```
