import { ApmService } from '@earnkeeper/ekp-sdk-nestjs';
import { Injectable } from '@nestjs/common';
import _ from 'lodash';
import moment from 'moment';
import { ApiService, CardDetailDto, TeamDetailedDto } from '../api';
import { Battle, BattleRepository } from '../db';
import { GameService } from './game.service';
import { MapperService } from './mapper.service';

const FREE_DAYS_TO_FETCH = 1;

@Injectable()
export class ResultsService {
  constructor(
    private apiService: ApiService,
    private apmService: ApmService,
    private battleRepository: BattleRepository,
    private gameService: GameService,
  ) {}

  async getTeamResults(
    manaCap: number,
    ruleset: string,
    leagueName: string,
    subscribed: boolean,
  ): Promise<{ teams: TeamResults[]; battles: Battle[] }> {
    const tx = this.apmService.startTransaction({
      name: 'PlannerService',
      op: 'getViableTeams',
    });

    const fetchSince = !subscribed
      ? moment().subtract(FREE_DAYS_TO_FETCH, 'days').unix()
      : 0;

    const sp1 = tx?.startChild({
      op: 'readBattles',
      data: {
        manaCap,
        ruleset,
        subscribed,
      },
    });

    const battles = await this.battleRepository.findBattleByManaCap(
      manaCap,
      ruleset,
      leagueName,
      fetchSince,
    );

    tx?.setData('battleCount', battles.length);

    sp1?.finish();

    const sp2 = tx?.startChild({
      op: 'fetchCardDetails',
    });

    const allCards = await this.apiService.fetchCardDetails();

    tx?.setData('allCardCount', allCards.length);

    sp2?.finish();

    const sp4 = tx?.startChild({
      op: 'computeTeams',
    });

    const viableTeams: Record<string, TeamResults> = {};

    for (const battle of battles) {
      const { winner, loser } = MapperService.mapWinnerAndLoser(battle);

      this.updateResultsWith(viableTeams, winner, allCards, true);
      this.updateResultsWith(viableTeams, loser, allCards, false);
    }

    const teams = _.values(viableTeams);

    tx?.setData('teamCount', teams.length);

    sp4?.finish();

    tx?.finish();

    return { teams, battles };
  }

  private updateResultsWith(
    viableTeams: Record<string, TeamResults>,
    team: TeamDetailedDto,
    allCards: CardDetailDto[],
    win: boolean,
  ) {
    const id: string = this.mapTeamId(team);

    let viableTeam = viableTeams[id];

    if (!viableTeam) {
      viableTeams[id] = viableTeam = this.createTeamResults(id, team, allCards);
    }

    if (win) {
      viableTeam.wins += 1;
    }

    viableTeam.battles += 1;
  }

  private createTeamResults(
    teamId: string,
    battleTeam: TeamDetailedDto,
    allCards: CardDetailDto[],
  ): TeamResults {
    const summonerCard = MapperService.mapCardDetailIdsToCards(
      [battleTeam.summoner.card_detail_id],
      allCards,
    )[0];

    return {
      id: teamId,
      wins: 0,
      battles: 0,
      summoner: {
        cardDetailId: summonerCard.id,
        level: battleTeam.summoner.level,
        mana: MapperService.mapCardMana(
          summonerCard,
          battleTeam.summoner.level,
        ),
        name: summonerCard.name,
        splinter: MapperService.mapColorToSplinter(summonerCard.color),
      },
      monsters: battleTeam.monsters.map((monster) => {
        const monsterCard = MapperService.mapCardDetailIdsToCards(
          [monster.card_detail_id],
          allCards,
        )[0];

        return {
          cardDetailId: monsterCard.id,
          level: battleTeam.summoner.level,
          mana: MapperService.mapCardMana(
            monsterCard,
            battleTeam.summoner.level,
          ),
          name: monsterCard.name,
          splinter: MapperService.mapColorToSplinter(monsterCard.color),
        };
      }),
    };
  }

  private playerHasCards(
    playerCardDetailIds: number[],
    otherTeam: TeamDetailedDto,
  ): boolean {
    const monsterCardDetailIds = otherTeam.monsters.map(
      (monster) => monster.card_detail_id,
    );

    // TODO: this can be optimized, many loops
    return (
      playerCardDetailIds.includes(otherTeam.summoner.card_detail_id) &&
      _.difference(monsterCardDetailIds, playerCardDetailIds).length === 0
    );
  }

  private mapTeamId(team: TeamDetailedDto): string {
    const orderedMonstersId = _.chain(team.monsters)
      .map((monster) => monster.card_detail_id)
      .sort()
      .join('|')
      .value();

    return `${team.summoner.card_detail_id}|${orderedMonstersId}`;
  }
}

export type TeamResults = {
  readonly id: string;
  battles: number;
  wins: number;
  readonly summoner: TeamMonster;
  readonly monsters: TeamMonster[];
};

export type TeamMonster = Readonly<{
  cardDetailId: number;
  level: number;
  mana: number;
  name: string;
  splinter: string;
}>;