# PR 标题

```
Add dsh-skill-gallery (skill gallery panel under Automation)
```

# PR 正文

```markdown
## What it is

`dsh-skill-gallery` adds a **skill gallery** panel to the DSH Web UI, seated under
Automation in the left sidebar (`sidebar.panellist`, `order: 20`).

Every card in the panel is one project skill. Starting a card opens a new Session and
leaves `/skill-name` plus the task instruction in the composer, so the skill loads with
the user's first message instead of being retyped from memory. Each card also offers
"copy instruction" for pasting into an existing Session.

Ships with three cards: supervision notice reply (`/supervision-notice`), daily work
report (`/work-daily-report`), and Office document to PDF (`/office-export-pdf`). Adding
a card is one array entry plus three locale strings, documented in the README.

## Details

- Repo: https://github.com/<github-user>/dsh-skill-gallery
- Install: `dsh plugin --profile web add github:<github-user>/dsh-skill-gallery`
- Package: `dsh-skill-gallery` 1.0.0, MIT
- Surfaces used: `sidebar.panellist` (list), `main` (keyed panel), `locale`, `uiWorkspace`,
  `timer`; theme-token styling only, no Host changes, no network, no shell
- Uninstall leaves nothing behind: both slot entries and the injected stylesheet are
  disposed with the plugin

## Checklist

- [ ] `package.json` exports `./client` and `./package.json` (the client-module scanner
      resolves the package manifest; without the second export the client half is skipped
      silently)
- [ ] `dsh.client.platform: "web"`, `immediately: true`
- [ ] repo carries the `dsh-plugin` topic
- [ ] `data/plugins/<github-user>__dsh-skill-gallery.yml` added, `category: skill`
```

# 自查（提交前）

- 仓库公开、带 `dsh-plugin` topic；
- `data/plugins/<用户名>__dsh-skill-gallery.yml` 的文件名与 YAML 里的 `name: <用户名>/dsh-skill-gallery` 一致；
- `category: skill` 与站点分类表里的 `skill`（技能包）对得上；
- `url` 指向仓库首页，不带 `/tree/...`（只有 monorepo 才需要子路径）。
