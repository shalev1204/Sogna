import { login } from "./login.js"
import { deploy } from "./deploy.js"
import { envList, envSet, envRemove } from "./env.js"
import { createRequire } from "module"

const require = createRequire(import.meta.url)
const { version } = require("../package.json.js")

const command = process.argv[2]
const args = process.argv.slice(3)
const hasFlag = (flag: string) => args.includes(flag)
function getFlagValue(flag: string): string | undefined {
  const idx = args.indexOf(flag)
  if (idx === -1 || idx + 1 >= args.length) return undefined
  return args[idx + 1]
}

function showHelp() {
  console.log(`@Assembler/cli v${version} — deploy AI agents\n`)
  console.log("Usage: npx @Assembler/cli <command>\n")
  console.log("Commands:")
  console.log("  login                     Authenticate with Assembler Agents")
  console.log("  deploy                    Bundle and deploy your agent")
  console.log("  env list <agent>          List environment variables")
  console.log("  env set <agent> K V       Set an environment variable")
  console.log("  env remove <agent> K      Remove an environment variable")
  console.log("\nOptions:")
  console.log("  --help, -h              Show help")
  console.log("  --version, -v           Show version")
  console.log("\nEnvironment variables:")
  console.log("  API_KEY_Assembler            API key (skips login prompt)")
  console.log("  API_URL_Assembler            API base URL override")
  console.log("\nGet started: npx @Assembler/cli login")
  console.log("Docs: https://Assembler.dev/agents/docs")
}

function showLoginHelp() {
  console.log("Usage: npx @Assembler/cli login [options]\n")
  console.log("Authenticate with Assembler Agents using an API key.\n")
  console.log("Options:")
  console.log("  --api-key KEY    Pass API key directly (non-interactive)")
  console.log("\nGet your API key at https://Assembler.dev/agents/api-keys")
}

function showDeployHelp() {
  console.log("Usage: npx @Assembler/cli deploy\n")
  console.log("Bundle and deploy agents from the ./agents/ directory.\n")
  console.log("Agent structure:")
  console.log("  agents/")
  console.log("    my-agent/")
  console.log("      index.ts       agent entry point")
  console.log("    another.ts       single-file agent")
  console.log("\nDocs: https://Assembler.dev/agents/docs")
}

function showEnvHelp() {
  console.log("Usage: npx @Assembler/cli env <subcommand> <agent-slug>\n")
  console.log("Manage environment variables for an agent.\n")
  console.log("Subcommands:")
  console.log("  env list <agent>               List all env vars (masked)")
  console.log("  env list <agent> --show-values List all env vars (plain text)")
  console.log("  env set <agent> KEY VALUE      Set or update an env var")
  console.log("  env remove <agent> KEY         Remove an env var")
}

if (command === "login") {
  if (hasFlag("--help") || hasFlag("-h")) {
    showLoginHelp()
  } else {
    await login({ apiKey: getFlagValue("--api-key") })
  }
} else if (command === "deploy") {
  if (hasFlag("--help") || hasFlag("-h")) {
    showDeployHelp()
  } else {
    if (hasFlag("--project")) {
      console.log("Warning: --project flag is no longer used and will be ignored.")
    }
    await deploy()
  }
} else if (command === "env") {
  const subcommand = args[0]
  const subArgs = args.slice(1)
  if (!subcommand || subcommand === "--help" || subcommand === "-h") {
    showEnvHelp()
  } else if (subcommand === "list") {
    await envList(subArgs)
  } else if (subcommand === "set") {
    await envSet(subArgs)
  } else if (subcommand === "remove") {
    await envRemove(subArgs)
  } else {
    console.log(`Unknown env subcommand: ${subcommand}`)
    showEnvHelp()
  }
} else if (command === "--version" || command === "-v") {
  console.log(version)
} else {
  showHelp()
}
