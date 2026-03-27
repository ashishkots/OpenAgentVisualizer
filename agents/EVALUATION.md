# OpenAgentVisualizer — Evaluation & Quality Gates

## Per-Role Quality Gates

### Product Manager
| Criterion | Threshold | Measurement |
|-----------|-----------|-------------|
| Requirements coverage | 100% of active user stories have acceptance criteria | Checklist verification |
| Virtual world scope | Canvas feature scope decided and documented (read-only viz vs. interactive) | Scope document |
| Gamification mechanics | XP formulas, level thresholds, and achievement conditions defined with specific numbers | Mechanics spec review |
| Acceptance criteria testability | Every acceptance criterion is falsifiable and measurable | QA Engineer validation |
| Confidence | Must declare HIGH to proceed; MEDIUM triggers Tech Lead review | Self-assessment |

### UX Designer
| Criterion | Threshold | Measurement |
|-----------|-----------|-------------|
| Wireframe coverage | All user-facing screens have wireframes (virtual world, dashboard, replay, alerts, settings) | Wireframe inventory |
| Agent interaction flows | Avatar click, hover, drag, and context menu behaviors defined | Interaction spec review |
| Dashboard information architecture | Widget layout, data hierarchy, and navigation defined | IA review |
| Replay UX | Timeline scrubbing, event filtering, and playback controls specified | Replay spec review |
| Accessibility | WCAG 2.1 AA considerations documented for canvas interactions | Accessibility checklist |

### UI Designer
| Criterion | Threshold | Measurement |
|-----------|-----------|-------------|
| Design token coverage | Color, typography, spacing, and animation tokens defined | Token inventory |
| Agent avatar specs | Visual states (idle, active, waiting, error, complete) with distinct visual treatments | Avatar spec review |
| Animation timing | GSAP timeline specs for state transitions, spawn/despawn, and interaction feedback | Animation spec review |
| Rive asset requirements | .riv file specifications for each animated element | Asset requirement doc |
| Dark/light mode | Both themes defined with canvas-compatible color palettes | Theme review |

### Tech Lead
| Criterion | Threshold | Measurement |
|-----------|-----------|-------------|
| Architecture covers all user stories | 1:1 mapping from active US to architectural components | Traceability matrix |
| PixiJS scene graph design | Container hierarchy, render layers, culling strategy documented | Architecture review |
| XState FSM architecture | All agent states, transitions, and guards defined | FSM review |
| Real-time pipeline design | Redis Streams -> Celery -> WebSocket flow documented with backpressure handling | Pipeline review |
| OTLP ingestion architecture | gRPC/HTTP receiver, span-to-event mapping documented | Architecture review |
| Cross-product integration points | OpenTrace, OpenHandoff, OpenMind interfaces defined | API contract review |
| Technical debt identification | Known shortcuts and future work documented | ADR review |

### Frontend Expert
| Criterion | Threshold | Measurement |
|-----------|-----------|-------------|
| Canvas rendering | 50+ agent avatars render at 60fps | FPS benchmark |
| XState integration | Agent FSMs correctly transition through all states on event receipt | State machine test |
| GSAP animations | State transitions animate smoothly within 16ms frame budget | Animation profiling |
| WebSocket client | Reconnects automatically, handles backpressure, delivers events in order | WebSocket test |
| Zustand stores | State management is correct, no unnecessary re-renders | Store test |
| ReactFlow topology | Node graph renders correctly with agent connections | Graph test |
| Responsive layout | Dashboard and canvas work on 1280px+ viewports | Viewport test |

### Backend Expert
| Criterion | Threshold | Measurement |
|-----------|-----------|-------------|
| OTLP receiver | gRPC (4317) and HTTP (4318) endpoints accept and process spans | Ingestion test |
| Redis Streams pipeline | Events flow from ingestion to WebSocket without data loss | Pipeline test |
| Celery background tasks | Tasks execute reliably with retry on failure | Task test |
| Gamification engine | XP calculations correct, idempotent, no duplicate awards | Gamification test |
| Cost tracking | Per-agent cost attribution produces accurate reports | Cost test |
| Metrics aggregation | Dashboard metrics computed correctly from raw events | Metrics test |
| Alert management | Alerts fire on configured conditions, no false positives in baseline | Alert test |
| Session replay API | Historical events retrievable with correct ordering | Replay API test |
| WebSocket server | Handles 100+ concurrent connections, delivers events within 2 seconds | WebSocket test |

### Code Reviewer
| Criterion | Threshold | Measurement |
|-----------|-----------|-------------|
| Review coverage | 100% of changed files reviewed | PR diff analysis |
| Finding categorization | All findings classified as CRITICAL / MAJOR / MINOR / INFO | Finding report |
| Security patterns checked | Auth, input validation, PII handling, WebSocket auth verified | Security checklist |
| Code standards compliance | Consistent style, naming, documentation per project standards | Linter + manual review |
| No self-approval | Reviewer is never the author of the reviewed code | Git history verification |

