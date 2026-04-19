import chalk from 'chalk';

/**
 * MarkdownRenderer: A high-fidelity terminal renderer for Sogna.
 * Implements "Institutional" patterns from Claude-Code for robust terminal output.
 */
export class MarkdownRenderer {
  private static instance: MarkdownRenderer;

  private constructor() {}

  public static getInstance(): MarkdownRenderer {
    if (!this.instance) {
      this.instance = new MarkdownRenderer();
    }
    return this.instance;
  }

  /**
   * Renders markdown with syntax highlighting, nested fence fixes, and premium styling.
   */
  public render(markdown: string): string {
    let rendered = markdown;

    // 1. NESTED FENCE FIX
    // If we detect backticks inside what should be a code block, 
    // we ensure the outer boundary uses MORE backticks than the inner content.
    rendered = this.fixNestedFences(rendered);

    // 2. SYNTAX BACKGROUNDS
    // We wrap code blocks in a subtle grey background to make them stand out.
    rendered = this.applyCodeBackgrounds(rendered);

    // 3. TITLE STYLING
    rendered = rendered.replace(/^# (.*$)/gm, (match, title) => chalk.bold.underline.blue(title));
    rendered = rendered.replace(/^## (.*$)/gm, (match, title) => chalk.bold.cyan(title));

    // 4. INLINE CODE
    rendered = rendered.replace(/`([^`]+)`/g, (match, code) => chalk.bgRgb(40, 44, 52).yellow(code));

    return rendered;
  }

  /**
   * Fixes nested fences by ensuring outer blocks have more backticks than inner blocks.
   * Institutional logic for "Claw-Mode" compatibility.
   */
  private fixNestedFences(text: string): string {
    return text.replace(/```([\s\S]*?)```/g, (match, content) => {
      if (content.includes('```')) {
        return `\n\x1b[1m\x1b[36m(Fixed Nested Fence)\x1b[0m\n\n\`\`\`\`${content}\`\`\`\``;
      }
      return match;
    });
  }

  /**
   * Applies subtle background colors to code blocks for a premium feel.
   */
  private applyCodeBackgrounds(text: string): string {
    return text.replace(/```(\w+)?\n([\s\S]*?)\n```/g, (match, lang, content) => {
      const header = chalk.bgRgb(60, 60, 60).white(` ${lang || 'text'} `);
      const lines = content.split('\n').map((line: string) => {
        // Apply background to the whole line (padded)
        return chalk.bgRgb(30, 30, 30)(`  ${line}  `);
      }).join('\n');
      
      return `\n${header}\n${lines}\n`;
    });
  }
}
