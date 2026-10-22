# skill可视化调用（Skill Invocation Gallery）

DSH 左侧栏「自动化任务」下面的 skill 可视化面板。每一张卡片就是一个项目技能（skill），
点「开始任务」会新建会话，并把 `/技能名` 和该任务的一句话指令预填在输入框里，
附件在发送前自己加。

- 包名：`dsh-skill-gallery`
- 侧栏入口：`sidebar.panellist`，`id: skill-gallery`，`order: 20`（自动化任务是 10）
- 主面板：`main`，`key: skill-gallery`
- 样式：插件自带的 `<style>`（`dsg-` 前缀），只用 `--dsw-alias-*` 主题变量，随插件卸载移除

## 安装

```bash
# 目录安装（开发用，改动立即生效）
pnpm add "link:E:/DSH WORK/dsh-skill-gallery"

# 或者从打包好的 tarball 安装
pnpm add E:/DSH WORK/dsh-skill-gallery/dsh-skill-gallery-1.0.0.tgz
```

在 Desktop 里也可以直接：插件页 → 安装 → 选择本目录或 tarball，然后把
`dsh-skill-gallery` 加进 profile 的 `dsh.profile.bundles`。

> 注意：包必须导出 `"./package.json"`。Host 的客户端模块扫描器用
> `resolve('<包名>/package.json')` 定位包，缺这一项会让整个客户端插件被静默跳过
> （Host 行仍显示 active，界面永远出不来，且结果被缓存到进程结束）。

## 文件

| 文件 | 作用 |
|---|---|
| `client.js` | 全部界面：词典、样式、侧栏图标、技能卡片面板 |
| `index.js` | Host 侧空实现，只让这个包被 Loader 挂上（客户端半由 `dsh.client` 声明） |
| `cordis.patch.yml` | 插入 `skill-gallery` 这一行 |
| `locale/zh.json`、`locale/en.json` | 插件市场/插件页显示的名称与说明 |

## 加一个技能卡片

在 `client.js` 的 `TASKS` 数组里加一项，然后在 `zh` / `en` 两个词典里补三个键
（两边键必须一一对应）：

```js
{
  id: 'my-task',            // 唯一 id
  skill: 'office-docx',     // skill 名，必须和 ~/.dsh/skills/<name> 一致
  group: 'document',        // 'construction' 或 'document'（对应筛选页签）
  glyph: 'document',        // document | table | export
  title: 'task.my.title',
  description: 'task.my.description',
  prompt: 'task.my.prompt'
}
```

`prompt` 是 `/技能名` 后面那段话，写清「要什么」，不要把固定版式写进去（版式由 skill 负责）。
改完保存即可：Host 每 500ms 比对 bundle 元数据，变化会热替换到已打开的页面。

## 许可

MIT，见 `LICENSE`。
