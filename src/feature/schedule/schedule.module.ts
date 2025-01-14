import { Module } from '@nestjs/common';
import { ApiModule } from '../../shared/api';
import { DbModule } from '../../shared/db';
import { GameModule } from '../../shared/game';
import { BattlePollService } from './battle-poll.service';
import { CardPollService } from './card-poll.service';
import { ScheduleController } from './schedule.controller';
@Module({
  imports: [ApiModule, DbModule, GameModule],

  providers: [BattlePollService, CardPollService, ScheduleController],
})
export class ScheduleModule {}
