# 从零复现「skill可视化调用」（dsh-skill-gallery）

本文是这台机器上已经跑通的那条路的完整复刻步骤，包括踩过的坑和判定方法。
成品：<https://github.com/azliar/dsh-skill-gallery>

- 目标：DSH 左侧栏「自动化任务」下面多一个 **skill可视化调用** 入口，里面把固定流程的项目技能列成卡片，点一下就在新会话里带上 `/技能名` 和指令。
- 环境：DSH Desktop 2.0.18，profile 名 `desktop`，插件目录 `E:\DSH WORK\dsh-skill-gallery`。
- 内置工具链（系统 PATH 里没有 node/npm）：

  ```text
  node  C:\Users\Administrator\.dsh\dsh-runtimes\dsh-plugin-desktop-primary-runtime\dependencies\node\bin\node.exe
  pnpm  C:\Users\Administrator\.dsh\dsh-runtimes\dsh-plugin-desktop-primary-runtime\dependencies\pnpm\bin\pnpm.mjs
  ```

---

## 0. 先搞清楚它是什么形态

一个 DSH 插件 = 一个普通 npm 包，`package.json` 里声明 `dsh.bundle`（能装）和 `dsh.client`（带 Web 界面）。
**只声明 `dsh.client` 是装不上的**，这是市场最常见的被拒原因。

```jsonc
"dsh": {
  "bundle": { "patch": "./cordis.patch.yml" },   // 必须：安装入口
  "client": { "platform": "web", "immediately": true }  // 仅前端插件才要
}
```

---

## 1. 造包：6 个文件

```text
dsh-skill-gallery/
├── package.json
├── cordis.patch.yml
├── index.js
├── client.js          ← 全部界面在这里
├── icon.svg
├── locale/zh.json
├── locale/en.json
├── LICENSE
└── README.md
```

### 1.1 `package.json`

```json
{
  "name": "dsh-skill-gallery",
  "version": "1.0.0",
  "description": "Skill gallery panel under Automation in the DSH sidebar.",
  "type": "module",
  "license": "MIT",
  "exports": {
    ".": "./index.js",
    "./client": "./client.js",
    "./locale/*.json": "./locale/*.json",
    "./icon": "./icon.svg",
    "./package.json": "./package.json"
  },
  "files": ["index.js", "client.js", "cordis.patch.yml", "locale/*.json", "icon.svg", "README.md", "LICENSE"],
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": {
      "platform": "web",
      "immediately": true,
      "inject": [
        "@deepseek-ai/dsh-client-locale",
        "@deepseek-ai/dsh-client-ui-layout",
        "@deepseek-ai/dsh-client-ui-sidebar",
        "@deepseek-ai/dsh-client-ui-workspace"
      ]
    }
  }
}
```

> ⚠️ **`"./package.json": "./package.json"` 这一行不能省。**
> Host 的客户端模块扫描器用 `resolve('<包名>/package.json')` 定位包；少了这行它会抛 `ERR_PACKAGE_PATH_NOT_EXPORTED`，
> 然后**把这个包当成「没有客户端半」静默跳过**，并把结果缓存到进程结束——
> 现象是「插件页里能看到、状态 active，但界面永远不出现」，重载页面也没用。见 §3。

### 1.2 `cordis.patch.yml`

```yaml
- insert:
    - id: skill-gallery
      name: 'dsh-skill-gallery'
```

### 1.3 `index.js`（Host 半，空实现）

```js
export function apply() {}
```

界面上所有东西都在客户端半里；这一行只是让包被 Loader 挂上、它的 `dsh.client` 被扫进 Web 图。

### 1.4 `client.js`（最小可用骨架）

浏览器侧模块用 `window.__ModuleLoader__.load` 注册，`id` 必须等于包名；React 从模块表取，不要装第二份。

