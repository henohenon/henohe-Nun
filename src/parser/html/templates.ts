// Template functions: each returns an HTML string for the slide inner content

import { renderInline } from '../markdown';
import { esc } from './parts';
import type { ResolvedSection } from '../pipeline/render';

type TemplateInput = {
  heading: string;
  sections: ResolvedSection[];
};

type TemplateFn = (input: TemplateInput) => string;

const defaultTemplate: TemplateFn = ({ heading, sections }) => {
  const body = sections.map((s) => s.body).join('');
  return `<div class="template-shell">${
    heading ? `<h2 class="slide-title">${esc(heading)}</h2>` : ''
  }<div class="slide-body body">${body}</div></div>`;
};

const titleTemplate: TemplateFn = ({ heading, sections }) => {
  // First ## section heading = subtitle
  const subtitle = sections.find((s) => s.heading)?.heading;
  const subtitleHtml = subtitle ? renderInline(subtitle) : '';
  return [
    '<div class="template-title">',
    '<div class="henoheno" id="henoheno-slot"></div>',
    '<div class="text">',
    `<h1 class="title">${esc(heading)}</h1>`,
    subtitleHtml ? `<p class="subtitle">${subtitleHtml}</p>` : '',
    '</div></div>',
  ].join('');
};

const meTemplate: TemplateFn = ({ heading, sections }) => {
  // First section = icon area (may contain an image), rest = body
  const body = sections.map((s) => s.body).join('');
  return [
    '<div class="template-me">',
    '<div class="slide-body">',
    '<div class="left"></div>',
    `<div class="right">${body}</div>`,
    '</div>',
    `<h2 class="slide-title label">${esc(heading)}</h2>`,
    '</div>',
  ].join('');
};

const bigTemplate: TemplateFn = ({ heading }) =>
  `<div class="template-big"><h2 class="text">${esc(heading)}</h2></div>`;

const smallTemplate: TemplateFn = ({ heading }) =>
  `<div class="template-small"><h2 class="text">${esc(heading)}</h2></div>`;

const noteTemplate: TemplateFn = ({ heading, sections }) => {
  // First ## heading = caption (below body)
  const caption = sections.find((s) => s.heading)?.heading;
  const captionHtml = caption ? renderInline(caption) : '';
  const body = sections.map((s) => s.body).join('');
  return [
    '<div class="template-shell">',
    `<h2 class="slide-title">${esc(heading)}</h2>`,
    '<div class="slide-body body">',
    `<div class="body-center">${body}</div>`,
    captionHtml ? `<div class="body-bottom"><p>${captionHtml}</p></div>` : '',
    '</div></div>',
  ].join('');
};

const rowTemplate: TemplateFn = ({ heading, sections }) => {
  // Each ## section = a horizontal block
  const blocks = sections
    .filter((s) => s.heading !== undefined || s.body.trim())
    .map((s) => `<div class="row-block">${s.heading ? `<h2>${esc(s.heading)}</h2>` : ''}${s.body}</div>`);
  return [
    '<div class="template-shell">',
    heading ? `<h2 class="slide-title">${esc(heading)}</h2>` : '',
    `<div class="slide-body blocks">${blocks.join('')}</div>`,
    '</div>',
  ].join('');
};

export const templates: Record<string, TemplateFn> = {
  default: defaultTemplate,
  title: titleTemplate,
  hero: titleTemplate,
  me: meTemplate,
  big: bigTemplate,
  small: smallTemplate,
  note: noteTemplate,
  row: rowTemplate,
};
