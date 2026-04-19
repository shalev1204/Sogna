use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum Decision {
    Allow,
    Deny,
    RequireApproval,
    Veto,
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
pub enum CommandIntent {
    ReadOnly,
    Write,
    Destructive,
    Network,
    ProcessManagement,
    PackageManagement,
    SystemAdmin,
    Unknown,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PolicyRule {
    pub name: String,
    pub priority: u32,
    pub condition: String,
    pub action: Decision,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ToolContext {
    pub tool_name: String,
    pub arguments: serde_json::Value,
    pub trust_score: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EvaluationResult {
    pub decision: Decision,
    pub reason: String,
    pub modified_arguments: Option<serde_json::Value>,
}

pub struct PolicyEngine {
    rules: Vec<PolicyRule>,
}

impl PolicyEngine {
    pub fn new() -> Self {
        Self {
            rules: vec![
                PolicyRule {
                    name: "Critical File Guard".into(),
                    priority: 100,
                    condition: "target_path.contains('config/secret')".into(),
                    action: Decision::Deny,
                },
                PolicyRule {
                    name: "Unknown Tool Veto".into(),
                    priority: 50,
                    condition: "trust_score < 0.5".into(),
                    action: Decision::RequireApproval,
                },
            ],
        }
    }

    pub fn classify_command(&self, command: &str) -> CommandIntent {
        let first = command.trim().split_whitespace().next().unwrap_or("");
        
        match first {
            "ls" | "cat" | "grep" | "find" | "head" | "tail" | "diff" | "stat" => CommandIntent::ReadOnly,
            "cp" | "mv" | "touch" | "mkdir" | "chmod" | "chown" => CommandIntent::Write,
            "rm" | "shred" | "truncate" | "wipefs" => CommandIntent::Destructive,
            "apt" | "apt-get" | "npm" | "pnpm" | "pip" | "cargo" | "brew" => CommandIntent::PackageManagement,
            "kill" | "pkill" | "killall" | "systemctl" | "service" => CommandIntent::ProcessManagement,
            "curl" | "wget" | "ssh" | "scp" | "git" => CommandIntent::Network,
            "sudo" | "mount" | "umount" => CommandIntent::SystemAdmin,
            _ => CommandIntent::Unknown,
        }
    }

    pub fn evaluate(&self, context: &ToolContext) -> EvaluationResult {
        let mut modified_args = context.arguments.clone();
        let mut modification_made = false;

        // 1. Structural File Guard
        if context.tool_name == "write_to_file" {
            if let Some(path) = context.arguments.get("TargetFile").and_then(|v| v.as_str()) {
                if path.contains(".env") || path.contains("secret") {
                    return EvaluationResult {
                        decision: Decision::Deny,
                        reason: format!("Executive Veto: Access to sensitive file '{}' is forbidden.", path),
                        modified_arguments: None,
                    };
                }
            }
        }

        // 2. Shell Command Policy & Auto-Fixing
        if context.tool_name == "run_command" || context.tool_name == "shell_exec" {
            if let Some(command) = context.arguments.get("CommandLine").and_then(|v| v.as_str()) {
                let intent = self.classify_command(command);
                
                // Auto-Fix: Inject -y for package managers if missing and trust is high
                if intent == CommandIntent::PackageManagement && context.trust_score > 0.7 {
                    if (command.contains("install") || command.contains("upgrade")) && !command.contains("-y") {
                        let new_cmd = if command.contains("apt") {
                            if command.contains("install") {
                                command.replace("install", "install -y")
                            } else {
                                command.replace("upgrade", "upgrade -y")
                            }
                        } else {
                            command.to_owned()
                        };

                        if new_cmd != command {
                            modified_args["CommandLine"] = serde_json::Value::String(new_cmd);
                            modification_made = true;
                        }
                    }
                }

                if intent == CommandIntent::Destructive && context.trust_score < 0.9 {
                    return EvaluationResult {
                        decision: Decision::RequireApproval,
                        reason: format!("Executive Veto: Destructive command detected with insufficient trust score."),
                        modified_arguments: None,
                    };
                }
            }
        }

        if context.trust_score < 0.3 {
            return EvaluationResult {
                decision: Decision::RequireApproval,
                reason: "Executive Veto: Insufficient trust score for autonomous execution.".into(),
                modified_arguments: None,
            };
        }

         EvaluationResult {
            decision: if modification_made { Decision::Veto } else { Decision::Allow },
            reason: if modification_made { "Executive Optimized: Arguments adjusted for autonomous flow." } else { "Executive Clear: Autonomous execution permitted." }.into(),
            modified_arguments: if modification_made { Some(modified_args) } else { None },
        }
    }
}
