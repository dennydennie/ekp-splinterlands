import { CurrencyDto } from '@earnkeeper/ekp-sdk';
import { Injectable } from '@nestjs/common';
import { validate } from 'bycontract';
import _, { identity } from 'lodash';
import moment from 'moment';
import { ApiService, PlayerBattleDto, PlayerQuestDto } from '../../shared/api';
import { IgnRepository } from '../../shared/db';
import {
  CardService,
  MarketService,
  ResultsService,
  TeamResults,
} from '../../shared/game';
import { DEFAULT_PLANNER_FORM, PlannerForm } from '../../util';
import { PlannerDocument } from './ui/planner.document';
import { PlayerQuestDocument} from './ui/player-quest.document';

@Injectable()
export class PlannerService {
  constructor(
    private cardService: CardService,
    private ignRepository: IgnRepository,
    private marketService: MarketService,
    private resultsService: ResultsService,
    private apiService: ApiService,
  ) {}

   
  async getPlannerDocuments(
    form: PlannerForm,
    subscribed: boolean,
    currency: CurrencyDto,

  ) {
    validate([form, form.manaCap], ['object', 'number']);

    if (!!form.playerName) {
      this.ignRepository.save([{ id: form.playerName }]);
    }

    const { teams, battles } = await this.resultsService.getTeamResults(
      form.manaCap,
      form.leagueName ?? DEFAULT_PLANNER_FORM.leagueName,
      subscribed ?? false,
      5,
    );

    const cardPrices: Record<string, number> =
      await this.marketService.getMarketPrices();

    const playerCards = await this.cardService.getPlayerCards(form.playerName);

    for (const card of playerCards) {
      delete cardPrices[card.hash];
    }

    const quest = await this.apiService.fetchPlayerQuest(form.playerName);
    console.log(quest);

    const plannerDocuments = await this.mapDocuments(
      teams,
      cardPrices,
      currency,
  
    );

  
    return { plannerDocuments, battles };
  }

  async mapDocuments(
    detailedTeams: TeamResults[],
    cardPrices: Record<string, number>,
    currency: CurrencyDto,
  ): Promise<PlannerDocument[]> {
    const now = moment().unix();
    const conversionRate = await this.marketService.getConversionRate(
      'usd-coin',
      currency.id,
    );

    return _.chain(detailedTeams)
      .map((team) => {
        const mana =
          team.summoner.stats.mana +
          _.chain(team.monsters)
            .map((it) => it.stats.mana)
            .sum()
            .value();

        const monsters = [];

        monsters.push({
          id: team.summoner.id,
          fiatSymbol: currency.symbol,
          icon: `https://d36mxiodymuqjm.cloudfront.net/card_art/${team.summoner.name}.png`,
          level: team.summoner.level,
          mana: team.summoner.stats.mana,
          name: team.summoner.name,
          price: cardPrices[team.summoner.hash],
          splinter: team.summoner.splinter,
          type: 'Summoner',
        });

        // TODO: check if these are added in the right order, order is important
        monsters.push(
          ...team.monsters.map((monster) => ({
            id: monster.id,
            edition: monster.edition,
            fiatSymbol: currency.symbol,
            icon: `https://d36mxiodymuqjm.cloudfront.net/card_art/${monster.name}.png`,
            level: team.summoner.level,
            mana: monster.stats.mana,
            name: monster.name,
            price: cardPrices[monster.hash],
            splinter: monster.splinter,
            type: 'Monster',
          })),
        );

        const price = _.chain(monsters)
          .filter((it) => !!it.price)
          .sumBy('price')
          .thru((it) => it * conversionRate)
          .value();

        const document: PlannerDocument = {
          id: team.id,
          updated: now,
          battles: team.battles,
          fiatSymbol: currency.symbol,
          mana,
          monsterCount: team.monsters.length,
          monsters,
          owned: price === 0 ? 'Yes' : ' No',
          price,
          rulesets: [...team.rulesets],
          splinter: team.summoner.splinter,
          summonerName: team.summoner.name,
          summonerIcon: `https://d36mxiodymuqjm.cloudfront.net/card_art/${team.summoner.name}.png`,
          summonerCardImg: `https://d36mxiodymuqjm.cloudfront.net/cards_by_level/${team.summoner.edition.toLowerCase()}/${
            team.summoner.name
          }_lv${team.summoner.level}.png`,
          summonerEdition: team.summoner.edition,
          winpc: (team.wins * 100) / team.battles,
        };
       

        return document;
      })
      .value();
  }

  

}
