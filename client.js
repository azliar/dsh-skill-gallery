/**
 * Skill Gallery — a fixed-workflow skill panel in the left sidebar, seated under
 * the shipped Automation (schedule) entry.
 *
 * The panel lists project skills as task cards. Starting a card opens a new
 * Session through `ctx.uiWorkspace.startSession` with the skill reference
 * (`/skill-name`) plus the task instruction already in the composer, so the
 * model loads that skill as soon as the user sends the message together with
 * the documents the task needs.
 *
 * Styles live in a plugin-owned <style> tag (removed with the plugin) and use
 * only `--dsw-alias-*` theme tokens; controls are local copies of the host
 * button/input patterns because a plain-JS plugin must not import the harness
 * Client packages.
 */
window.__ModuleLoader__.load({
  id: 'dsh-skill-gallery',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** Sidebar entry id, which is also the `main` panel key. */
    const PANEL_ID = 'skill-gallery';
    /** Locale namespace owned by this plugin. */
    const NS = 'skillGallery';
    /** Identity of the injected stylesheet. */
    const STYLE_ID = 'dsh-skill-gallery/SkillGalleryPage.module.css';
    /** Sidebar position: after `plugins` (0) and the Automation entry `schedules` (10). */
    const SIDEBAR_ORDER = 20;

    /** Simplified Chinese dictionary (key-set source of truth). */
    const zh = {
      'panel': 'skill可视化调用',
      'title': 'skill可视化调用',
      'subtitle': '固定流程任务，一键在新会话中调用项目技能',
      'searchLabel': '搜索 skill',
      'searchPlaceholder': '搜索任务名称、说明或技能',
      'filterLabel': '任务分组',
      'filter.all': '全部',
      'filter.construction': '施工资料',
      'filter.document': '文档处理',
      'listLabel': 'skill 列表',
      'action.start': '开始任务',
      'action.copy': '复制指令',
      'action.copied': '已复制',
      'chip.title': '该任务使用的技能',
      'empty.title': '没有匹配的 skill',
      'empty.body': '换个关键词，或把分组切回「全部」。',
      'noWorkspace': '先在左侧打开一个工作区，任务才能开始',
      'footnote': '开始任务会新建会话并自动带上技能，需要的附件在发送前添加。',
      'task.supervision.title': '监理通知回复单',
      'task.supervision.description': '读取《监理通知单》扫描件，按项目固定版式逐条写整改回复，输出含《整改销项清单》的 DOCX。',
      'task.supervision.prompt': '根据我上传的《监理通知单》生成《监理通知回复单》。',
      'task.report.title': '工作日报编写',
      'task.report.description': '按现场照片和聊天记录整理当日工作条目、人员配置与明日计划，生成带施工照片的 xlsx 日报。',
      'task.report.prompt': '根据本轮提供的照片和记录，编写当天的工作日报。',
      'task.pdf.title': 'Office 文档转 PDF',
      'task.pdf.description': '把已完成的 Word、Excel 或 PPT 文档按原版式导出为 PDF。',
      'task.pdf.prompt': '把这份文档导出为 PDF，并保持原版式。'
    };

    /** English dictionary, checked complete against the zh key set. */
    const en = {
      'panel': 'Skill Invocation Gallery',
      'title': 'Skill Invocation Gallery',
      'subtitle': 'Fixed workflows that call a project skill in a new session',
      'searchLabel': 'Search skills',
      'searchPlaceholder': 'Search a task, its description, or its skill',
      'filterLabel': 'Task group',
      'filter.all': 'All',
      'filter.construction': 'Site documents',
      'filter.document': 'Documents',
      'listLabel': 'Skill list',
      'action.start': 'Start task',
      'action.copy': 'Copy instruction',
      'action.copied': 'Copied',
      'chip.title': 'Skill this task uses',
      'empty.title': 'No matching skill',
      'empty.body': 'Try another keyword, or switch the group back to All.',
      'noWorkspace': 'Open a workspace in the sidebar before starting a task',
      'footnote': 'Starting a task opens a new session with the skill already in the composer; add the files it needs before sending.',
      'task.supervision.title': 'Supervision notice reply',
      'task.supervision.description': 'Read a scanned supervision notice, answer every item in the project format, and export a DOCX with the clearance checklist.',
      'task.supervision.prompt': 'Produce the supervision notice reply from the notice I upload.',
      'task.report.title': 'Daily work report',
      'task.report.description': 'Turn site photos and chat records into the fixed daily-report workbook with today\'s work, staffing, and tomorrow\'s plan.',
      'task.report.prompt': 'Write today\'s work report from the photos and notes I provide.',
      'task.pdf.title': 'Office document to PDF',
      'task.pdf.description': 'Export a finished Word, Excel, or PowerPoint document to PDF with its original layout.',
      'task.pdf.prompt': 'Export this document to PDF and keep its original layout.'
    };

    /**
     * The fixed workflows this panel offers. `skill` is the exact skill name the
     * composer reference resolves against, `group` selects the filter tab, and
     * `glyph` picks the card artwork.
     */
    const TASKS = [
      {
        id: 'supervision-reply',
        skill: 'supervision-notice',
        group: 'construction',
        glyph: 'document',
        title: 'task.supervision.title',
        description: 'task.supervision.description',
        prompt: 'task.supervision.prompt'
      },
      {
        id: 'work-daily-report',
        skill: 'work-daily-report',
        group: 'construction',
        glyph: 'table',
        title: 'task.report.title',
        description: 'task.report.description',
        prompt: 'task.report.prompt'
      },
      {
        id: 'office-to-pdf',
        skill: 'office-export-pdf',
        group: 'document',
        glyph: 'export',
        title: 'task.pdf.title',
        description: 'task.pdf.description',
        prompt: 'task.pdf.prompt'
      }
    ];

    /** Filter tabs, in display order; `all` keeps every task. */
    const GROUPS = ['all', 'construction', 'document'];

    /** 16px outline paths, drawn with the host's one-pixel stroke. */
    const ICONS = {
      checklist: [
        'M3.75 6.25C4.7165 6.25 5.5 5.4665 5.5 4.5C5.5 3.5335 4.7165 2.75 3.75 2.75C2.7835 2.75 2 3.5335 2 4.5C2 5.4665 2.7835 6.25 3.75 6.25Z',
        'M7.5 4.5H13.5',
        'M3.75 13.25C4.7165 13.25 5.5 12.4665 5.5 11.5C5.5 10.5335 4.7165 9.75 3.75 9.75C2.7835 9.75 2 10.5335 2 11.5C2 12.4665 2.7835 13.25 3.75 13.25Z',
        'M7.5 11.5H13.5'
      ],
      search: [
        'M7.25 12.5C10.1495 12.5 12.5 10.1495 12.5 7.25C12.5 4.3505 10.1495 2 7.25 2C4.3505 2 2 4.3505 2 7.25C2 10.1495 4.3505 12.5 7.25 12.5Z',
        'M10.9 10.9L14 14'
      ],
      play: [
        'M5.5 3.2V12.8L12.6 8L5.5 3.2Z'
      ],
      document: [
        'M4.25 2.25H8.9L11.75 5.1V13.75H4.25V2.25Z',
        'M8.6 2.4V5.4H11.6',
        'M6.2 8.4H9.8',
        'M6.2 10.6H9.8'
      ],
      table: [
        'M2.75 3.25H13.25V12.75H2.75V3.25Z',
        'M2.75 6.4H13.25',
        'M6.6 6.4V12.75'
      ],
      export: [
        'M9.9 2.25H4.25V13.75H11.75V4.1L9.9 2.25Z',
        'M9.8 2.4V4.2H11.6',
        'M8 6.9V11',
        'M6.2 9.4L8 11.2L9.8 9.4'
      ]
    };

    /**
     * Render one outline icon.
     * @param name - key of {@link ICONS}.
     * @param size - square edge in pixels.
     * @param strokeWidth - stroke width in user units.
     * @returns the decorative SVG element.
     */
    function glyph(name, size, strokeWidth) {
      const paths = ICONS[name] === undefined ? [] : ICONS[name];
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 16 16',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        'aria-hidden': true,
        strokeWidth: strokeWidth === undefined ? 1 : strokeWidth,
        stroke: 'currentColor',
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
      }, paths.map((d, index) => h('path', { key: index, d })));
    }

    /** Panel-row artwork; the sidebar owns the button and its accessible label. */
    function SidebarEntryIcon(props) {
      const size = typeof props.size === 'number' ? props.size : 18;
      return glyph('checklist', size, 1);
    }

    /**
     * One task card: glyph, name, description, the skill chip, and its actions.
     * @param props - localized copy, the task descriptor, and the action callbacks.
     * @returns the list item.
     */
    function SkillCard(props) {
      const { task, t, hasWorkspace, copied, onStart, onCopy } = props;
      const prompt = '/' + task.skill + ' ' + t(task.prompt);
      return h('li', { className: 'dsg-card' },
        h('div', { className: 'dsg-cardMain' },
          h('span', { className: 'dsg-glyph', 'aria-hidden': true },
            glyph(task.glyph, 18, 1)),
          h('div', { className: 'dsg-cardText' },
            h('h2', { className: 'dsg-cardTitle' }, t(task.title)),
            h('p', { className: 'dsg-cardDesc' }, t(task.description)))),
        h('div', { className: 'dsg-cardFoot' },
          h('code', { className: 'dsg-chip', title: t('chip.title') }, '/' + task.skill),
          h('div', { className: 'dsg-actions' },
            h('button', {
              type: 'button',
              className: 'dsg-btn dsg-btnOutline',
              onClick: () => {
                onCopy(prompt).then((ok) => {
                  if (ok) props.onCopied(task.id);
                });
              }
            }, copied ? t('action.copied') : t('action.copy')),
            h('button', {
              type: 'button',
              className: 'dsg-btn dsg-btnPrimary',
              disabled: !hasWorkspace,
              title: hasWorkspace ? t('action.start') : t('noWorkspace'),
              onClick: () => {
                onStart(prompt);
              }
            },
            h('span', { className: 'dsg-btnGlyph', 'aria-hidden': true }, glyph('play', 13, 1)),
            t('action.start')))));
    }

    /**
     * The panel: a searchable, groupable list of fixed-workflow tasks.
     * @param props - slot props: injected actions, the bound translate function,
     * and the workspace snapshot hooks the main slot provides.
     * @returns the task panel.
     */
    function SkillGalleryPage(props) {
      const t = props.t;
      const useWorkspaces = props.useWorkspaces;
      const hasWorkspacesHook = typeof useWorkspaces === 'function';
      const phase = hasWorkspacesHook ? useWorkspaces((state) => state.phase) : 'ready';
      const items = hasWorkspacesHook ? useWorkspaces((state) => state.items) : undefined;
      const hasWorkspace = phase === 'ready' && Array.isArray(items) && items.length > 0;
      const [search, setSearch] = React.useState('');
      const [group, setGroup] = React.useState('all');
      const [copiedId, setCopiedId] = React.useState(null);

      React.useEffect(() => {
        if (copiedId === null) return undefined;
        return props.after(() => {
          setCopiedId(null);
        });
      }, [copiedId, props.after]);

      const rows = React.useMemo(() => {
        const query = search.trim().toLowerCase();
        return TASKS.filter((task) => {
          if (group !== 'all' && task.group !== group) return false;
          if (query === '') return true;
          const haystack = t(task.title) + ' ' + t(task.description) + ' ' + task.skill;
          return haystack.toLowerCase().includes(query);
        });
      }, [group, search, t]);

      return h('section', { className: 'dsg-page', 'aria-label': t('title') },
        h('div', { className: 'dsg-scroll' },
          h('div', { className: 'dsg-content' },
            h('div', { className: 'dsg-heading' },
              h('h1', { tabIndex: -1 }, t('title')),
              h('span', { className: 'dsg-subtitle' }, t('subtitle'))),
            h('div', { className: 'dsg-tabs', role: 'group', 'aria-label': t('filterLabel') },
              GROUPS.map((value) => h('button', {
                key: value,
                type: 'button',
                className: value === group ? 'dsg-tab dsg-tabActive' : 'dsg-tab',
                'aria-pressed': value === group,
                onClick: () => {
                  setGroup(value);
                }
              }, t('filter.' + value)))),
            h('div', { className: 'dsg-search' },
              h('span', { className: 'dsg-searchIcon', 'aria-hidden': true }, glyph('search', 15, 1)),
              h('input', {
                className: 'dsg-searchInput',
                type: 'search',
                'aria-label': t('searchLabel'),
                placeholder: t('searchPlaceholder'),
                value: search,
                onChange: (event) => {
                  setSearch(event.target.value);
                }
              })),
            rows.length === 0
              ? h('div', { className: 'dsg-empty', role: 'status' },
                h('span', { className: 'dsg-emptyGlyph', 'aria-hidden': true }, glyph('checklist', 24, 1)),
                h('h2', {}, t('empty.title')),
                h('p', {}, t('empty.body')))
              : h('ul', { className: 'dsg-list', 'aria-label': t('listLabel') },
                rows.map((task) => h(SkillCard, {
                  key: task.id,
                  task,
                  t,
                  hasWorkspace,
                  copied: copiedId === task.id,
                  onStart: props.onStart,
                  onCopy: props.onCopy,
                  onCopied: setCopiedId
                }))),
            !hasWorkspace && h('p', { className: 'dsg-warning', role: 'status' }, t('noWorkspace')),
            h('p', { className: 'dsg-note' }, t('footnote')))));
    }

    /** Panel styles: host layout metrics, theme tokens only, `dsg-` prefix. */
    const CSS = [
      '.dsg-page{box-sizing:border-box;width:100%;min-width:0;height:100%;min-height:0;display:flex;flex-direction:column;overflow:hidden;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:14px;line-height:1.6}',
      '.dsg-scroll{flex:1;min-height:0;overflow:auto;scrollbar-gutter:stable}',
      '.dsg-content{max-width:960px;margin:0 auto;padding:0 clamp(24px,4vw,48px) 48px}',
      '.dsg-heading{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px;margin-bottom:20px;padding-top:28px}',
      '[data-platform="darwin"] .dsg-heading{padding-top:calc(28px + var(--dsh-frame-top-clearance,0px))}',
      '.dsg-heading h1{flex:0 0 auto;min-width:0;max-width:100%;margin:0;font-size:20px;font-weight:500;line-height:28px}',
      '.dsg-subtitle{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px}',
      '.dsg-tabs{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin-bottom:14px}',
      '.dsg-tab{display:inline-flex;flex:none;align-items:center;height:28px;padding:0 10px;border:0;border-radius:14px;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:14px;line-height:22px;white-space:nowrap;cursor:pointer}',
      '.dsg-tab:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.dsg-tabActive{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
      '.dsg-search{display:flex;align-items:center;gap:8px;height:36px;margin:0 0 16px;padding:0 10px;border:0.5px solid var(--dsw-alias-border-l3);border-radius:12px;color:var(--dsw-alias-label-tertiary);transition:border-color .15s}',
      '.dsg-search:hover{border-color:var(--dsw-alias-border-l2)}',
      '.dsg-search:focus-within{border-color:var(--dsw-alias-state-business-primary)}',
      '.dsg-searchIcon{display:inline-flex;flex:none;align-items:center;justify-content:center;color:var(--dsw-alias-label-tertiary)}',
      '.dsg-searchInput{flex:1;min-width:0;border:0;outline:0;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;line-height:22px}',
      '.dsg-searchInput::placeholder{color:var(--dsw-alias-label-dimmed)}',
      '.dsg-list{display:flex;flex-direction:column;gap:10px;margin:0;padding:0;list-style:none}',
      '.dsg-card{display:flex;flex-direction:column;gap:12px;padding:16px 18px;border:0.5px solid var(--dsw-alias-border-l3);border-radius:14px;background:var(--dsw-alias-bg-layer-1);transition:border-color .15s}',
      '.dsg-card:hover{border-color:var(--dsw-alias-border-l2)}',
      '.dsg-cardMain{display:flex;align-items:flex-start;gap:12px}',
      '.dsg-glyph{display:inline-flex;flex:none;align-items:center;justify-content:center;width:34px;height:34px;border-radius:10px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-brand-primary)}',
      '.dsg-cardText{flex:1;min-width:0}',
      '.dsg-cardTitle{margin:0;font-size:14px;font-weight:500;line-height:22px}',
      '.dsg-cardDesc{margin:2px 0 0;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px}',
      '.dsg-cardFoot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;padding-left:46px}',
      '.dsg-chip{display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:6px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:22px}',
      '.dsg-actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px}',
      '.dsg-btn{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:4px;height:28px;padding:0 10px;border:0;border-radius:var(--dsw-radius-sm,6px);background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:18px;white-space:nowrap;cursor:pointer}',
      '.dsg-btn:disabled{cursor:not-allowed;opacity:.4}',
      '.dsg-btnOutline{border:0.5px solid var(--dsw-alias-border-l3)}',
      '.dsg-btnOutline:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}',
      '.dsg-btnPrimary{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground)}',
      '.dsg-btnPrimary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}',
      '.dsg-btnGlyph{display:inline-flex;align-items:center;justify-content:center;width:13px;height:13px}',
      '.dsg-empty{display:flex;flex-direction:column;align-items:center;gap:6px;padding:48px 16px;border:0.5px dashed var(--dsw-alias-border-l3);border-radius:14px;color:var(--dsw-alias-label-tertiary);text-align:center}',
      '.dsg-emptyGlyph{display:inline-flex;color:var(--dsw-alias-label-dimmed)}',
      '.dsg-empty h2{margin:4px 0 0;color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:22px}',
      '.dsg-empty p{margin:0;font-size:13px;line-height:20px}',
      '.dsg-warning{margin:14px 0 0;color:var(--dsw-alias-state-warn-primary);font-size:13px;line-height:20px}',
      '.dsg-note{margin:18px 0 0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}'
    ].join('\n');

    /**
     * Client plugin body: dictionaries, the panel stylesheet, the `main` panel,
     * and the sidebar entry that opens it.
     * @param ctx - client root context.
     */
    function apply(ctx) {
      const t = ctx.locale.bind(NS);

      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'skill-gallery: dictionaries');

      ctx.effect(() => {
        if (typeof document === 'undefined') return () => {};
        const selector = 'style[data-plugin-css="' + STYLE_ID + '"]';
        if (document.querySelector(selector) === null) {
          const tag = document.createElement('style');
          tag.dataset.plugin = 'dsh-skill-gallery';
          tag.dataset.pluginCss = STYLE_ID;
          tag.textContent = CSS;
          document.head.append(tag);
        }
        return () => {
          const tag = document.querySelector(selector);
          if (tag !== null) tag.remove();
        };
      }, 'skill-gallery: styles');

      const copyText = async (text) => {
        const clipboard = typeof navigator === 'undefined' ? undefined : navigator.clipboard;
        if (clipboard === undefined || clipboard === null) return false;
        try {
          await clipboard.writeText(text);
          return true;
        } catch (_error) {
          return false;
        }
      };

      ctx.slots.inject('main', () => ctx.slots.register({
        name: 'main',
        key: PANEL_ID,
        locale: NS,
        inject: () => ({
          onStart: (prompt) => {
            ctx.uiWorkspace.startSession(undefined, { prompt, clearPreviousDraft: true });
          },
          onCopy: copyText,
          /** Run `callback` after the "copied" confirmation has been shown. */
          after: (callback) => ctx.timer.timeout(callback, 1600)
        })
      }, SkillGalleryPage));

      ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
        name: 'sidebar.panellist',
        id: PANEL_ID,
        order: SIDEBAR_ORDER,
        locale: NS,
        label: () => t('panel')
      }, SidebarEntryIcon));
    }

    return {
      inject: ['slots', 'locale', 'uiWorkspace', 'timer'],
      apply
    };
  }
});