```js
window.__ModuleLoader__.load({
  id: 'dsh-skill-gallery',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const PANEL_ID = 'skill-gallery';   // 侧栏 id，同时也是 main 面板的 key
    const NS = 'skillGallery';          // 本插件的词典命名空间

    const zh = { panel: 'skill可视化调用', title: 'skill可视化调用' };
    const en = { panel: 'Skill Invocation Gallery', title: 'Skill Invocation Gallery' };

    function Panel(props) {
      const t = props.t;               // 注册时写 locale: NS，框架会把 t 注入进来
      return h('section', { style: { padding: '28px 32px' } }, h('h1', null, t('title')));
    }

    function apply(ctx) {
      const t = ctx.locale.bind(NS);

      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'skill-gallery: dictionaries');

      // 主面板：key 就是侧栏 id
      ctx.slots.inject('main', () => ctx.slots.register({
        name: 'main', key: PANEL_ID, locale: NS,
      }, Panel));

      // 侧栏入口：order 20 → 排在 plugins(0)、automation/schedules(10) 之后
      ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
        name: 'sidebar.panellist', id: PANEL_ID, order: 20, locale: NS,
        label: () => t('panel'),        // thunk：切语言不用重新注册
      }, () => h('span', { 'aria-hidden': true }, '•')));
    }

    return { inject: ['slots', 'locale'], apply };
  },
});
```

**接一张技能卡片**（这就是「一键调用」的核心，只有一句）：

```js
// 点卡片时（并把 'uiWorkspace' 加进 apply 返回的 inject 列表）：
ctx.uiWorkspace.startSession(undefined, {
  prompt: '/supervision-notice 根据我上传的《监理通知单》生成《监理通知回复单》。',
  clearPreviousDraft: true,
});
```

要点：

- `prompt` 必须以 `/技能名` + 空格开头。输入框的 `/` 手势会把这一段变成技能标签，模型随第一条消息加载该技能。
- `startSession(undefined, …)` = 用当前工作区新建会话并把草稿预填好；没有工作区时不会静默失败。
- 需要 `ctx.timer` 时在 `inject` 里加 `'timer'`，用 `ctx.timer.timeout(cb, ms)` 而不是裸 `setTimeout`。

完整实现（三张卡片、分组页签、搜索、复制指令、无工作区置灰）见仓库的 `client.js`，约 420 行，无外部依赖。

### 1.5 `locale/zh.json` + `locale/en.json`（插件页显示用）

```json
{ "meta": { "title": "skill可视化调用", "description": "把固定流程的项目技能列成卡片，一键在新会话里调用。" } }
```

```json
{ "meta": { "title": "Skill Invocation Gallery", "description": "Lists fixed-workflow project skills as cards." } }
```

### 1.6 `icon.svg`

64×64、圆角底色 + 白色线性图形即可；插件市场和插件页都会读 `./icon`。

---

## 2. 装进 profile

**桌面界面**：插件页 → 安装 → 选**目录**（`E:\DSH WORK\dsh-skill-gallery`）→ 确认。
等价的做法是把包加进 profile 的依赖和 `dsh.profile.bundles`，再让 Loader 挂上 `manual-tasks`/`skill-gallery` 那一行。
（本文全程走的是插件管理器的 `install_bundle`；CLI 形式 `dsh plugin --profile desktop add <绝对路径>` 是同一安装器，但本机没验证过。）

装完检查 profile：

```bash
grep -n "dsh-skill-gallery" "C:/Users/Administrator/.dsh/profiles/desktop/package.json"
# 期望看到 dependencies 里一条 link:，以及 dsh.profile.bundles 里一项
```

---

## 3. 生效：第一次必须换一个 Host 进程

**这一节是整件事里最容易白折腾半天的地方。**

- 客户端模块扫描的结果（包括「这个包没有客户端半」这种失败）**缓存在 Host 进程内存里，永不失效**。
- 所以首次安装、或改过 `package.json` 的 `exports`/`dsh` 段之后：**必须整个重启 DSH Desktop**。
- 只重载页面不够；这个桌面壳也没绑 `Ctrl+R`。重载页面的入口是：
  - 托盘图标右键 → **重新加载界面**；
  - 或 设置 → **桌面设置** → **开发者选项** → **重新加载界面**。
- 之后只改 `client.js`（文案、样式、加卡片）**不用重启**：Host 每 500ms 比对客户端 bundle 的 mtime/size，变了就热替换到已打开的页面。

重启后确认清单：

1. 左侧栏「自动化任务」下面出现 **skill可视化调用**；
2. 点开能看到面板（不是空白）；
3. 插件页里显示的名称/说明是上一步 `locale/*.json` 里写的。

---

## 4. 出错时怎么判定

