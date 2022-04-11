
    export type PlayerQuestDto = Readonly<{
        id:string;
        player: string;
        created_date: Date;
        created_block: string;
        name: string;
        total_items: number;
        completed_items: number;
        claim_trx_id: string;
        claim_date: Date;
        reward_qty: number;
        refresh_trx_id: string;
        rewards: number;
        league: number;
      }>;