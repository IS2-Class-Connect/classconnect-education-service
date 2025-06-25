import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PushNotificationService } from 'src/services/pushNotification.service';

@Module({
  imports: [HttpModule],
  providers: [PushNotificationService],
  exports: [PushNotificationService],
})
export class NotificationModule {}
