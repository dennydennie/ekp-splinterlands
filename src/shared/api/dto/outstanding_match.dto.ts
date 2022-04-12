export type PlayerBattlesDto = Readonly<{
     id: string,
     created_block_num: number,
     expiration_block_num: number,
     player: string,
     team_hash: string,
     match_type: string,
     mana_cap: number,
     opponent: string,
     match_block_num: number,
     status: number,
     reveal_tx: string,
     reveal_block_id: string,
     team: string,
     summoner_level: number,
     ruleset: string,
     inactive: string,
     opponent_player: string,
     opponent_team_hash: string,
     submit_expiration_block_num: number,
     settings: string,
     app: string,
     created_date: Date,
     expiration_date: Date,
     match_date: Date,
     submit_expiration_date: Date,
     //recent_opponents: opponentsDto[],
     is_critical: boolean
}>;

export type opponentsDto = Readonly<{
    id: string;
    name: string;

}>;