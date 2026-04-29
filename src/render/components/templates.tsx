import type { FC } from 'hono/jsx';
import type { HtmlEscapedString } from 'hono/utils/html';
import { raw } from 'hono/html';
import { renderInline } from '../../parser/markdown';
import type { ResolvedArticle } from '../../parser/pipeline/render';

/* ─── CSS class mapping ───────────────────────────────────────────────────── */

export const templateCSS: Record<string, string> = {
  default: 'template-default',
  title: 'template-title',
  me: 'template-me',
  big: 'template-big',
  small: 'template-small',
  note: 'template-note',
};

/* ─── Shared helpers ──────────────────────────────────────────────────────── */

type ArticleContentProps = { article: ResolvedArticle };

function Heading({ level, children }: { level: number; children: string }) {
  const Tag = `h${level}` as 'h1';
  return <Tag>{children}</Tag>;
}

function BodyContent({ article: a }: ArticleContentProps): HtmlEscapedString {
  return (
    <>
      {a.body.trim() && raw(a.body)}
      {a.children.length > 0 && renderArticles(a.children)}
    </>
  ) as HtmlEscapedString;
}

/* ─── Template content renderers ──────────────────────────────────────────── */

const DefaultContent: FC<ArticleContentProps> = ({ article: a }) => {
  const hasContent = a.body.trim() || a.children.length > 0;
  return (
    <>
      {a.heading && <Heading level={a.headingLevel}>{a.heading}</Heading>}
      {hasContent && (
        <div class={['body', ...a.bodyClasses].join(' ')}>
          <BodyContent article={a} />
        </div>
      )}
    </>
  );
};

const MeContent: FC<ArticleContentProps> = ({ article: a }) => {
  const hasContent = a.body.trim() || a.children.length > 0;
  return (
    <>
      {a.heading && <Heading level={a.headingLevel}>{a.heading}</Heading>}
      {hasContent && (
        <div class={['body', ...a.bodyClasses].join(' ')}>
          <div class="left">
            {a.icon && <img class={['icon', ...(a.iconOptions ?? [])].join(' ')} src={a.icon} alt="" />}
          </div>
          <div class="right">
            <BodyContent article={a} />
          </div>
        </div>
      )}
    </>
  );
};

const NoteContent: FC<ArticleContentProps> = ({ article: a }) => {
  const hasContent = a.body.trim() || a.children.length > 0;
  const captionHtml = a.caption ? renderInline(a.caption) : '';
  return (
    <>
      {a.heading && <Heading level={a.headingLevel}>{a.heading}</Heading>}
      {hasContent && (
        <div class={['body', ...a.bodyClasses].join(' ')}>
          <div class="body-center">
            <BodyContent article={a} />
          </div>
          {captionHtml && (
            <div class="body-bottom">
              <p>{raw(captionHtml)}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

const TitleContent: FC<ArticleContentProps> = ({ article: a }) => {
  const subtitle = a.children.find((c) => c.heading)?.heading;
  const subtitleHtml = subtitle ? renderInline(subtitle) : '';
  return (
    <>
      <div class="henoheno" id="henoheno-slot" />
      <div class="text">
        {a.heading && <h1 class="title">{a.heading}</h1>}
        {subtitleHtml && <p class="subtitle">{raw(subtitleHtml)}</p>}
      </div>
    </>
  );
};

const CenteredContent: FC<ArticleContentProps> = ({ article: a }) => (
  <>{a.heading && <h1 class="text">{a.heading}</h1>}</>
);

const templateContent: Record<string, FC<ArticleContentProps>> = {
  default: DefaultContent,
  title: TitleContent,
  me: MeContent,
  big: CenteredContent,
  small: CenteredContent,
  note: NoteContent,
};

/* ─── Article rendering ───────────────────────────────────────────────────── */

function renderArticle(a: ResolvedArticle): HtmlEscapedString {
  const cls = [a.template !== 'default' ? a.template : '', ...a.classes].filter(Boolean);
  const style = Object.entries(a.vars)
    .map(([k, v]) => `--${k}:${v}`)
    .join(';');
  const Content = templateContent[a.template] ?? templateContent.default;
  return (
    <article class={cls.join(' ') || undefined} style={style || undefined}>
      <Content article={a} />
    </article>
  ) as HtmlEscapedString;
}

export function renderArticles(articles: ResolvedArticle[]): HtmlEscapedString[] {
  return articles
    .filter((a) => a.heading !== undefined || a.body.trim() || a.children.length > 0)
    .map(renderArticle);
}
