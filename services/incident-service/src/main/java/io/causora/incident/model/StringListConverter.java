package io.causora.incident.model;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.List;

@Converter
public class StringListConverter implements AttributeConverter<List<String>, String> {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<List<String>> TYPE = new TypeReference<>() {};

    @Override
    public String convertToDatabaseColumn(List<String> value) {
        try { return MAPPER.writeValueAsString(value == null ? List.of() : value); }
        catch (Exception exception) { throw new IllegalArgumentException("Incident memory list cannot be serialized", exception); }
    }

    @Override
    public List<String> convertToEntityAttribute(String value) {
        try { return value == null || value.isBlank() ? List.of() : MAPPER.readValue(value, TYPE); }
        catch (Exception exception) { throw new IllegalArgumentException("Incident memory list cannot be deserialized", exception); }
    }
}
