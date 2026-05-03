import { SognaEventBus, SognaEventType, FailureClass, EventProvenance } from './events/SognaEventBus.js';

export enum SummaryPriority {
  RETAIN = 0,    // High stakes: Scope, Goal, Current Task
  STRATEGIC = 1, // Strategic: Headers, Architecture decisions
  TACTICAL = 2,  // Tactical: Bullet points, tool summaries
  VERBOSE = 3    // Verbose: Raw logs, tool observations
}

export interface CompressedResult {
  content: string;
  originalSize: number;
  compressedSize: number;
  reductionPercentage: number;
}

export class SummaryCompressor {
  private static readonly BUDGET_CHARS = 2000;
  private static readonly PRUNING_MARKER = '... [PRUNED FOR CONTEXT EFFICIENCY] ...';

  /**
   * Compresses a block of text based on priority rules.
   */
  public static compress(text: string, emitter: string): CompressedResult {
    const originalSize = text.length;
    if (originalSize <= this.BUDGET_CHARS) {
      return { content: text, originalSize, compressedSize: originalSize, reductionPercentage: 0 };
    }

    const lines = text.split('\n');
    const prioritizedLines = lines.map(line => ({
      text: line,
      priority: this.getPriority(line)
    }));

    // We start by stripping Priority 3 (Verbose)
    let currentContent = this.assemble(prioritizedLines, SummaryPriority.VERBOSE);
    
    if (currentContent.length > this.BUDGET_CHARS) {
      // If still too long, strip Priority 2 (Tactical)
      currentContent = this.assemble(prioritizedLines, SummaryPriority.TACTICAL);
    }

    if (currentContent.length > this.BUDGET_CHARS) {
      // If STILL too long, strip Priority 1 (Strategic) - Keep only RETAIN
      currentContent = this.assemble(prioritizedLines, SummaryPriority.STRATEGIC);
    }

    const compressedSize = currentContent.length;
    const reductionPercentage = Math.round(((originalSize - compressedSize) / originalSize) * 100);

    SognaEventBus.getInstance().publish({
      type: SognaEventType.SUMMARY,
      emitter,
      failureClass: FailureClass.NONE,
      provenance: EventProvenance.LIVE,
      data: {
        originalSize,
        compressedSize,
        reductionPercentage
      }
    });

    return {
      content: currentContent,
      originalSize,
      compressedSize,
      reductionPercentage
    };
  }

  private static getPriority(line: string): SummaryPriority {
    const trimmed = line.trim().toLowerCase();
    
    // Priority 0: Essential State
    if (trimmed.startsWith('scope:') || 
        trimmed.startsWith('goal:') || 
        trimmed.startsWith('current task:') || 
        trimmed.startsWith('pending:')) {
      return SummaryPriority.RETAIN;
    }

    // Priority 1: Semantic Structure
    if (trimmed.startsWith('#')) {
      return SummaryPriority.STRATEGIC;
    }

    // Priority 2: Action Summaries
    if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
      return SummaryPriority.TACTICAL;
    }

    return SummaryPriority.VERBOSE;
  }

  private static assemble(lines: { text: string; priority: SummaryPriority }[], maxPriorityToPrune: SummaryPriority): string {
    return lines
      .map(line => {
        if (line.priority >= maxPriorityToPrune && line.priority !== SummaryPriority.RETAIN) {
            // Prune if priority is higher or equal to threshold
            return null; 
        }
        return line.text;
      })
      .filter(l => l !== null)
      .join('\n')
      .replace(/\n{3,}/g, '\n\n'); // Normalize spacing
  }
}
