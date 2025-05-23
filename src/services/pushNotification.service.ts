import { Injectable } from "@nestjs/common";
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
   * @returns true if the user was successfully notified else returns false.
   */
  async notifyUser(uuid: string, title: string, body: string): Promise<boolean> {
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
      return 200 <= status && status < 300;
    } catch (error) {
      console.error("Faild to send push notification", {
        error: error,
        uuid: uuid,
        title: title,
        body: body,
      })
      return false;
    }
  }
}
