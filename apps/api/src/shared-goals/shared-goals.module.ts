import { Module } from '@nestjs/common';
import { SharedGoalsController } from './shared-goals.controller';
import { SharedGoalsService } from './shared-goals.service';

@Module({ controllers: [SharedGoalsController], providers: [SharedGoalsService] })
export class SharedGoalsModule {}
