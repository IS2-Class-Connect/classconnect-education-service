import { Injectable } from "@nestjs/common";
import axios from "axios";

@Injectable()
export class PushNotificationService {
  gatewayUrl: string = process.env.GATEWAY_URL ?? "http://localhost:3000";
  gatewayToken: string = process.env.GATEWAY_TOKEN ?? "gateway-token";

  constructor() {}

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
    const data = { uuid: uuid, title: title, body: body};
    try {
      const res = await axios.post(url, data);
      const status = res.status.valueOf();
      return 200 <= status && status < 300;
    } catch (e) {
      return false;
    }
  }
}
