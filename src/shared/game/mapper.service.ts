import { Injectable } from '@nestjs/common';
import _ from 'lodash';
import moment from 'moment';
import {
  BattleDto,
  CardDetailDto,
  TeamDetailedDto,
  TransactionDto,
} from '../api';
import { Battle } from '../db';
import { GameService } from './game.service';

@Injectable()
export class MapperService {
  /**
   * Map a list of numeric card_detail_ids to full CardDetails objects
   *
   * @param {number[]} cardDetailIds list of numeric card details ids, usually card_detail_id on api responses
   * @param {CardDetailDto[]} allCards list of all cards in the game, returned by getDetails on the api
   * @returns {CardDetailDto[]} the card details for the given ids
   */
  static mapCardDetailIdsToCards(
    cardDetailIds: number[],
    allCards: CardDetailDto[],
  ): CardDetailDto[] {
    return _.chain(cardDetailIds)
      .map((id) => allCards.find((card) => card.id === id))
      .value();
  }

  static mapCardMana(card: CardDetailDto, level: number): number {
    let mana = card.stats.mana;

    if (Array.isArray(mana)) {
      mana = mana[level];
    }

    return mana;
  }

  static mapWinnerAndLoser(battle: Battle) {
    let winner: TeamDetailedDto;
    let loser: TeamDetailedDto;

    if (battle.winner === battle.team1.player) {
      winner = battle.team1;
      loser = battle.team2;
    } else {
      winner = battle.team2;
      loser = battle.team1;
    }

    return { winner, loser };
  }

  static mapLeagueName(rating: number, power?: number): string {
    // TODO: could cache this, minor performance issue (cpu)
    const sortedLeagues = _.chain(GameService.LEAGUES)
      .sortBy('min_rating')
      .reverse()
      .value();

    for (const league of sortedLeagues) {
      if (
        rating >= league.min_rating &&
        (!power || power >= league.min_power)
      ) {
        return league.name;
      }
    }
    return _.last(sortedLeagues).name;
  }

  static mapBattles(transactions: TransactionDto[]): Battle[] {
    return transactions
      .filter((it) => it.success && !!it.result)
      .map(MapperService.mapBattle)
      .filter((it) => !!it);
  }

  static mapBattle(transaction: TransactionDto): Battle {
    if (!transaction.success || !transaction.result) {
      return undefined;
    }

    const battle: BattleDto = JSON.parse(transaction.result);

    if (battle.details?.type === 'Surrender') {
      return undefined;
    }

    return {
      id: battle.id,
      blockNumber: transaction.block_num,
      timestamp: moment(transaction.created_date).unix(),
      manaCap: battle.mana_cap,
      players: battle.players,
      ruleset: battle.ruleset,
      team1: battle.details.team1,
      team2: battle.details.team2,
      winner: battle.winner,
      loser:
        battle.winner === battle.details.team1.player
          ? battle.details.team2.player
          : battle.details.team1.player,
      leagueName: MapperService.mapLeagueName(battle.players[0].initial_rating),
    };
  }

  static mapRarityNumberToString(rarity: number): string {
    switch (rarity) {
      case 1:
        return 'Common';
      case 2:
        return 'Rare';
      case 3:
        return 'Epic';
      case 4:
        return 'Legendary';
      default:
        return 'Unknown';
    }
  }

  static mapColorToSplinter(color: string) {
    switch (color) {
      case 'Red':
        return 'Fire';
      case 'Blue':
        return 'Water';
      case 'Green':
        return 'Earth';
      case 'White':
        return 'Life';
      case 'Black':
        return 'Death';
      case 'Gold':
        return 'Dragon';
      case 'Gray':
        return 'Neutral';
      default:
        return 'Unknown';
    }
  }

  static mapEditionString(editionIndex: number) {
    switch (editionIndex) {
      case 0:
        return 'Alpha';
      case 1:
        return 'Beta';
      case 2:
        return 'Promo';
      case 3:
        return 'Reward';
      case 4:
        return 'Untamed';
      case 5:
        return 'Dice';
      case 7:
        return 'Chaos';
      default:
        return 'Unknown';
    }
  }
}