| 现象 | 原因 | 处理 |
|---|---|---|
| 插件页有、状态 active，但侧栏没有入口 | `exports` 少了 `"./package.json"`，扫描器静默跳过并缓存 | 补上导出 → **重启应用** |
| 改了代码页面没变 | 只改了 `package.json` 那类不参与 bundle 的文件；或热替换没送达 | 用「重新加载界面」 |
| 入口在，点开是空白 | 面板组件渲染抛错（槽位会记 `slot entry crashed`） | 看日志，见下 |
| 装了两次、报 multiple active Loader sources | 同一个包被两个行挂载 | 删掉其中一行/bundle |

日志（渲染进程的 console 错误也会写进来）：

```text
C:\Users\Administrator\AppData\Roaming\DSH Desktop\logs\host\dsh-YYYY-MM-DD.log
```

```bash
grep -n "client-module-registry\|slot entry crashed\|Failed to load plugins" \
  "C:/Users/Administrator/AppData/Roaming/DSH Desktop/logs/host/dsh-2026-10-23.log"
```

---

## 5. 发到 GitHub

```bash
cd "E:/DSH WORK/dsh-skill-gallery"
git init -q
printf 'node_modules/\n*.tgz\n.verify/\n' > .gitignore
git add -A
git commit -m "feat: skill可视化调用 panel (dsh-skill-gallery 1.0.0)"
git branch -M main
git remote add origin https://github.com/azliar/dsh-skill-gallery.git
git push -u origin main
```

然后在仓库首页右侧 **About → ⚙ → Topics** 加 `dsh-plugin`（市场收录要求，只能用账号在网页上加）。

---

## 6. 提交到 dsh-market

dsh-market 的列表来自公开目录仓库 [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)：
**`data/plugins/` 下一个 YAML 就是全部提交内容**（README 与站点自动重建）。

硬性要求（CI 自动查）：

1. `package.json` 声明 `dsh.bundle` —— 有；
2. 仓库带 `dsh-plugin` topic —— 要加；
3. **仓库创建满 1 天** —— 本仓库建于 2026-10-22 17:53（本地），即 **2026-10-23 17:53 之后**才能过；
4. 一个 PR 最多 3 条，只加自己那一个文件；
5. 描述里出现 `": "` 必须整体加引号。

文件：`data/plugins/azliar__dsh-skill-gallery.yml`

```yaml
url: https://github.com/azliar/dsh-skill-gallery
name: azliar/dsh-skill-gallery
category: skill
description:
  en: 'Skill gallery panel under Automation in the DSH sidebar: every fixed-workflow project skill becomes a card; one click opens a new session with /skill-name and the task instruction already in the composer.'
  zh: 'DSH 左侧栏「自动化任务」下方的 skill 可视化调用面板：把固定流程的项目技能列成卡片，一键新建会话并把 /技能名 与任务指令预填进输入框。'
```

提交：

```bash
git clone https://github.com/awesome-dsh-plugin/awesome-dsh-plugin   # 或先 fork 再克隆自己的 fork
cd awesome-dsh-plugin
git checkout -b add-dsh-skill-gallery
cp /path/to/azliar__dsh-skill-gallery.yml data/plugins/
git add data/plugins/azliar__dsh-skill-gallery.yml
git commit -m "Add dsh-skill-gallery"
git push -u origin add-dsh-skill-gallery
```

然后在 GitHub 上开 PR（标题与正文模板见仓库里 `market-submission/PR.md`）。合并后站点与 `plugins.json` 自动重建，市场搜索即可见，
安装命令变成 `dsh plugin --profile web add github:azliar/dsh-skill-gallery`。

---

## 7. 可选后续

- **发 npm**：`pnpm login` → `pnpm publish --access public`（名字 `dsh-skill-gallery` 当时查过是空的）。
  条目会自动带版本号与下载量；前提是 `package.json` 的 `repository` 指回本仓库（已配）。
- **Release tarball**：把 `pnpm pack` 产物挂到 GitHub Release，资产名不带版本号，再在 YAML 加
  `tarball: https://github.com/azliar/dsh-skill-gallery/releases/latest/download/dsh-skill-gallery.tgz`。
- **截图**：仓库根放 `screenshots.json`，列 1–8 个仓库内相对路径，市场详情页会按顺序展示。

---

## 8. 一句话回顾

> 包要有 `dsh.bundle`（能装）和 `dsh.client`（有界面），**`exports` 必须包含 `./package.json`**（能被扫描到），
> 首次生效要换 Host 进程，之后改客户端文件是热替换；收录只差一个 `data/plugins/<owner>__<repo>.yml` 的 PR，
> 而且要等仓库满 1 天。
