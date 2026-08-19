package io.causora.telemetry.service;

import io.causora.events.OperationalEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class TelemetryEventPublisher {
    private static final Logger log = LoggerFactory.getLogger(TelemetryEventPublisher.class);
    private final KafkaTemplate<String, OperationalEvent> kafkaTemplate;
    private final String topic;

    public TelemetryEventPublisher(KafkaTemplate<String, OperationalEvent> kafkaTemplate,
                                   @Value("${causora.kafka.operational-events-topic}") String topic) {
        this.kafkaTemplate = kafkaTemplate;
        this.topic = topic;
    }

    public void publish(OperationalEvent event) {
        kafkaTemplate.send(topic, event.eventId().toString(), event).whenComplete((result, error) -> {
            if (error != null) {
                log.error("telemetry_publish_failed eventId={} sourceService={} eventType={}",
                        event.eventId(), event.sourceService(), event.eventType(), error);
            } else {
                log.info("telemetry_published eventId={} sourceService={} eventType={} topic={} partition={} offset={}",
                        event.eventId(), event.sourceService(), event.eventType(), topic,
                        result.getRecordMetadata().partition(), result.getRecordMetadata().offset());
            }
        });
    }
}
