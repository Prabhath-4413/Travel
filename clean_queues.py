#!/usr/bin/env python3
import pika
import sys

def clean_queues():
    print("🧹 Connecting to RabbitMQ...\n")
    
    credentials = pika.PlainCredentials('guest', 'guest')
    connection = pika.BlockingConnection(
        pika.ConnectionParameters('localhost', 5672, '/', credentials)
    )
    channel = connection.channel()
    
    queues = ['travel.bookings', 'travel.admin']
    
    print("Purging queues...\n")
    for queue in queues:
        try:
            # Declare passive to check if queue exists and get message count
            method_frame = channel.queue_declare(queue=queue, passive=True)
            message_count = method_frame.method.message_count
            
            if message_count > 0:
                channel.queue_purge(queue)
                print(f"  ✅ Purged {message_count} messages from: {queue}")
            else:
                print(f"  ℹ️  Queue '{queue}' is empty")
        except Exception as e:
            print(f"  ❌ Error with '{queue}': {str(e)}")
    
    connection.close()
    print("\n✅ Queue cleanup complete!")

if __name__ == '__main__':
    clean_queues()