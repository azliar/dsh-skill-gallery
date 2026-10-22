# 提交到 dsh-market（awesome-dsh-plugin）

dsh-market 的插件列表来自公开仓库 [`awesome-dsh-plugin/awesome-dsh-plugin`](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)：
**`data/plugins/` 下加一个 YAML 文件就是全部提交内容**，README 与站点会自动重建。
本站页面自己写的是这条规则：「Open a PR against awesome-dsh-plugin — one YAML file under `data/plugins/` is the whole submission」，并要求仓库带 `dsh-plugin` topic。

## 前置条件（缺一不可）

1. 插件已推到**公开** GitHub 仓库，例如 `https://github.com/你的用户名/dsh-skill-gallery`。
2. 该仓库加了 `dsh-plugin` topic（仓库首页 → 右侧 About 齿轮 → Topics）。
3. 仓库根目录就是这个包（`package.json` + `client.js` + `cordis.patch.yml` 在位）——本目录上一级已经满足。

## 提交步骤

```bash
# 1. 克隆目录索引仓库
git clone https://github.com/awesome-dsh-plugin/awesome-dsh-plugin
cd awesome-dsh-plugin

# 2. 放入本目录的 YAML，文件名 = <用户名>__<仓库名>.yml
cp /path/to/dsh-skill-gallery.yml data/plugins/<用户名>__dsh-skill-gallery.yml

# 3. 新分支 + 提交 + push
git checkout -b add-dsh-skill-gallery
git add data/plugins/<用户名>__dsh-skill-gallery.yml
git commit -m "Add dsh-skill-gallery"
git push -u origin add-dsh-skill-gallery
```

然后在该仓库开 PR，标题与正文见 `PR.md`。

## 提交后

- 合并后站点与 `plugins.json` 会自动重新生成，dsh-market 的搜索里就能搜到；
- 安装命令会变成 `dsh plugin --profile web add github:<用户名>/dsh-skill-gallery`；
- 若之后也发到 npm，条目会自动带上 npm 版本与下载量。

## 已准备好的文件

| 文件 | 用途 |
|---|---|
| `dsh-skill-gallery.yml` | 要拷进 `data/plugins/` 的 YAML（把 `<github-user>` 换成实际用户名） |
| `PR.md` | PR 标题 / 正文 / 自查清单 |
