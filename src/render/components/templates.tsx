import type { FC } from 'hono/jsx';
import { raw } from 'hono/html';
import { renderInline } from '../../parser/markdown';
import type { ResolvedSection } from '../../parser/pipeline/render';

type TemplateProps = {
  heading: string;
  sections: ResolvedSection[];
};

const DefaultTemplate: FC<TemplateProps> = ({ heading, sections }) => {
  const body = sections.map((s) => s.body).join('');
  return (
    <div class="template-shell">
      {heading && <h2 class="slide-title">{heading}</h2>}
      <div class="slide-body body">{raw(body)}</div>
    </div>
  );
};

const TitleTemplate: FC<TemplateProps> = ({ heading, sections }) => {
  const subtitle = sections.find((s) => s.heading)?.heading;
  const subtitleHtml = subtitle ? renderInline(subtitle) : '';
  return (
    <div class="template-title">
      <div class="henoheno" id="henoheno-slot" />
      <div class="text">
        <h1 class="title">{heading}</h1>
        {subtitleHtml && <p class="subtitle">{raw(subtitleHtml)}</p>}
      </div>
    </div>
  );
};

const MeTemplate: FC<TemplateProps> = ({ heading, sections }) => {
  const body = sections.map((s) => s.body).join('');
  return (
    <div class="template-me">
      <div class="slide-body">
        <div class="left" />
        <div class="right">{raw(body)}</div>
      </div>
      <h2 class="slide-title label">{heading}</h2>
    </div>
  );
};

const BigTemplate: FC<TemplateProps> = ({ heading }) => (
  <div class="template-big">
    <h2 class="text">{heading}</h2>
  </div>
);

const SmallTemplate: FC<TemplateProps> = ({ heading }) => (
  <div class="template-small">
    <h2 class="text">{heading}</h2>
  </div>
);

const NoteTemplate: FC<TemplateProps> = ({ heading, sections }) => {
  const caption = sections.find((s) => s.heading)?.heading;
  const captionHtml = caption ? renderInline(caption) : '';
  const body = sections.map((s) => s.body).join('');
  return (
    <div class="template-shell">
      <h2 class="slide-title">{heading}</h2>
      <div class="slide-body body">
        <div class="body-center">{raw(body)}</div>
        {captionHtml && (
          <div class="body-bottom">
            <p>{raw(captionHtml)}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const RowTemplate: FC<TemplateProps> = ({ heading, sections }) => {
  const blocks = sections.filter((s) => s.heading !== undefined || s.body.trim());
  return (
    <div class="template-shell">
      {heading && <h2 class="slide-title">{heading}</h2>}
      <div class="slide-body blocks">
        {blocks.map((s) => (
          <div class="row-block">
            {s.heading && <h2>{s.heading}</h2>}
            {raw(s.body)}
          </div>
        ))}
      </div>
    </div>
  );
};

export const templates: Record<string, FC<TemplateProps>> = {
  default: DefaultTemplate,
  title: TitleTemplate,
  hero: TitleTemplate,
  me: MeTemplate,
  big: BigTemplate,
  small: SmallTemplate,
  note: NoteTemplate,
  row: RowTemplate,
};