### QA Engineer
| Criterion | Threshold | Measurement |
|-----------|-----------|-------------|
| Test coverage | >= 80% line coverage for new code | Coverage report |
| Acceptance criteria validation | All acceptance criteria from PM tested with pass/fail results | Test results matrix |
| Canvas rendering benchmark | 50+ agents at 60fps confirmed | Benchmark report |
| WebSocket reliability | > 99% event delivery rate under load | Reliability test |
| OTLP ingestion | gRPC and HTTP endpoints handle malformed/oversized spans gracefully | Ingestion test |
| Gamification edge cases | Duplicate events, concurrent awards, disconnect scenarios tested | Edge case report |
| Loop detection | Deliberate loops detected and alerted within configured window | Detection test |
| SDK adapters | All 5 framework adapters (LangChain, CrewAI, AutoGen, OpenAI, Anthropic) emit correct events | Adapter test |
| Regression testing | No pre-existing tests broken by new changes | CI/CD pipeline results |

### Agentic AI Expert
| Criterion | Threshold | Measurement |
|-----------|-----------|-------------|
| SDK adapter correctness | All framework adapters map agent states to XState FSM model correctly | Adapter test |
| OTLP conformance | Emitted spans conform to OpenTelemetry specification | Conformance test |
| Agent lifecycle mapping | Framework-specific agent states correctly translate to OAV states | Lifecycle test |
| Loop detection logic | Detection algorithm identifies known loop patterns without false positives | Algorithm test |
| PII redaction | SDK PII redactor handles all configured patterns | Redaction test |
| Event emission fidelity | No event data corruption across SDK -> OTLP -> backend pipeline | Fidelity test |

### DevOps Platform
| Criterion | Threshold | Measurement |
|-----------|-----------|-------------|
| CI/CD pipeline functional | Build, test, lint, deploy stages all pass | Pipeline execution log |
| Docker Compose stack healthy | PostgreSQL + TimescaleDB + Redis + Celery + backend + frontend all start and pass health checks | Stack health verification |
| Deployment artifact validity | Artifacts deployable to staging environment | Deployment verification |
| Infrastructure-as-code | All infrastructure defined in code, no manual config | IaC audit |
| Rollback capability | Deployment can be rolled back within 5 minutes | Rollback drill |

### Project Manager
| Criterion | Threshold | Measurement |
|-----------|-----------|-------------|
| All deliverables received | Every pipeline stage has a COMPLETE or APPROVED handoff | Handoff log audit |
| No unresolved blockers | All BLOCKED handoffs resolved before convergence | Blocker tracker |
| Timeline adherence | Pipeline completes within 8-hour circuit breaker | Timestamp analysis |
| Risk register current | All identified risks have mitigation plans | Risk register review |
| Milestone reporting | Status report covers progress, risks, and next steps | Report completeness |

---

## OpenAgentVisualizer-Specific Evaluation Criteria

### Rendering Performance
| Metric | Target | Measurement |
|--------|--------|-------------|
| Canvas FPS (50+ agents) | >= 60fps sustained | PixiJS ticker measurement |
| Sprite batch efficiency | < 10 draw calls for 50 agents | PixiJS renderer stats |
| Memory usage (50 agents) | < 200MB browser heap | Chrome DevTools memory snapshot |
| GSAP animation frame budget | < 4ms per frame for all active animations | GSAP timeline profiling |
| Rive asset load time | < 500ms per .riv file | Network + parse timing |

### Real-Time Pipeline
| Metric | Target | Measurement |
|--------|--------|-------------|
| Event ingestion throughput | > 1000 events/second via OTLP | Load test |
| End-to-end latency | OTLP span -> canvas update < 2 seconds | Timing measurement |
| WebSocket delivery rate | > 99% of events delivered | Delivery audit |
| Redis Streams lag | Consumer lag < 100 events under normal load | Redis monitoring |
| WebSocket reconnection | Automatic reconnect within 5 seconds of disconnect | Reconnection test |

### Gamification Quality
| Metric | Target | Measurement |
|--------|--------|-------------|
| XP calculation accuracy | 100% match to defined formulas | Unit test verification |
| Idempotency | Zero duplicate XP from replayed events | Idempotency test |
| Level progression | Correct level at all XP thresholds | Threshold test |
| Achievement triggers | All defined achievements fire on correct conditions | Achievement test |

### SDK Integration
| Metric | Target | Measurement |
|--------|--------|-------------|
| Framework coverage | LangChain, CrewAI, AutoGen, OpenAI, Anthropic | Integration test suite |
| Event emission accuracy | 100% of agent actions produce correct events | Event validation |
| PII redaction | Zero PII leakage in configured redaction patterns | Redaction test |
| Ring buffer batching | Events batched correctly, no data loss at buffer capacity | Buffer test |

---

## Pipeline Success Criteria

The pipeline is considered successful when ALL of the following are met:

1. **All tracks complete** — Every active track (Product + Engineering) has reached its final stage with `status: COMPLETE`
2. **No CRITICAL findings** — Code Reviewer and QA Engineer have zero unresolved CRITICAL findings
3. **Canvas performance proven** — 50+ agents at 60fps with < 200MB memory confirmed
4. **Real-time pipeline proven** — OTLP -> Redis Streams -> WebSocket delivers events within 2 seconds at > 99% delivery rate
5. **Gamification engine validated** — XP, levels, and achievements function correctly with idempotent event processing
6. **SDK adapters verified** — All 5 framework adapters emit correct events through the OTLP pipeline
7. **Loop detection validated** — Deliberate loops detected and alerted within configured window
8. **Session replay functional** — Historical events retrievable with correct causal ordering
9. **Cross-product integration documented** — OpenTrace, OpenHandoff, OpenMind integration points have defined API contracts
10. **Convergence gate passed** — DevOps Platform, Project Manager, and QA Engineer have signed off
11. **No unresolved blockers** — All BLOCKED handoffs resolved
