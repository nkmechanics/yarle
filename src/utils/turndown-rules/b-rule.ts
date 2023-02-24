// Note: Some time evernote has both <b> and bold in <span>, we just need one. Otherwise, they could cancel each other in Obsidian
export const bRule = {
  filter: ['strong', 'b'],
  replacement: (content: any) => {
    return `**${content.replaceAll('**', '')}**`;
  },
};
