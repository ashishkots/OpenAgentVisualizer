// Rive animation controller for agent avatars
// Loads a .riv file and drives the AgentStateMachine state input

export interface RiveInstance {
  stateMachineInputs: (name: string) => Array<{ name: string; value: number }> | undefined;
  cleanup: () => void;
}

export class AgentAvatarRive {
  private rive: RiveInstance | null = null;
  private stateInput: { name: string; value: number } | null = null;

  async load(canvas: HTMLCanvasElement, rivSrc: string): Promise<void> {
    // Dynamic import to avoid SSR/jsdom issues
    const { Rive } = await import('@rive-app/canvas');
    this.rive = new Rive({
      src: rivSrc,
      canvas,
      autoplay: true,
      stateMachines: 'AgentStateMachine',
      onLoad: () => {
        const inputs = this.rive!.stateMachineInputs('AgentStateMachine');
        this.stateInput = inputs?.find((i) => i.name === 'agentState') ?? null;
      },
    }) as unknown as RiveInstance;
  }

  // State index: 0=idle, 1=working, 2=thinking, 3=communicating, 4=error
  setState(stateIndex: number) {
    if (this.stateInput) {
      this.stateInput.value = stateIndex;
    }
  }

  destroy() {
    this.rive?.cleanup();
    this.rive = null;
    this.stateInput = null;
  }
}
