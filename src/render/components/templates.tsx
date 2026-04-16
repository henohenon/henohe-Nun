import type { FC } from 'hono/jsx';
import { raw } from 'hono/html';
import { renderInline } from '../../parser/markdown';
import type { ResolvedSection } from '../../parser/pipeline/render';

export type TemplateProps = {
  heading: string;
  sections: ResolvedSection[];
};

type TemplateEntry = {
  css: string;
  render: FC<TemplateProps>;
};

const DefaultTemplate: FC<TemplateProps> = ({ heading, sections }) => {
  const body = sections.map((s) => s.body).join('');
  return (
    <>
      {heading && <h1 class="slide-title">{heading}</h1>}
      <div class="slide-body body">{raw(body)}</div>
    </>
  );
};

const TitleTemplate: FC<TemplateProps> = ({ heading, sections }) => {
  const subtitle = sections.find((s) => s.heading)?.heading;
  const subtitleHtml = subtitle ? renderInline(subtitle) : '';
  return (
    <>
      <div class="henoheno" id="henoheno-slot" />
      <div class="text">
        <h1 class="title">{heading}</h1>
        {subtitleHtml && <p class="subtitle">{raw(subtitleHtml)}</p>}
      </div>
    </>
  );
};

const MeTemplate: FC<TemplateProps> = ({ heading, sections }) => {
  const body = sections.map((s) => s.body).join('');
  return (
    <>
      <div class="slide-body">
        <div class="left" />
        <div class="right">{raw(body)}</div>
      </div>
      <h1 class="slide-title label">{heading}</h1>
    </>
  );
};

const BigTemplate: FC<TemplateProps> = ({ heading }) => (
  <h1 class="text">{heading}</h1>
);

const SmallTemplate: FC<TemplateProps> = ({ heading }) => (
  <h1 class="text">{heading}</h1>
);

const NoteTemplate: FC<TemplateProps> = ({ heading, sections }) => {
  const caption = sections.find((s) => s.heading)?.heading;
  const captionHtml = caption ? renderInline(caption) : '';
  const body = sections.map((s) => s.body).join('');
  return (
    <>
      <h1 class="slide-title">{heading}</h1>
      <div class="slide-body body">
        <div class="body-center">{raw(body)}</div>
        {captionHtml && (
          <div class="body-bottom">
            <p>{raw(captionHtml)}</p>
          </div>
        )}
      </div>
    </>
  );
};

const RowTemplate: FC<TemplateProps> = ({ heading, sections }) => {
  const blocks = sections.filter((s) => s.heading !== undefined || s.body.trim());
  return (
    <>
      {heading && <h1 class="slide-title">{heading}</h1>}
      <div class="slide-body blocks">
        {blocks.map((s) => (
          <div class="row-block">
            {s.heading && <h2>{s.heading}</h2>}
            {raw(s.body)}
          </div>
        ))}
      </div>
    </>
  );
};

export const templates: Record<string, TemplateEntry> = {
  default: { css: 'template-default', render: DefaultTemplate },
  title: { css: 'template-title', render: TitleTemplate },
  hero: { css: 'template-title', render: TitleTemplate },
  me: { css: 'template-me', render: MeTemplate },
  big: { css: 'template-big', render: BigTemplate },
  small: { css: 'template-small', render: SmallTemplate },
  note: { css: 'template-note', render: NoteTemplate },
  row: { css: 'template-row', render: RowTemplate },
};
