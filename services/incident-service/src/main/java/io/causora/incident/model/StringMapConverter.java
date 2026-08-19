package io.causora.incident.model;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.Map;

@Converter
public class StringMapConverter implements AttributeConverter<Map<String, String>, String> {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<Map<String, String>> TYPE = new TypeReference<>() {};

    @Override
    public String convertToDatabaseColumn(Map<String, String> value) {
        try {
            return MAPPER.writeValueAsString(value == null ? Map.of() : value);
        } catch (Exception exception) {
            throw new IllegalArgumentException("Evidence metadata cannot be serialized", exception);
        }
    }

    @Override
    public Map<String, String> convertToEntityAttribute(String value) {
        try {
            return value == null || value.isBlank() ? Map.of() : MAPPER.readValue(value, TYPE);
        } catch (Exception exception) {
            throw new IllegalArgumentException("Evidence metadata cannot be deserialized", exception);
        }
    }
}
