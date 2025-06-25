import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PushNotificationService {
  private gatewayUrl: string | undefined = process.env.GATEWAY_URL; // ?? 'http://localhost:3000';
  private gatewayToken: string | undefined = process.env.GATEWAY_TOKEN; // ?? 'gateway-token';
  private validTopics: Set<string> = new Set([
    'task-assignment',
    'message-received', // is the one used for feedback noti
    'deadline-reminder',
  ]);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Sends a push notification to a specific user.
   *
   * @param uuid  - The ID of the user to send a push notification
   * @param title - The title that'll be shown in the notification.
   * @param body  - The body of the notification.
   * @param topic - The topic of the notification.
   *
   * @throws {InternalServerErrorException} If there's an error trying to communicate with the gateway or it had trouble sending the notification to the user
   */
  private async notifyUserPush(
    uuid: string,
    title: string,
    body: string,
    topic: string,
  ): Promise<void> {
    // if (!this.gatewayUrl || !this.gatewayToken) {
    //   // mock functionality
    //   logger.log(
    //     `Notifying user ${uuid} with title\n` +
    //       `"${title}"\n` +
    //       `and body\n` +
    //       `"${body}"\n` +
    //       `on topic "${topic}"`,
    //   );
    //   return;
    // }
    if (!this.validTopics.has(topic)) {
      throw new InternalServerErrorException('Got an invalid notification topic', topic);
    }
    logger.debug(
      `Notifying user ${uuid} with title\n` +
        `"${title}"\n` +
        `and body\n` +
        `"${body}"\n` +
        `on topic "${topic}"`,
    );

    const url = `${this.gatewayUrl}/notifications`;
    const data = { uuid, title, body, topic };
    const headers = {
      headers: {
        Authorization: `Bearer ${this.gatewayToken}`,
      },
    };

    try {
      const res = await firstValueFrom(this.httpService.post(url, data, headers));
      const status = res.status;
      if (status < 200 || 300 <= status) {
        throw new InternalServerErrorException('Gateway failed to resolve push notification');
      }
    } catch (error) {
      throw new InternalServerErrorException('Failed to send push notification');
    }
  }

  /**
   * Notifies the user of a new task assignment.
   *
   * @param uuid  - The ID of the user to send a push notification.
   * @param title - The title that'll be shown in the notification.
   * @param body  - The body of the notification.
   *
   * @throws {InternalServerErrorException} If there's an error trying to communicate with the gateway or it had trouble sending the notification to the user.
   */
  async notifyTaskAssignment(uuid: string, title: string, body: string): Promise<void> {
    return await this.notifyUserPush(uuid, title, body, 'task-assignment');
  }

  /**
   * Notifies the user of an upcoming deadline.
   *
   * @param uuid  - The ID of the user to send a push notification.
   * @param title - The title that'll be shown in the notification.
   * @param body  - The body of the notification.
   *
   * @throws {InternalServerErrorException} If there's an error trying to communicate with the gateway or it had trouble sending the notification to the user.
   */
  async notifyDeadlineReminder(uuid: string, title: string, body: string): Promise<void> {
    return await this.notifyUserPush(uuid, title, body, 'deadline-reminder');
  }

  /**
   * Notifies the user of a received feedback in a course.
   *
   * @param uuid  - The ID of the user to send a push notification.
   * @param title - The title that'll be shown in the notification.
   * @param body  - The body of the notification.
   *
   * @throws {InternalServerErrorException} If there's an error trying to communicate with the gateway or it had trouble sending the notification to the user.
   */
  async notifyFeedback(uuid: string, title: string, body: string): Promise<void> {
    return await this.notifyUserPush(uuid, title, body, 'message-received');
  }
}

const logger = new Logger(PushNotificationService.name);
