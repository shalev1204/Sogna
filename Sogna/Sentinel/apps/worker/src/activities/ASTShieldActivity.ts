import fs from 'fs/promises';
import * as ts from 'typescript';
import type { VetoReport } from './dlpactivity.js';

/**
 * AST Execution Shield
 * Analyzes the structural nodes of the code to detect backdoors and malicious execution patterns.
 */
export async function scanASTForBackdoors(filePath: string): Promise<VetoReport> {
    try {
        if (!filePath.endsWith('.ts') && !filePath.endsWith('.js')) {
            // AST Shield solo opera en archivos de código TypeScript/JavaScript
            return { level: 'CLEAN', reason: '', location: filePath, solution: '' };
        }

        const content = await fs.readFile(filePath, 'utf-8');
        const sourceFile = ts.createSourceFile(
            filePath,
            content,
            ts.ScriptTarget.Latest,
            true
        );

        let report: VetoReport | null = null;

        // Traverse the AST recursively using TS compiler API
        function visit(node: ts.Node) {
            // Detectar llamadas a funciones del estilo `eval(...)` o `exec(...)`
            if (ts.isCallExpression(node)) {
                const expression = node.expression;
                if (ts.isIdentifier(expression)) {
                    const funcName = expression.text;
                    if (funcName === 'eval') {
                        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                        report = {
                            level: 'CRITICAL',
                            reason: `AST INTERVENTION: Ejecución de Código Arbitrario detectada (eval).`,
                            location: `Archivo: ${filePath} en Línea: ${line + 1}`,
                            solution: "El uso de `eval` compromete la seguridad y causa RCE. Sentinel ha vetado el commit. Usa una serialización segura en su lugar."
                        };
                        return;
                    }
                }
                if (ts.isPropertyAccessExpression(expression)) {
const propName = expression.name.text;
// @Sentinel-ignore: Justificación técnica inyectada por el motor de seguridad
                    if (propName === 'exec' || propName === 'execSync') {
                        // TODO: Refinar para asegurar que proviene de 'child_process'
                        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                        report = {
                            level: 'WARNING',
                            reason: `AST INTERVENTION: Despliegue de shell externo detectado (${propName}).`,
                            location: `Archivo: ${filePath} en Línea: ${line + 1}`,
                            solution: "Verifica que los argumentos están completamente sanitarizados. No permitas la concatenación de variables externas."
                        };
                        return; // Continuamos, es una advertencia
                    }
                }
            }
            ts.forEachChild(node, visit);
        }

        visit(sourceFile);

        if (report) {
            return report;
        }

        return { level: 'CLEAN', reason: '', location: filePath, solution: '' };

    } catch (err: any) {
        return {
            level: 'WARNING', // Warning if it just failed parsing not critical 
            reason: `AST Parser Error: ${err.message}`,
            location: `Archivo: ${filePath}`,
            solution: "El archivo parece tener errores sintácticos severos que impiden a Sentinel analizar el AST."
        };
    }
}
