import { CurrencyDto } from '@earnkeeper/ekp-sdk';
import { CoingeckoService } from '@earnkeeper/ekp-sdk-nestjs';
import { Injectable } from '@nestjs/common';
import { validate } from 'bycontract';
import _ from 'lodash';
import moment from 'moment';
import {
  CardService,
  MarketService,
  ResultsService,
  TeamResults,
} from '../../shared/game';
import { BattleForm, DEFAULT_BATTLE_FORM } from '../../util';
import { PlannerDocument } from './ui/planner.document';

@Injectable()
export class PlannerService {
  constructor(
    private marketService: MarketService,
    private cardService: CardService,
    private resultsService: ResultsService,
    private coingeckoService: CoingeckoService,
  ) {}

  async getPlannerDocuments(
    form: BattleForm,
    subscribed: boolean,
    currency: CurrencyDto,
  ) {
    validate([form, form.manaCap], ['object', 'number']);

    const { teams, battles } = await this.resultsService.getTeamResults(
      form.manaCap,
      form.ruleset ?? DEFAULT_BATTLE_FORM.ruleset,
      form.leagueGroup ?? DEFAULT_BATTLE_FORM.leagueGroup,
      subscribed ?? false,
      5,
    );

    const cardPrices: Record<string, number> =
      await this.marketService.getMarketPrices();

    const playerCards = await this.cardService.getPlayerCards(form.playerName);

    for (const card of playerCards) {
      delete cardPrices[card.hash];
    }

    const plannerDocuments = await this.mapDocuments(
      teams.filter((it) => it.battles > 5),
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
        const mana = team.summoner.mana + _.sumBy(team.monsters, 'mana');

        const monsters = [];

        monsters.push({
          id: team.summoner.id,
          fiatSymbol: currency.symbol,
          icon: `https://d36mxiodymuqjm.cloudfront.net/card_art/${team.summoner.name}.png`,
          level: team.summoner.level,
          mana: team.summoner.mana,
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
            mana: monster.mana,
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

        return {
          id: team.id,
          updated: now,
          battles: team.battles,
          splinterIcon: `https://d36mxiodymuqjm.cloudfront.net/website/icons/icon-element-${team.summoner.splinter.toLowerCase()}-2.svg`,
          fiatSymbol: currency.symbol,
          mana,
          monsterCount: team.monsters.length,
          monsters,
          owned: price === 0 ? 'Yes' : ' No',
          price,
          splinter: team.summoner.splinter,
          summonerName: team.summoner.name,
          summonerIcon: `https://d36mxiodymuqjm.cloudfront.net/card_art/${team.summoner.name}.png`,
          summonerCardImg: `https://d36mxiodymuqjm.cloudfront.net/cards_by_level/${team.summoner.edition.toLowerCase()}/${
            team.summoner.name
          }_lv${team.summoner.level}.png`,
          summonerEdition: team.summoner.edition,
          winpc: (team.wins * 100) / team.battles,
        };
      })
      .value();
  }
}
