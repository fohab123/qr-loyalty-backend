import { Injectable, Logger } from '@nestjs/common';
import Expo, { ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly expo = new Expo();

  async sendPushNotification(
    pushToken: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    if (!pushToken || !Expo.isExpoPushToken(pushToken)) {
      this.logger.warn(`Invalid Expo push token: ${pushToken}`);
      return;
    }

    try {
      const [ticket] = await this.expo.sendPushNotificationsAsync([
        {
          to: pushToken,
          sound: 'default',
          title,
          body,
          data,
        },
      ]);

      if (ticket.status === 'error') {
        this.logger.error(
          `Push notification error: ${ticket.message} (details: ${JSON.stringify(ticket.details)})`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${error.message}`);
    }
  }

  async sendBulkNotifications(
    messages: Array<{ pushToken: string; title: string; body: string; data?: Record<string, unknown> }>,
  ): Promise<void> {
    const validMessages: ExpoPushMessage[] = messages
      .filter((m) => m.pushToken && Expo.isExpoPushToken(m.pushToken))
      .map((m) => ({
        to: m.pushToken,
        sound: 'default' as const,
        title: m.title,
        body: m.body,
        data: m.data,
      }));

    if (validMessages.length === 0) return;

    const chunks = this.expo.chunkPushNotifications(validMessages);

    for (const chunk of chunks) {
      try {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);
        for (const ticket of tickets) {
          if (ticket.status === 'error') {
            this.logger.error(
              `Bulk push error: ${ticket.message} (details: ${JSON.stringify(ticket.details)})`,
            );
          }
        }
      } catch (error) {
        this.logger.error(`Failed to send bulk notifications: ${error.message}`);
      }
    }
  }
}
