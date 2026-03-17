import { Container, Text } from 'pixi.js';

export class AgentLabel {
  private container: Container;
  private nameText: Text;
  private roleText: Text;

  constructor(name: string, role: string) {
    this.container = new Container();
    this.nameText = new Text({ text: name, style: { fontSize: 11, fill: 0xe2e8f0, fontWeight: 'bold' } } as any);
    this.roleText = new Text({ text: role, style: { fontSize: 9, fill: 0x94a3b8 } } as any);
    this.nameText.x = -(this.nameText.width / 2);
    this.nameText.y = -36;
    this.roleText.x = -(this.roleText.width / 2);
    this.roleText.y = -24;
    this.container.addChild(this.nameText, this.roleText);
  }

  get view(): Container {
    return this.container;
  }

  update(name: string, role: string) {
    this.nameText.text = name;
    this.roleText.text = role;
  }
}
