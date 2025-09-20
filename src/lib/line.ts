interface LineMessage {
  type: 'text';
  text: string;
}

export async function sendLineMessage(
  channelAccessToken: string,
  userId: string,
  message: string
): Promise<boolean> {
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [{
          type: 'text',
          text: message
        }] as LineMessage[]
      })
    });

    if (!response.ok) {
      console.error('LINE API Error:', await response.text());
      return false;
    }

    console.log('Message sent successfully');
    return true;
  } catch (error) {
    console.error('LINE API Error:', error);
    return false;
  }
}

export async function broadcastLineMessage(
  channelAccessToken: string,
  message: string
): Promise<boolean> {
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify({
        messages: [{
          type: 'text',
          text: message
        }] as LineMessage[]
      })
    });

    if (!response.ok) {
      console.error('LINE API Error:', await response.text());
      return false;
    }

    console.log('Broadcast sent successfully');
    return true;
  } catch (error) {
    console.error('LINE API Error:', error);
    return false;
  }
}