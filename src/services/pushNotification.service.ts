import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

@Injectable()
export class PushNotificationService {
  gatewayUrl: string = process.env.GATEWAY_URL ?? "http://localhost:3000";
  gatewayToken: string = process.env.GATEWAY_TOKEN ?? "gateway-token";

  constructor(private readonly httpService: HttpService) {}

  /**
   * Sends a push notification to a specific user.
   * 
   * @param uuid - The ID of the user to send a push notification
   * @param title - The title that'll be shown in the notification.
   * @param body - The body of the notification.
   *
   * @throws {InternalServerErrorException} If there's an error trying to communicate with the gateway or it had trouble sending the notification to the user
   */
  async notifyUser(uuid: string, title: string, body: string): Promise<void> {
    const url = `${this.gatewayUrl}/notifications`;
    const data = { uuid, title, body };
    const headers = {
      headers: {
        Authorization: `Bearer ${this.gatewayToken}`
      }
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
}
