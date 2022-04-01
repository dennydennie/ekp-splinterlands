import { DocumentDto } from '@earnkeeper/ekp-sdk';

export class PlannerDocument extends DocumentDto {
  constructor(properties: PlannerDocument) {
    super(properties);
  }

  readonly battles: number;
  readonly fiatSymbol: string;
  readonly mana: number;
  readonly monsterCount: number;
  readonly price: number;
  readonly splinter: string;
  readonly splinterIcon: string;
  readonly summonerName: string;
  readonly summonerIcon: string;
  readonly winpc: number;

  readonly monsters: {
    id: string;
    fiatSymbol: string;
    icon: string;
    level: number;
    mana: string;
    name: string;
    price: number;
    splinter: string;
    type: string;
  }[];
}
