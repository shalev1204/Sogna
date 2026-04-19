import { SognaEventBus, SognaEventType, FailureClass, EventProvenance } from './events/SognaEventBus.js';
export var SummaryPriority;
(function (SummaryPriority) {
    SummaryPriority[SummaryPriority["RETAIN"] = 0] = "RETAIN";
    SummaryPriority[SummaryPriority["STRATEGIC"] = 1] = "STRATEGIC";
    SummaryPriority[SummaryPriority["TACTICAL"] = 2] = "TACTICAL";
    SummaryPriority[SummaryPriority["VERBOSE"] = 3] = "VERBOSE"; // Verbose: Raw logs, tool observations
})(SummaryPriority || (SummaryPriority = {}));
export class SummaryCompressor {
    static BUDGET_CHARS = 2000;
    static PRUNING_MARKER = '... [PRUNED FOR CONTEXT EFFICIENCY] ...';
    /**
     * Compresses a block of text based on priority rules.
     */
    static compress(text, emitter) {
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
    static getPriority(line) {
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
    static assemble(lines, maxPriorityToPrune) {
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
