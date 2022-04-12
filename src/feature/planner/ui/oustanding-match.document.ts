import { DocumentDto } from '@earnkeeper/ekp-sdk';
import { opponentsDto } from 'src/shared/api/dto/outstanding_match.dto';

export class OustandingMatchDocument extends DocumentDto {
  constructor(properties: OustandingMatchDocument) {
    super(properties);
  }
  readonly id: string ;
  readonly created_block_num: number ;
  readonly expiration_block_num: number ;
  readonly player: string ;
  readonly team_hash: string ;
  readonly match_type: string ;
  readonly mana_cap: number ;
  readonly opponent: string ;
  readonly match_block_num: number ;
  readonly status: number ;
  readonly reveal_tx: string ;
  readonly reveal_block_id: string ;
  readonly team: string ;
  readonly summoner_level: number ;
  readonly ruleset: string ;
  readonly inactive: string ;
  readonly opponent_player: string ;
  readonly opponent_team_hash: string ;
  readonly submit_expiration_block_num: number ;
  readonly settings: string ;
  readonly app: string ;
  readonly created_date: Date ;
  readonly expiration_date: Date ;
  readonly match_date: Date ;
  readonly submit_expiration_date: Date ;
  readonly recent_opponents: opponentsDto[] ;
  readonly is_critical: boolean ;
}