import { BusinessBlueprintRegistry, BusinessBlueprint } from './businessblueprintregistry.js';
import { ProjectManager } from '../studio/projectmanager.js';
import { FinanceHub } from '../finance/financehub.js';

export class BusinessOrchestrator {
    static async startWorld(id: string, blueprintId: string): Promise<string> {
        const blueprint = BusinessBlueprintRegistry.getBlueprint(blueprintId);
        if (!blueprint) throw new Error(`Blueprint ${blueprintId} not found.`);

        // 1. Initialize as a generic project but with business metadata
        const project = ProjectManager.initializeProject(id, blueprintId);
        project.metadata.type = 'business';
        project.metadata.blueprint_details = blueprint;
        
        ProjectManager.saveProject(project);

        return `World "${id}" initialized using ${blueprint.name}. Starting stage: ${blueprint.stages[0].name}`;
    }

    static async executeStage(id: string) {
        const project = ProjectManager.getProject(id);
        if (!project || project.metadata.type !== 'business') {
            throw new Error(`Business project ${id} not found.`);
        }

        const blueprint = project.metadata.blueprint_details as BusinessBlueprint;
        const currentStageIdx = blueprint.stages.findIndex(s => s.name === project.current_stage) || 0;
        const stage = blueprint.stages[currentStageIdx];

        // LOGIC: Here we would trigger the actual skills based on stage.action
        // For now, we simulate the advancement and logging.
        
        const finance = FinanceHub.getInstance();
        finance.recordExpense(10, `Stage: ${stage.name}`);

        return `Executing ${stage.name}... [Simulated Action: ${stage.action}]`;
    }
}
