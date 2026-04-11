package com.sanele.flashcard.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SessionRequest {

    @NotNull(message = "Deck ID is required")
    private Long deckId;
}
