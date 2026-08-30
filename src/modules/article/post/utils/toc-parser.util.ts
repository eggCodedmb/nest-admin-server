export interface TocItem {
  id: string;
  text: string;
  level: number;
  children: TocItem[];
}

/**
 * 解析 Markdown 文本，提取标题生成 TOC 树形结构
 */
export function parseMarkdownToc(markdown: string): TocItem[] {
  if (!markdown) return [];

  const flatToc: { id: string; text: string; level: number }[] = [];
  const lines = markdown.split('\n');
  let headingIndex = 0;

  // 匹配形如 # 一级标题, ## 二级标题 等
  const headingRegex = /^(#{1,6})\s+(.+)$/;

  for (const line of lines) {
    const match = line.trim().match(headingRegex);
    if (match) {
      headingIndex++;
      const level = match[1].length;
      const text = match[2].trim().replace(/[*_~`]/g, ''); // 去除简单的 Markdown 格式符号
      const id = `heading-${headingIndex}`;
      flatToc.push({ id, text, level });
    }
  }

  // 扁平数组转为嵌套树结构
  const root: TocItem[] = [];
  const stack: TocItem[] = [];

  flatToc.forEach((item) => {
    const node: TocItem = { ...item, children: [] };
    while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
      stack.pop();
    }
    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }
    stack.push(node);
  });

  return root;
}
