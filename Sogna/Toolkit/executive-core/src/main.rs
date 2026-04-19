mod engine;

use engine::{PolicyEngine, ToolContext};
use std::io::{self, Read};

fn main() -> anyhow::Result<()> {
    // Read JSON from stdin
    let mut buffer = String::new();
    io::stdin().read_to_string(&mut buffer)?;

    if buffer.trim().is_empty() {
        return Ok(());
    }

    let context: ToolContext = serde_json::from_str(&buffer)?;
    
    let engine = PolicyEngine::new();
    let result = engine.evaluate(&context);

    // Write result to stdout
    println!("{}", serde_json::to_string(&result)?);

    Ok(())
}
