# OpenAgentVisualizer — Tool Registry

## Shared Tools

Available to all agents unless restricted in PERMISSIONS.md.

| Tool | Description | Usage |
|------|-------------|-------|
| **Read** | Read file contents from the local filesystem | Access source files, configs, documentation |
| **Write** | Write new files to the local filesystem | Create new deliverables, configs |
| **Edit** | Perform exact string replacements in existing files | Modify existing code, configs, documentation |
| **Grep** | Search file contents using regex patterns | Find code patterns, references, usages |
| **Glob** | Find files by name/path pattern | Locate files across the codebase |
| **Git** | Version control operations (branch, commit, diff, log, status) | Branch management, change tracking |
| **Claude Code** | AI-assisted code generation and analysis | Complex reasoning, code generation, review assistance |
| **WebSearch** | Search the web for information | Research PixiJS patterns, XState best practices, OTLP specs, gamification design |

## Engineering Tools

Available to engineering-track agents only.

| Tool | Description | Usage |
|------|-------------|-------|
| **Bash** | Execute shell commands | Build, test, lint, run scripts, environment setup |
| **CI/CD (GitHub Actions)** | Pipeline execution, deployment triggers | Automated testing, build verification, deployment |
| **Test Runners** | Execute test suites (Vitest, Pytest) | Unit tests, integration tests, E2E tests |
| **Linters** | Code quality checks (ESLint, Prettier, Ruff) | Style enforcement, static analysis |
| **PR Review** | Create and review pull requests | Code review workflow, merge management |

## Specialized Tools — OpenAgentVisualizer

Domain-specific tools for OpenAgentVisualizer development and validation.

| Tool | Description | Usage |
|------|-------------|-------|
| **Canvas Render Benchmarker** | Benchmark PixiJS virtual world canvas performance | Measure FPS at various agent counts (10, 25, 50+), sprite batch efficiency, memory usage, GSAP animation overhead |
| **XState FSM Validator** | Validate agent state machine definitions | Test state transitions, guard conditions, verify no unreachable states, check for deadlocks in agent lifecycle FSMs |
| **WebSocket Load Tester** | Test WebSocket real-time pipeline under load | Simulate 100+ concurrent connections, measure event delivery latency, verify reconnection handling, test backpressure |
| **OTLP Ingestion Tester** | Validate OTLP span ingestion pipeline | Send test spans via gRPC (4317) and HTTP (4318), verify span-to-event mapping, validate attribute extraction, measure throughput |
| **Gamification Engine Tester** | Test gamification mechanics | Validate XP calculations, level progression, achievement triggers, idempotency of event processing, edge cases (duplicate events, concurrent awards) |
| **Redis Streams Validator** | Validate event pipeline through Redis Streams | Test consumer group behavior, verify event ordering, simulate consumer lag, validate backpressure handling |
| **SDK Adapter Tester** | Test Python SDK framework adapters | Validate LangChain, CrewAI, AutoGen, OpenAI, Anthropic adapters emit correct events, test PII redaction, ring buffer batching |
| **Loop Detector Tester** | Validate agent loop detection logic | Inject deliberate loop patterns, verify detection triggers within configured window, validate alert generation |
| **Session Replay Validator** | Test session replay API and frontend | Verify historical event retrieval, timeline scrubbing, event filtering, causal ordering in replay |
| **Animation Performance Profiler** | Profile GSAP and Rive animation performance | Measure animation frame budget, identify jank sources, validate Rive .riv asset loading, GSAP timeline memory usage |

## Tool Categories by Purpose

| Purpose | Tools |
|---------|-------|
| **File Operations** | Read, Write, Edit, Glob, Grep |
| **Version Control** | Git, PR Review |
| **Build & Test** | Bash, CI/CD, Test Runners, Linters |
| **Rendering Validation** | Canvas Render Benchmarker, Animation Performance Profiler, XState FSM Validator |
| **Real-Time Pipeline** | WebSocket Load Tester, Redis Streams Validator, OTLP Ingestion Tester |
| **Gamification Testing** | Gamification Engine Tester, Loop Detector Tester |
| **SDK Validation** | SDK Adapter Tester |
| **Replay Testing** | Session Replay Validator |
| **Research** | WebSearch |
