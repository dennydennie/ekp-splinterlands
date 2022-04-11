import { DocumentDto } from '@earnkeeper/ekp-sdk';

export class PlayerQuestDocument extends DocumentDto {
  constructor(properties: PlayerQuestDocument) {
    super(properties);
  }
  readonly id:string;
  readonly player: string;
  readonly createdDate: Date;
  readonly createdBlock: string;
  readonly name: string;
  readonly totalItems: number;
  readonly completedItems: number;
  readonly claimTrxId: string;
  readonly claimDate: Date;
  readonly rewardQty: number;
  readonly refreshTrxId: string;
  readonly rewards: string;
  readonly league: number;
}

